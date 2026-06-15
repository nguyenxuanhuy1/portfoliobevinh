import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

/**
 * Uploads a local file to the configured Kaggle Dataset.
 * @param {string} filePath - Path to the local file to upload.
 */
async function uploadToDataset(filePath) {
  const username = process.env.KAGGLE_USERNAME;
  const key = process.env.KAGGLE_KEY;
  const fileName = path.basename(filePath);

  console.log(`[Kaggle API] Step 1: Uploading ${fileName} to dataset...`);

  const datasetDir = path.resolve(process.cwd(), 'kaggle', 'kaggle_dataset');
  if (fs.existsSync(datasetDir)) {
    const existingFiles = fs.readdirSync(datasetDir);
    for (const file of existingFiles) {
      if (file !== 'dataset-metadata.json') {
        fs.unlinkSync(path.join(datasetDir, file));
      }
    }
  } else {
    fs.mkdirSync(datasetDir, { recursive: true });
  }

  // Copy file into dataset folder
  fs.copyFileSync(filePath, path.join(datasetDir, fileName));

  const env = { 
    ...process.env, 
    KAGGLE_USERNAME: username, 
    KAGGLE_KEY: key, 
    KAGGLE_API_TOKEN: key,
    PYTHONIOENCODING: 'utf-8',
    PYTHONUTF8: '1'
  };

  const { stdout } = await execPromise(
    `kaggle datasets version -p "${datasetDir}" -m "Upload ${fileName}" --dir-mode zip`,
    {
      env,
      shell: true
    }
  );

  console.log('[Kaggle API] Dataset uploaded successfully:', stdout);
}

/**
 * Triggers the Kaggle Notebook run using Kaggle CLI.
 */
async function triggerKernel() {
  const username = process.env.KAGGLE_USERNAME;
  const key = process.env.KAGGLE_KEY;
  const kernelSlug = process.env.KAGGLE_KERNEL_SLUG;
  const datasetSlug = process.env.KAGGLE_DATASET_SLUG;
  const kernelType = process.env.KAGGLE_KERNEL_TYPE || 'notebook';

  if (!username || !key || !kernelSlug || !datasetSlug) {
    throw new Error('Kaggle environment variables must be configured.');
  }

  console.log('[Kaggle API] Step 2: Regenerating metadata and files...');

  const kernelDir = path.resolve(process.cwd(), 'kaggle', 'kaggle_kernel');
  const metadataPath = path.join(kernelDir, 'kernel-metadata.json');

  let codeFile = 'script.py';
  if (kernelType === 'notebook') {
    codeFile = 'notebook.ipynb';
    
    const scriptPath = path.join(kernelDir, 'script.py');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    const notebookContent = {
      cells: [
        {
          cell_type: 'code',
          execution_count: null,
          metadata: {},
          outputs: [],
          source: scriptContent.split('\n').map(line => line + '\n')
        }
      ],
      metadata: {
        kernelspec: {
          display_name: 'Python 3',
          language: 'python',
          name: 'python3'
        },
        language_info: {
          name: 'python'
        }
      },
      nbformat: 4,
      nbformat_minor: 4
    };
    fs.writeFileSync(path.join(kernelDir, 'notebook.ipynb'), JSON.stringify(notebookContent, null, 2));
  } else {
    const notebookPath = path.join(kernelDir, 'notebook.ipynb');
    if (fs.existsSync(notebookPath)) {
      fs.unlinkSync(notebookPath);
    }
  }

  const metadata = {
    id: `${username}/${kernelSlug}`,
    title: kernelSlug,
    code_file: codeFile,
    language: 'python',
    kernel_type: kernelType,
    is_private: true,
    enable_gpu: false,
    enable_internet: true,
    dataset_sources: [`${username}/${datasetSlug}`],
    competition_sources: [],
    kernel_sources: []
  };

  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  console.log('[Kaggle API] Pushing and triggering kernel...');

  const env = {
    ...process.env,
    KAGGLE_USERNAME: username,
    KAGGLE_KEY: key,
    KAGGLE_API_TOKEN: key,
    PYTHONIOENCODING: 'utf-8',
    PYTHONUTF8: '1'
  };

  const { stdout, stderr } = await execPromise(
    `kaggle kernels push -p "${kernelDir}"`,
    { env }
  );

  console.log('[Kaggle API] Kernel triggered:', stdout);
  if (stderr) {
    console.warn('[Kaggle API] Trigger warning:', stderr);
  }
}

/**
 * Polls the kernel execution status.
 */
