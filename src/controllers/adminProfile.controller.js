import adminProfileService from '../services/adminProfile.service.js'
import { sendSuccess, sendError } from '../utils/response.js'

const adminProfileController = {
  async get(req, res) {
    try {
      const profile = await adminProfileService.get()
      sendSuccess(res, profile, 'Lấy thông tin admin thành công', 200)
    } catch (err) {
      sendError(res, err.message, 404)
    }
  },

  async create(req, res) {
    try {
      const { name, position, bio, skills } = req.body

      if (!name) return sendError(res, 'name is required', 400)
      if (!position) return sendError(res, 'position is required', 400)
      if (!bio) return sendError(res, 'bio is required', 400)

      const profile = await adminProfileService.create(req.body)
      sendSuccess(res, profile, 'Tạo thông tin admin thành công', 201)
    } catch (err) {
      sendError(res, err.message, 400)
    }
  },

  async update(req, res) {
    try {
      const profile = await adminProfileService.update(req.params.id, req.body)
      sendSuccess(res, profile, 'Cập nhật thông tin admin thành công', 200)
    } catch (err) {
      sendError(res, err.message, 400)
    }
  }
}

export default adminProfileController
