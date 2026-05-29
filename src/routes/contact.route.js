import express from 'express'
import contactController from '../controllers/contact.controller.js'
import tokenValidate from '../middlewares/tokenValidate.js'
import roleValidate from '../middlewares/roleValidate.js'

const router = express.Router()

router.get('/get-all-contact', contactController.getAll)
router.post('/create-contact', tokenValidate, roleValidate, contactController.create)
router.post('/update-contact/:id', tokenValidate, roleValidate, contactController.update)
router.get('/delete-contact/:id', tokenValidate, roleValidate, contactController.delete)

export default router