async function pollKernelUntilDone(maxWaitMinutes = 30) {
  const username = process.env.KAGGLE_USERNAME;
  const key = process.env.KAGGLE_KEY;
  const kernelSlug = process.env.KAGGLE_KERNEL_SLUG;

  console.log(`[Kaggle API] Step 3: Polling status for ${username}/${kernelSlug}...`);

  // Wait 10 seconds before polling to avoid catching the previous run's "complete" status
  await new Promise((resolve) => setTimeout(resolve, 10000));

  const intervalMs = 15000;
  const maxAttempts = (maxWaitMinutes * 60 * 1000) / intervalMs;
  
  const env = {
    ...process.env,
    KAGGLE_USERNAME: username,
    KAGGLE_KEY: key,
    KAGGLE_API_TOKEN: key,
    PYTHONIOENCODING: 'utf-8',
    PYTHONUTF8: '1'
  };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const { stdout } = await execPromise(
        `kaggle kernels status ${username}/${kernelSlug}`,
        { env }
      );

      console.log(`[Kaggle API] Status: ${stdout.trim()} (Attempt ${attempt + 1})`);

      if (stdout.includes('"KernelWorkerStatus.COMPLETE"') || stdout.toLowerCase().includes('complete')) {
        return 'complete';
      }
      if (stdout.includes('"KernelWorkerStatus.ERROR"') || stdout.toLowerCase().includes('error')) {
        throw new Error('Kaggle Kernel execution failed.');
      }
      if (stdout.includes('"KernelWorkerStatus.CANCELLED"') || stdout.toLowerCase().includes('cancelled')) {
        throw new Error('Kaggle Kernel execution was cancelled.');
      }
    } catch (err) {
      if (err.message && (err.message.includes('failed') || err.message.includes('error'))) {
        throw err;
      }
      console.warn(`[Kaggle API] Polling warning (Attempt ${attempt + 1}): ${err.message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('Kaggle Kernel execution timed out.');
}

/**
 * Downloads the kernel outputs using Kaggle CLI.
 */
async function downloadOutputs(downloadPath) {
  const username = process.env.KAGGLE_USERNAME;
  const key = process.env.KAGGLE_KEY;
  const kernelSlug = process.env.KAGGLE_KERNEL_SLUG;

  console.log(`[Kaggle API] Step 4: Downloading outputs to ${downloadPath}...`);

  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
  }

  const env = {
    ...process.env,
    KAGGLE_USERNAME: username,
    KAGGLE_KEY: key,
    KAGGLE_API_TOKEN: key,
    PYTHONIOENCODING: 'utf-8',
    PYTHONUTF8: '1'
  };

  const { stdout, stderr } = await execPromise(
    `kaggle kernels output ${username}/${kernelSlug} -p "${downloadPath}"`,
    { env }
  );

  console.log('[Kaggle API] Outputs downloaded successfully:', stdout);
  if (stderr) {
    console.warn('[Kaggle API] Download warning:', stderr);
  }
}

/**
 * Polls Kaggle datasets files to ensure the uploaded file is active in the latest version.
 */
async function pollDatasetVersionReady(filename, maxWaitSeconds = 120) {
  const username = process.env.KAGGLE_USERNAME;
  const key = process.env.KAGGLE_KEY;
  const datasetSlug = process.env.KAGGLE_DATASET_SLUG;

  console.log(`[Kaggle API] Step 1.5: Polling dataset for active file "${filename}"...`);

  const intervalMs = 5000;
  const maxAttempts = (maxWaitSeconds * 1000) / intervalMs;

  const env = {
    ...process.env,
    KAGGLE_USERNAME: username,
    KAGGLE_KEY: key,
    KAGGLE_API_TOKEN: key,
    PYTHONIOENCODING: 'utf-8',
    PYTHONUTF8: '1'
  };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const { stdout } = await execPromise(
        `kaggle datasets files ${username}/${datasetSlug}`,
        { env }
      );

      if (stdout.includes(filename)) {
        console.log(`[Kaggle API] Dataset version active: "${filename}" ready!`);
        return true;
      }
    } catch (err) {
      console.warn(`[Kaggle API] Dataset polling warning: ${err.message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Timeout waiting for dataset version containing "${filename}" to become active.`);
}

/**
 * Runs the full Kaggle document conversion process.
 * @param {string} filePath - Path of the uploaded file.
 * @param {string} tempDownloadDir - Target directory for downloading outputs.
 */
export async function runKagglePipeline(filePath, tempDownloadDir) {
  const fileName = path.basename(filePath);

  // 1. Upload to Dataset
  await uploadToDataset(filePath);

  // 1.5. Wait for Dataset version to be ready/active
  await pollDatasetVersionReady(fileName);

  // 2. Trigger Kernel
  await triggerKernel();

  // 3. Poll Kernel Status
  await pollKernelUntilDone();

  // 4. Download Outputs
  await downloadOutputs(tempDownloadDir);
}

export default {
  runKagglePipeline
};
