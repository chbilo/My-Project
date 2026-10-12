const ClosedDate = require('../models/ClosedDate')
const { startOfDay } = require('../utils/rentalDates')

const normalizeDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return startOfDay(date)
}

const getClosedDates = async (req, res) => {
  const dates = await ClosedDate.find().sort({ date: 1 })
  res.json(dates)
}

const createClosedDate = async (req, res) => {
  const date = normalizeDate(req.body.date)
  if (!date) return res.status(400).json({ message: 'Invalid date' })

  try {
    const closedDate = await ClosedDate.create({ date })
    res.status(201).json(closedDate)
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Date is already closed' })
    throw error
  }
}

const deleteClosedDate = async (req, res) => {
  const deleted = await ClosedDate.findByIdAndDelete(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Closed date not found' })
  res.json({ message: 'Closed date removed' })
}

module.exports = {
  getClosedDates,
  createClosedDate,
  deleteClosedDate
}
