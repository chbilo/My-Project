const express = require('express')
const router = express.Router()
const rentalController = require('../controllers/rentalController')
const verifyJWT = require('../middleware/verifyJWT')

router.get('/', verifyJWT(), rentalController.getAllRentals)
router.get('/:id', verifyJWT(), rentalController.getRentalById)
router.post('/', verifyJWT(), rentalController.createRental)
router.put('/:id', verifyJWT(), rentalController.updateRental)
router.delete('/:id', verifyJWT(), rentalController.deleteRental)

module.exports = router
