import fs from 'fs';
import path from 'path';
import cloudinary from '../config/cloudinary.js';
import congDongOnThiRepo from '../repository/congdongonthi.repo.js';
import { splitPdfIfLarge } from '../utils/pdfSplitter.js';


export async function uploadDocument(filePath, folder = 'documents', customPublicId = null) {
  const ext = path.extname(filePath).toLowerCase();
  const baseName = path.basename(filePath, ext);

  // Use 'auto' for images and PDFs so Cloudinary registers them correctly under their native types (bypassing the 10MB raw limit),
  // and 'raw' for other documents (Word, Excel, PPT, MD) to avoid Cloudinary security blocking.
  const isAuto = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.pdf'].includes(ext);
  const resourceType = isAuto ? 'auto' : 'raw';

  // Cloudinary's raw resource type does not automatically append file extensions,
  // so we must include it in the public_id.
  // For auto resource types (like images and PDFs), Cloudinary automatically appends the
  // extension to the delivery URL, so we must omit it.
  const publicId = customPublicId || (resourceType === 'raw'
    ? `${baseName}_${Date.now()}${ext}`
    : `${baseName}_${Date.now()}`);

  console.log(`[Upload Service] Uploading ${path.basename(filePath)} (type: ${resourceType}) to Cloudinary folder "${folder}"...`);

  // Use upload_large to support chunked upload for larger files (wrapped in Promise for SDK compatibility)
  const uploadResult = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_large(filePath, {
      resource_type: resourceType,
      folder: folder,
      public_id: publicId
    }, (error, result) => {
      if (error) {
        console.error('[Upload Service] Error uploading to Cloudinary:', error);
        return reject(error);
      }
      resolve(result);
    });
  });

  console.log(`[Upload Service] Upload completed successfully. URL: ${uploadResult.secure_url}`);
  return uploadResult.secure_url;
}

/**
 * Extracts public_id and resource_type from a Cloudinary secure URL.
 */
export function parseCloudinaryUrl(url) {
  if (!url) return null;

  let resourceType = 'raw';
  if (url.includes('/image/upload/')) {
    resourceType = 'image';
  } else if (url.includes('/video/upload/')) {
    resourceType = 'video';
  }

  const regex = /\/upload\/(?:v\d+\/)?(.+)$/;
  const match = url.match(regex);
  if (match && match[1]) {
    let publicId = decodeURIComponent(match[1]);

    // For images/videos, Cloudinary's public_id excludes the extension, so strip it
    if (resourceType !== 'raw') {
      const extIndex = publicId.lastIndexOf('.');
      if (extIndex !== -1) {
        publicId = publicId.substring(0, extIndex);
      }
    }

    return { publicId, resourceType };
  }

  return null;
}

/**
 * Deletes an asset from Cloudinary by its URL.
 */
export async function deleteFromCloudinary(url) {
  const parsed = parseCloudinaryUrl(url);
  if (!parsed) return null;

  const { publicId, resourceType } = parsed;
  console.log(`[Cloudinary Service] Deleting public_id "${publicId}" (type: ${resourceType}) from Cloudinary...`);

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    console.log(`[Cloudinary Service] Delete result for "${publicId}":`, result);
    return result;
  } catch (error) {
    console.error(`[Cloudinary Service] Failed to delete public_id "${publicId}":`, error);
    return null;
  }
}



async function saveToDatabase(mdFiles, downloadUrls, metadata) {
  console.log(`[Database Service] Persisting ${mdFiles.length} Markdown document(s) to database...`);
  const savedDocs = [];

  if (metadata.level === 1) {
    await congDongOnThiRepo.resetHotDocuments();
  }

  for (const file of mdFiles) {
    const doc = await congDongOnThiRepo.create({
      subject: metadata.subject,
      title: metadata.title,
      description: metadata.description,
      level: metadata.level,
      downloads: 0,
      views: 0,
      fileType: metadata.fileType,
      fileSize: metadata.fileSize,
      tags: metadata.tags,
      mdDownloadUrl: file.content,
      downloadUrl: downloadUrls
    });
    savedDocs.push(doc);
  }

  return savedDocs;
}

