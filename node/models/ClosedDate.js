const mongoose = require('mongoose')

const closedDateSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('ClosedDate', closedDateSchema)
