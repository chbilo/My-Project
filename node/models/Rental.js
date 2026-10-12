const mongoose = require('mongoose')

const rentalItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
}, { _id: false })

const rentalGroupSchema = new mongoose.Schema({
  items: {
    type: [rentalItemSchema],
    required: true,
    validate: {
      validator: (items) => items.length > 0,
      message: 'Rental group must contain at least one item'
    }
  },

  pickupDate: {
    type: Date,
    required: true
  },

  returnDate: {
    type: Date,
    required: true
  }
}, { _id: false })

const rentalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  eventDate: {
    type: Date,
    required: true
  },

  groups: {
    type: [rentalGroupSchema],
    required: true,
    validate: {
      validator: (groups) => groups.length > 0,
      message: 'Rental must contain at least one group'
    }
  },

  status: {
    type: String,
    enum: [
      'pending',
      'approved',
      'rejected',
      'picked_up',
      'returned',
      'cancelled'
    ],
    default: 'pending'
  },

  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Rental', rentalSchema)