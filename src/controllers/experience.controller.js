import experienceService from '../services/experience.service.js'
import { sendSuccess, sendError } from '../utils/response.js'

const experienceController = {
  async getAll(req, res) {
    try {
      const experiences = await experienceService.getAll()
      sendSuccess(res, experiences, 'Lấy danh sách kinh nghiệm thành công', 200)
    } catch (err) {
      sendError(res, err.message, 500)
    }
  },

  async create(req, res) {
    try {
      const { name, description, startDate } = req.body
      if (!name) return sendError(res, 'name is required', 400)
      if (!description) return sendError(res, 'description is required', 400)
      if (!startDate) return sendError(res, 'startDate is required', 400)

      const experience = await experienceService.create(req.body)
      sendSuccess(res, experience, 'Tạo kinh nghiệm thành công', 201)
    } catch (err) {
      sendError(res, err.message, 400)
    }
  },

  async update(req, res) {
    try {
      const experience = await experienceService.update(req.params.id, req.body)
      sendSuccess(res, experience, 'Cập nhật kinh nghiệm thành công', 200)
    } catch (err) {
      sendError(res, err.message, 400)
    }
  },

  async delete(req, res) {
    try {
      await experienceService.delete(req.params.id)
      sendSuccess(res, null, 'Xóa kinh nghiệm thành công', 200)
    } catch (err) {
      sendError(res, err.message, 400)
    }
  }
}

export default experienceController
