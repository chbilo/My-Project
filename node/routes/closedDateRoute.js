const express = require('express')
const router = express.Router()
const closedDateController = require('../controllers/closedDateController')
const verifyJWT = require('../middleware/verifyJWT')

router.get('/', closedDateController.getClosedDates)
router.post('/', verifyJWT('admin'), closedDateController.createClosedDate)
router.delete('/:id', verifyJWT('admin'), closedDateController.deleteClosedDate)

module.exports = router