export async function runPipeline(filePath, originalName, metadata, mdFilePath = null) {
  const chunkFilesCreated = [];
  let mdUrl = '';

  try {
    const originalExt = path.extname(originalName).toLowerCase();
    const originalBase = path.basename(originalName, originalExt);
    const downloadUrls = [];

    // Split the PDF if it is larger than 10MB
    const splitFiles = await splitPdfIfLarge(filePath, 10 * 1024 * 1024);

    for (let i = 0; i < splitFiles.length; i++) {
      const fileToUpload = splitFiles[i];
      let url;
      if (splitFiles.length > 1) {
        // Generate custom public id with format originalBase-index
        const customPublicId = `${originalBase}-${i + 1}`;
        url = await uploadDocument(fileToUpload, 'documents', customPublicId);
        // Track the chunk file path for cleanup in finally block
        chunkFilesCreated.push(fileToUpload);
      } else {
        url = await uploadDocument(fileToUpload, 'documents');
      }
      downloadUrls.push(url);
    }

    if (mdFilePath) {
      console.log(`[Pipeline Service] Uploading manual MD file: ${path.basename(mdFilePath)}`);
      mdUrl = await uploadDocument(mdFilePath, 'documents');
    }

    // Save to Database
    const doc = await congDongOnThiRepo.create({
      subject: metadata.subject,
      title: metadata.title,
      description: metadata.description,
      level: metadata.level,
      downloads: 0,
      views: 0,
      fileType: metadata.fileType,
      fileSize: metadata.fileSize,
      tags: metadata.tags,
      mdDownloadUrl: mdUrl,
      downloadUrl: downloadUrls
    });

    return [doc];
  } finally {
    console.log('[Pipeline Service] Cleaning up temporary files...');
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    if (mdFilePath && fs.existsSync(mdFilePath)) {
      fs.unlinkSync(mdFilePath);
    }
    for (const chunk of chunkFilesCreated) {
      if (fs.existsSync(chunk)) {
        fs.unlinkSync(chunk);
      }
    }
    console.log('[Pipeline Service] Cleanup finished.');
  }
}

export async function updateWithFiles(id, updateData, documentFilePath = null, mdFilePath = null, originalName = null) {
  // 1. Get the existing document
  const existing = await congDongOnThiRepo.findById(id);
  if (!existing) {
    // Clean up uploaded files if document not found
    if (documentFilePath && fs.existsSync(documentFilePath)) fs.unlinkSync(documentFilePath);
    if (mdFilePath && fs.existsSync(mdFilePath)) fs.unlinkSync(mdFilePath);
    return null;
  }

  const data = {};
  const allowedFields = ['subject', 'title', 'description', 'level', 'tags'];

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      if (field === 'level') {
        data[field] = parseInt(updateData[field], 10) === 1 ? 1 : 0;
      } else if (field === 'tags') {
        if (typeof updateData[field] === 'string') {
          try {
            data[field] = JSON.parse(updateData[field]);
          } catch {
            data[field] = updateData[field].split(',').map(t => t.trim()).filter(Boolean);
          }
        } else if (Array.isArray(updateData[field])) {
          data[field] = updateData[field];
        }
      } else {
        data[field] = updateData[field];
      }
    }
  }

  const chunkFilesCreated = [];
  try {
    // 2. If new document file is uploaded, split & upload to Cloudinary, then delete old document file from Cloudinary
    if (documentFilePath && originalName) {
      console.log(`[Service] Processing new document file for update: "${originalName}"`);
      const originalExt = path.extname(originalName).toLowerCase();
      const originalBase = path.basename(originalName, originalExt);
      const downloadUrls = [];

      const splitFiles = await splitPdfIfLarge(documentFilePath, 10 * 1024 * 1024);
      for (let i = 0; i < splitFiles.length; i++) {
        const fileToUpload = splitFiles[i];
        let url;
        if (splitFiles.length > 1) {
          const customPublicId = `${originalBase}-${i + 1}`;
          url = await uploadDocument(fileToUpload, 'documents', customPublicId);
          chunkFilesCreated.push(fileToUpload);
        } else {
          url = await uploadDocument(fileToUpload, 'documents');
        }
        downloadUrls.push(url);
      }

      data.downloadUrl = downloadUrls;
      data.fileType = originalExt.replace('.', '').toUpperCase();
      
      const stats = fs.statSync(documentFilePath);
      data.fileSize = (stats.size / (1024 * 1024)).toFixed(1) + ' MB';

      // Delete old document files from Cloudinary
      if (existing.downloadUrl && existing.downloadUrl.length > 0) {
        const otherDocsCount = await congDongOnThiRepo.countByDownloadUrlExceptId(existing.downloadUrl, existing.id);
        if (otherDocsCount === 0) {
          for (const url of existing.downloadUrl) {
            await deleteFromCloudinary(url);
          }
        }
      }
    }

    // 3. If new md file is uploaded, upload to Cloudinary, then delete old md file from Cloudinary
    if (mdFilePath) {
      console.log(`[Service] Processing new manual MD file for update: "${path.basename(mdFilePath)}"`);
      const mdUrl = await uploadDocument(mdFilePath, 'documents');
      data.mdDownloadUrl = mdUrl;

      // Delete old md file from Cloudinary
      if (existing.mdDownloadUrl) {
        await deleteFromCloudinary(existing.mdDownloadUrl);
      }
    }

    if (data.level === 1) {
      await congDongOnThiRepo.resetHotDocuments();
    }

    // 4. Update in database
    return await congDongOnThiRepo.update(id, data);
  } finally {
    // Clean up local temp files
    if (documentFilePath && fs.existsSync(documentFilePath)) {
      fs.unlinkSync(documentFilePath);
    }
    if (mdFilePath && fs.existsSync(mdFilePath)) {
      fs.unlinkSync(mdFilePath);
    }
    for (const chunk of chunkFilesCreated) {
      if (fs.existsSync(chunk)) {
        fs.unlinkSync(chunk);
      }
    }
  }
}

