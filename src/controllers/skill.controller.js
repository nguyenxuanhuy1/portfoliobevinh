import skillService from '../services/skill.service.js'
import { sendSuccess, sendError } from '../utils/response.js'
import cloudinary from '../config/cloudinary.js'

const skillController = {
  async getAll(req, res) {
    try {
      const skills = await skillService.getAll()
      sendSuccess(res, skills, 'Lấy danh sách skill thành công', 200)
    } catch (err) {
      sendError(res, err.message, 500)
    }
  },

  async create(req, res) {
    console.log('req.body:', req.body)
    console.log('req.body.name:', req.body.name)
    console.log('typeof req.body.name:', typeof req.body.name)
    console.log('req.file:', req.file)
    try {

      const { name } = req.body
      if (!name) return sendError(res, 'name is required', 400)

      const image = req.file?.path ?? req.body.image ?? null

      const skill = await skillService.create({ ...req.body, image })
      sendSuccess(res, skill, 'Tạo skill thành công', 201)
    } catch (err) {
      console.error('CREATE SKILL ERROR:', err)
      sendError(res, err.message ?? String(err), 500)
    }
  },

  async update(req, res) {
    try {
      if (req.file) {
        const current = await skillService.getById(req.params.id)
        if (current.image) {
          const publicId = current.image.split('/').slice(-2).join('/').split('.')[0]
          await cloudinary.uploader.destroy(publicId)
        }
      }

      const image = req.file?.path ?? req.body.image ?? undefined

      const skill = await skillService.update(req.params.id, {
        ...req.body,
        ...(image !== undefined && { image })
      })
      sendSuccess(res, skill, 'Cập nhật skill thành công', 200)
    } catch (err) {
      sendError(res, err.message, 400)
    }
  },

  async delete(req, res) {
    try {
      const current = await skillService.getById(req.params.id)
      if (current.image) {
        const publicId = current.image.split('/').slice(-2).join('/').split('.')[0]
        await cloudinary.uploader.destroy(publicId)
      }

      await skillService.delete(req.params.id)
      sendSuccess(res, null, 'Xóa skill thành công', 200)
    } catch (err) {
      sendError(res, err.message, 400)
    }
  }
}

export default skillController
