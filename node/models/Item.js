const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  variantGroupId: {
    type: String,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  size: {
    type: String,
    trim: true
  },
  material: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['מפות', 'מרכזי שולחן', 'כלים לבר'],
    required: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  images: {
    type: [String],
    default: []
  },
  colors: {
    type: [String],
    default: []
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  embeddingText: {
    type: String,
    default: '',
    select: false
  }
}, { timestamps: true })

module.exports = mongoose.model('Item', itemSchema)
