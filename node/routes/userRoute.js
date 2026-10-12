const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")
const verifyJWT = require('../middleware/verifyJWT')

router.get('/me', verifyJWT(), userController.getCurrentUser)
router.get('/', verifyJWT(), userController.getAllUsers)
router.get('/:id', verifyJWT(), userController.getUserById)
router.put('/', verifyJWT(), userController.updateUser)
router.delete('/:id', verifyJWT('admin'), userController.deleteUser)

module.exports = router