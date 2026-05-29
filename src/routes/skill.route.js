import express from 'express'
import skillController from '../controllers/skill.controller.js'
import { upload } from '../config/cloudinary.js'
import tokenValidate from '../middlewares/tokenValidate.js'
import roleValidate from '../middlewares/roleValidate.js'

const router = express.Router()

router.get('/get-all-skill', skillController.getAll)
router.post('/create-skill', tokenValidate, roleValidate, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('MULTER/CLOUDINARY ERROR:', err)
            return res.status(500).json({ message: err.message })
        }
        next()
    })
}, skillController.create)
router.post('/update-skill/:id', tokenValidate, roleValidate, upload.single('image'), skillController.update)
router.get('/delete-skill/:id', tokenValidate, roleValidate, skillController.delete)

export default router
