import express from 'express'
import adminProfileController from '../controllers/adminProfile.controller.js'
import tokenValidate from '../middlewares/tokenValidate.js'
import roleValidate from '../middlewares/roleValidate.js'

const router = express.Router()

router.get('/get-admin-profile', adminProfileController.get)
router.post('/create-admin-profile', tokenValidate, roleValidate, adminProfileController.create)
router.post('/update-admin-profile/:id', tokenValidate, roleValidate, adminProfileController.update)

export default router
