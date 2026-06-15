import path from 'path';
import congDongOnThiService from '../services/congdongonthi.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded.', 400);
    }

    const { path: filePath, originalname: originalName } = req.file;

    console.log(`[CongDongOnThi Controller] Received upload request for file: "${originalName}"`);

    // Parse metadata fields with fallbacks
    const subject = req.body.subject || 'general';
    const baseName = path.basename(originalName, path.extname(originalName));
    const title = req.body.title || baseName;
    const description = req.body.description || '';
    const level = parseInt(req.body.level, 10) === 1 ? 1 : 0;

    // Parse tags list
    let tags = [];
    if (req.body.tags) {
      if (typeof req.body.tags === 'string') {
        try {
          tags = JSON.parse(req.body.tags);
        } catch {
          tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
        }
      } else if (Array.isArray(req.body.tags)) {
        tags = req.body.tags;
      }
    }

    const ext = path.extname(originalName).replace('.', '').toUpperCase();
    const fileType = req.body.fileType || ext || 'PDF';

    const sizeInMB = (req.file.size / (1024 * 1024)).toFixed(1) + ' MB';
    const fileSize = req.body.fileSize || sizeInMB;

    const metadata = {
      subject,
      title,
      description,
      level,
      tags,
      fileType,
      fileSize
    };

    // Trigger asynchronous conversion pipeline
    congDongOnThiService.runPipeline(filePath, originalName, metadata)
      .then(results => {
        console.log(`[CongDongOnThi Controller] Pipeline processing completed for: "${originalName}"`);
      })
      .catch(error => {
        console.error(`[CongDongOnThi Controller] Pipeline processing failed for: "${originalName}":`, error);
      });

    return res.status(202).json({
      success: true,
      message: 'File uploaded successfully. Processing started in the background.'
    });
  } catch (error) {
    console.error('[CongDongOnThi Controller] Error uploading document:', error);
    return sendError(res, error.message || 'An error occurred during upload.', 500);
  }
};

const getAllDocuments = async (req, res) => {
  try {
    const docs = await congDongOnThiService.getAll();
    return sendSuccess(res, docs, 'Lấy danh sách tài liệu thành công');
  } catch (error) {
    console.error('[CongDongOnThi Controller] Error listing documents:', error);
    return sendError(res, error.message || 'Có lỗi xảy ra khi lấy danh sách tài liệu.', 500);
  }
};

const getDocumentById = async (req, res) => {
  try {
    const doc = await congDongOnThiService.getById(req.params.id);
    if (!doc) {
      return sendError(res, 'Không tìm thấy tài liệu.', 404);
    }
    return sendSuccess(res, doc, 'Lấy chi tiết tài liệu thành công');
  } catch (error) {
    console.error('[CongDongOnThi Controller] Error fetching document:', error);
    return sendError(res, error.message || 'Có lỗi xảy ra khi lấy chi tiết tài liệu.', 500);
  }
};

const updateDocumentInfo = async (req, res) => {
  try {
    const doc = await congDongOnThiService.update(req.params.id, req.body);
    if (!doc) {
      return sendError(res, 'Không tìm thấy tài liệu để cập nhật.', 404);
    }
    return sendSuccess(res, doc, 'Cập nhật thông tin tài liệu thành công');
  } catch (error) {
    console.error('[CongDongOnThi Controller] Error updating document:', error);
    return sendError(res, error.message || 'Có lỗi xảy ra khi cập nhật tài liệu.', 500);
  }
};

const deleteDocument = async (req, res) => {
  try {
    const doc = await congDongOnThiService.deleteDoc(req.params.id);
    if (!doc) {
      return sendError(res, 'Không tìm thấy tài liệu để xóa.', 404);
    }
    return sendSuccess(res, null, 'Xóa tài liệu và file đính kèm thành công');
  } catch (error) {
    console.error('[CongDongOnThi Controller] Error deleting document:', error);
    return sendError(res, error.message || 'Có lỗi xảy ra khi xóa tài liệu.', 500);
  }
};

const incrementDownload = async (req, res) => {
  try {
    const doc = await congDongOnThiService.incrementDownload(req.params.id);
    if (!doc) {
      return sendError(res, 'Không tìm thấy tài liệu.', 404);
    }
    return sendSuccess(res, doc, 'Tăng lượt tải tài liệu thành công');
  } catch (error) {
    console.error('[CongDongOnThi Controller] Error incrementing downloads:', error);
    return sendError(res, error.message || 'Có lỗi xảy ra khi tăng lượt tải tài liệu.', 500);
  }
};

const getSubjects = async (req, res) => {
  try {
    const subjects = await congDongOnThiService.getDistinctSubjects();
    return sendSuccess(res, subjects, 'Lấy danh sách môn học thành công');
  } catch (error) {
    console.error('[CongDongOnThi Controller] Error fetching subjects:', error);
    return sendError(res, error.message || 'Có lỗi xảy ra khi lấy danh sách môn học.', 500);
  }
};

export default {
  uploadDocument,
  getAllDocuments,
  getDocumentById,
  updateDocumentInfo,
  deleteDocument,
  incrementDownload,
  getSubjects
};
