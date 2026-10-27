const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const verifyJWT = require('../middleware/verifyJWT')
const passwordResetRateLimit = require('../middleware/passwordResetRateLimit')

router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/forgot-password', passwordResetRateLimit, authController.forgotPassword)
router.post('/reset-password', passwordResetRateLimit, authController.resetPassword)
router.post('/register-admin', verifyJWT('admin'), authController.registerAdmin)

module.exports = router
