import contactService from '../services/contact.service.js'
import { sendSuccess, sendError } from '../utils/response.js'

const contactController = {
  async getAll(req, res) {
    try {
      const contacts = await contactService.getAll()
      sendSuccess(res, contacts, 'Lấy danh sách contact thành công', 200)
    } catch (err) {
      sendError(res, err.message, 500)
    }
  },

  async create(req, res) {
    try {
      const { name, link } = req.body
      if (!name) return sendError(res, 'name is required', 400)
      if (!link) return sendError(res, 'link is required', 400)

      const contact = await contactService.create(req.body)
      sendSuccess(res, contact, 'Tạo contact thành công', 201)
    } catch (err) {
      sendError(res, err.message, 400)
    }
  },

  async update(req, res) {
    try {
      const contact = await contactService.update(req.params.id, req.body)
      sendSuccess(res, contact, 'Cập nhật contact thành công', 200)
    } catch (err) {
      sendError(res, err.message, 400)
    }
  },

  async delete(req, res) {
    try {
      await contactService.delete(req.params.id)
      sendSuccess(res, null, 'Xóa contact thành công', 200)
    } catch (err) {
      sendError(res, err.message, 400)
    }
  }
}

export default contactController
