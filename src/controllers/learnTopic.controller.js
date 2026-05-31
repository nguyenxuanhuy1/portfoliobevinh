import learnTopicService from '../services/learnTopic.service.js'
import { sendError, sendSuccess } from '../utils/response.js'

const learnTopicController = {
  async getAll(req, res) {
    try {
      const topics = await learnTopicService.getAllTopics()
      return sendSuccess(res, topics, 'Lấy danh sách chủ đề thành công')
    } catch (error) {
      return sendError(res, error.message, 500)
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params
      const topic = await learnTopicService.getTopicById(id)
      if (!topic) {
        return sendError(res, 'Không tìm thấy chủ đề học', 404)
      }
      return sendSuccess(res, topic, 'Lấy thông tin chủ đề thành công')
    } catch (error) {
      return sendError(res, error.message, 500)
    }
  },

  async create(req, res) {
    try {
      const topic = await learnTopicService.createTopic(req.body)
      return sendSuccess(res, topic, 'Tạo chủ đề học mới thành công', 201)
    } catch (error) {
      return sendError(res, error.message, 400)
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params
      const topic = await learnTopicService.updateTopic(id, req.body)
      return sendSuccess(res, topic, 'Cập nhật chủ đề học thành công')
    } catch (error) {
      return sendError(res, error.message, 400)
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params
      await learnTopicService.deleteTopic(id)
      return sendSuccess(res, null, 'Xóa chủ đề học thành công')
    } catch (error) {
      return sendError(res, error.message, 400)
    }
  },

  async grade(req, res) {
    try {
      const { id } = req.params
      const { userAnswers, apiKey } = req.body
      if (!userAnswers || !Array.isArray(userAnswers)) {
        return sendError(res, 'Đáp án gửi lên không hợp lệ', 400)
      }
      const gradingResult = await learnTopicService.gradeTopic(id, userAnswers, apiKey)
      return sendSuccess(res, gradingResult, 'Chấm điểm bài làm thành công')
    } catch (error) {
      return sendError(res, error.message, 500)
    }
  }
}

export default learnTopicController
