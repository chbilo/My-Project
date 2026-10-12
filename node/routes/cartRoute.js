const express = require('express')
const router = express.Router()
const verifyJWT = require('../middleware/verifyJWT')
const cartController = require('../controllers/cartController')

router.get('/', verifyJWT(), cartController.getCart)
router.put('/', verifyJWT(), cartController.updateCart)

module.exports = router
