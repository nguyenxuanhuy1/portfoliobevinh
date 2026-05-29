import projectService from '../services/project.service.js'
import { sendSuccess, sendError } from '../utils/response.js'
import cloudinary from '../config/cloudinary.js'

const projectController = {
  async getAll(req, res) {
    try {
      const projects = await projectService.getAll()
      sendSuccess(res, projects, 'Lấy danh sách dự án thành công', 200)
    } catch (err) {
      sendError(res, err.message, 500)
    }
  },

  async getByName(req, res) {
    try {
      const project = await projectService.getByName(req.params.name)
      sendSuccess(res, project, 'Lấy dự án thành công', 200)
    } catch (err) {
      sendError(res, err.message, 404)
    }
  },

  async create(req, res) {
    try {
      const { name, description } = req.body

      if (!name) return sendError(res, 'name is required', 400)
      if (!description) return sendError(res, 'description is required', 400)

      // Lấy url ảnh từ cloudinary nếu có upload file
      const image = req.file?.path ?? req.body.image ?? null

      const project = await projectService.create({ ...req.body, image })
      sendSuccess(res, project, 'Tạo dự án thành công', 201)
    } catch (err) {
      sendError(res, err.message, 400)
    }
  },

  async update(req, res) {
    try {
      if (req.file) {
        const current = await projectService.getById(req.params.id)
        if (current.image) {
          const publicId = current.image.split('/').slice(-2).join('/').split('.')[0]
          await cloudinary.uploader.destroy(publicId)
        }
      }

      const image = req.file?.path ?? req.body.image ?? undefined

      const project = await projectService.update(req.params.id, {
        ...req.body,
        ...(image !== undefined && { image })
      })
      sendSuccess(res, project, 'Cập nhật dự án thành công', 200)
    } catch (err) {
      sendError(res, err.message, 400)
    }
  },

  async delete(req, res) {
    try {
      const current = await projectService.getById(req.params.id)
      if (current.image) {
        const publicId = current.image.split('/').slice(-2).join('/').split('.')[0]
        await cloudinary.uploader.destroy(publicId)
      }

      await projectService.delete(req.params.id)
      sendSuccess(res, null, 'Xóa dự án thành công', 200)
    } catch (err) {
      sendError(res, err.message, 400)
    }
  }
}

export default projectController