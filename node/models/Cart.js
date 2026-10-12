const mongoose = require('mongoose')

const cartItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  title: String,
  code: String,
  image: String,
  category: String,
  subcategory: String,
  variantGroupId: String,
  size: String,
  material: String,
  maxQuantity: {
    type: Number,
    default: 0
  }
}, { _id: false })

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: {
    type: [cartItemSchema],
    default: []
  }
}, { timestamps: true })

module.exports = mongoose.model('Cart', cartSchema)
