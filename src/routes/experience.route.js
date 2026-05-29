import express from 'express'
import experienceController from '../controllers/experience.controller.js'
import tokenValidate from '../middlewares/tokenValidate.js'
import roleValidate from '../middlewares/roleValidate.js'

const router = express.Router()

router.get('/get-all-experience', experienceController.getAll)
router.post('/create-experience', tokenValidate, roleValidate, experienceController.create)
router.post('/update-experience/:id', tokenValidate, roleValidate, experienceController.update)
router.get('/delete-experience/:id', tokenValidate, roleValidate, experienceController.delete)

export default router
