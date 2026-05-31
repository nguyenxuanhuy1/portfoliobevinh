import express from 'express'
import learnTopicController from '../controllers/learnTopic.controller.js'
import tokenValidate from '../middlewares/tokenValidate.js'
import roleValidate from '../middlewares/roleValidate.js'

const router = express.Router()

router.get('/learn-topics', learnTopicController.getAll)
router.get('/learn-topics/:id', learnTopicController.getById)
router.post('/learn-topics', tokenValidate, roleValidate, learnTopicController.create)
router.put('/learn-topics/:id', tokenValidate, roleValidate, learnTopicController.update)
router.delete('/learn-topics/:id', tokenValidate, roleValidate, learnTopicController.delete)
router.post('/learn-topics/:id/grade', learnTopicController.grade)

export default router
