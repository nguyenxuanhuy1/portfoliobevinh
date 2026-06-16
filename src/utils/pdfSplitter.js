import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

/**
 * Splits a PDF file if it exceeds the maxBytes size using Greedy + Binary Search.
 * If the file is not a PDF or is smaller than maxBytes, it returns an array containing the original filePath.
 * Otherwise, it splits it into chunk files in the same directory and returns an array of their file paths.
 * 
 * @param {string} filePath - Absolute path to the PDF file
 * @param {number} maxBytes - Maximum file size for each chunk (default: 10MB)
 * @returns {Promise<string[]>} Array of file paths representing the chunks (or the original file path)
 */
export async function splitPdfIfLarge(filePath, maxBytes = 10 * 1024 * 1024) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.pdf') {
    return [filePath];
  }

  const stats = fs.statSync(filePath);
  if (stats.size <= maxBytes) {
    return [filePath];
  }

  console.log(`[PDF Splitter] PDF size is ${(stats.size / (1024 * 1024)).toFixed(2)} MB. Splitting into chunks <= ${(maxBytes / (1024 * 1024)).toFixed(2)} MB using Greedy + Binary Search...`);

  const pdfBytes = fs.readFileSync(filePath);
  const srcDoc = await PDFDocument.load(pdfBytes);
  const pageCount = srcDoc.getPageCount();
  const chunks = [];
  let pageStart = 0;

  const dir = path.dirname(filePath);
  const extName = path.extname(filePath);
  const baseName = path.basename(filePath, extName);

  while (pageStart < pageCount) {
    let low = pageStart;
    let high = pageCount - 1;
    let lastValidEnd = -1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);

      const subDoc = await PDFDocument.create();
      const pageIndices = [];
      for (let i = pageStart; i <= mid; i++) {
        pageIndices.push(i);
      }

      const copiedPages = await subDoc.copyPages(srcDoc, pageIndices);
      copiedPages.forEach(page => subDoc.addPage(page));

      const subPdfBytes = await subDoc.save();
      const subSize = subPdfBytes.length;

      if (subSize <= maxBytes) {
        lastValidEnd = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (lastValidEnd === -1) {
      lastValidEnd = pageStart;
      console.warn(`[PDF Splitter] Warning: Page ${pageStart + 1} alone exceeds max size. Outputting single page.`);
    }

    const subDoc = await PDFDocument.create();
    const pageIndices = [];
    for (let i = pageStart; i <= lastValidEnd; i++) {
      pageIndices.push(i);
    }

    const copiedPages = await subDoc.copyPages(srcDoc, pageIndices);
    copiedPages.forEach(page => subDoc.addPage(page));

    const subPdfBytes = await subDoc.save();
    
    const chunkPath = path.join(dir, `${baseName}_part_${chunks.length + 1}${extName}`);
    fs.writeFileSync(chunkPath, subPdfBytes);
    
    chunks.push(chunkPath);
    console.log(`[PDF Splitter] Created chunk ${chunks.length}: pages ${pageStart + 1}-${lastValidEnd + 1} (${(subPdfBytes.length / (1024 * 1024)).toFixed(2)} MB)`);

    pageStart = lastValidEnd + 1;
  }

  return chunks;
}
