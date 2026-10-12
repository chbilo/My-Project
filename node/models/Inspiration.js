const mongoose = require('mongoose')

const inspirationSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    trim: true,
    default: ''
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

module.exports = mongoose.model('Inspiration', inspirationSchema)
