const express = require('express')
const router = express.Router()
const itemController = require('../controllers/itemController')
const verifyJWT = require('../middleware/verifyJWT')
const upload = require('../middleware/upload')

router.get('/', itemController.getAllItems)
router.get('/:id', itemController.getItemById)
router.post('/', verifyJWT('admin'), upload.array('images', 5), itemController.createItem)
router.put('/:id', verifyJWT('admin'), upload.array('images', 5), itemController.updateItem)
router.delete('/:id', verifyJWT('admin'), itemController.deleteItem)

module.exports = router
