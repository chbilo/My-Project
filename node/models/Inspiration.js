const mongoose = require('mongoose')

const inspirationSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
    trim: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
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
  order: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

module.exports = mongoose.model('Inspiration', inspirationSchema)