/**
 * Fetches all documents ordered by creation date descending.
 */
export async function getAll() {
  return await congDongOnThiRepo.findAll();
}

/**
 * Fetches a single document by ID and increments the view count.
 */
export async function getById(id) {
  // Try incrementing views first
  try {
    await congDongOnThiRepo.update(id, {
      views: {
        increment: 1
      }
    });
  } catch (err) {
    console.error(`[Service] Failed to increment views for ${id}:`, err);
  }
  return await congDongOnThiRepo.findById(id);
}

/**
 * Updates basic text fields of a document (whitelist: subject, title, description, level, tags).
 */
export async function update(id, updateData) {
  const allowedFields = ['subject', 'title', 'description', 'level', 'tags'];
  const data = {};

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      if (field === 'level') {
        data[field] = parseInt(updateData[field], 10) === 1 ? 1 : 0;
      } else if (field === 'tags') {
        if (typeof updateData[field] === 'string') {
          try {
            data[field] = JSON.parse(updateData[field]);
          } catch {
            data[field] = updateData[field].split(',').map(t => t.trim()).filter(Boolean);
          }
        } else if (Array.isArray(updateData[field])) {
          data[field] = updateData[field];
        }
      } else {
        data[field] = updateData[field];
      }
    }
  }

  // Verify document exists
  const existing = await congDongOnThiRepo.findById(id);
  if (!existing) return null;

  if (data.level === 1) {
    await congDongOnThiRepo.resetHotDocuments();
  }

  return await congDongOnThiRepo.update(id, data);
}

/**
 * Deletes a document and its Cloudinary assets (with safety checks for shared original files).
 */
export async function deleteDoc(id) {
  const doc = await congDongOnThiRepo.findById(id);
  if (!doc) return null;

  // 1. Delete generated .md file from Cloudinary
  if (doc.mdDownloadUrl) {
    await deleteFromCloudinary(doc.mdDownloadUrl);
  }

  // 2. Delete original document from Cloudinary only if no other document record is using it
  if (doc.downloadUrl && doc.downloadUrl.length > 0) {
    const otherDocsCount = await congDongOnThiRepo.countByDownloadUrlExceptId(doc.downloadUrl, doc.id);
    if (otherDocsCount === 0) {
      for (const url of doc.downloadUrl) {
        await deleteFromCloudinary(url);
      }
    }
  }

  // 3. Delete database record
  return await congDongOnThiRepo.delete(id);
}

/**
 * Increments the downloads counter for a document.
 */
export async function incrementDownload(id) {
  const existing = await congDongOnThiRepo.findById(id);
  if (!existing) return null;

  return await congDongOnThiRepo.update(id, {
    downloads: {
      increment: 1
    }
  });
}

export async function getDistinctSubjects() {
  const records = await congDongOnThiRepo.findDistinctSubjects();
  return records.map(r => r.subject);
}

export default {
  uploadDocument,
  runPipeline,
  updateWithFiles,
  getAll,
  getById,
  update,
  deleteDoc,
  incrementDownload,
  getDistinctSubjects
};
