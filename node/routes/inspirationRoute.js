const express = require('express')
const router = express.Router()
const inspirationController = require('../controllers/inspirationController')
const verifyJWT = require('../middleware/verifyJWT')
const upload = require('../middleware/upload')

router.get('/', inspirationController.getPublishedInspirations)
router.get('/admin', verifyJWT('admin'), inspirationController.getAllInspirations)
router.post('/', upload.single('image'), inspirationController.createInspiration)
router.post('/admin', verifyJWT('admin'), upload.single('image'), inspirationController.createInspiration)
router.put('/:id', verifyJWT('admin'), upload.single('image'), inspirationController.updateInspiration)
router.delete('/:id', verifyJWT('admin'), inspirationController.deleteInspiration)

module.exports = router
