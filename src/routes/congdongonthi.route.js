import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import congDongOnThiController from '../controllers/congdongonthi.controller.js';
import tokenValidate from '../middlewares/tokenValidate.js';
import roleValidate from '../middlewares/roleValidate.js';

const router = express.Router();

const uploadDir = path.resolve(process.cwd(), 'temp_uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Upload document (Admin only)
router.post(
  '/congdongonthi/upload',
  tokenValidate,
  roleValidate,
  upload.single('document'),
  congDongOnThiController.uploadDocument
);

// Get all documents (Public)
router.get(
  '/congdongonthi',
  congDongOnThiController.getAllDocuments
);

// Get all unique subjects (Public)
router.get(
  '/congdongonthi/subjects',
  congDongOnThiController.getSubjects
);

// Get single document by ID (Public, increments views)
router.get(
  '/congdongonthi/:id',
  congDongOnThiController.getDocumentById
);

// Update document basic info (Admin only)
router.post(
  '/congdongonthi/:id',
  tokenValidate,
  roleValidate,
  congDongOnThiController.updateDocumentInfo
);

// Delete document and its Cloudinary assets (Admin only)
router.delete(
  '/congdongonthi/:id',
  tokenValidate,
  roleValidate,
  congDongOnThiController.deleteDocument
);

// Increment downloads count and redirect (Public GET)
router.get(
  '/congdongonthi/:id/download',
  congDongOnThiController.incrementDownload
);

export default router;
