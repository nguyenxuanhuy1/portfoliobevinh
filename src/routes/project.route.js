import express from 'express'
import projectController from '../controllers/project.controller.js'
import { upload } from '../config/cloudinary.js'
import tokenValidate from '../middlewares/tokenValidate.js'
import roleValidate from '../middlewares/roleValidate.js'
const router = express.Router()

router.get('/get-all-project', projectController.getAll)
router.get('/get-project/:name', projectController.getByName)
router.post('/create-project', tokenValidate, roleValidate, upload.single('image'), projectController.create)
router.post('/update-project/:id', tokenValidate, roleValidate, upload.single('image'), projectController.update)
router.get('/delete-project/:id', tokenValidate, roleValidate, projectController.delete)

export default router