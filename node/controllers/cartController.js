const Cart = require('../models/Cart')

const getCart = async (req, res) => {
  const userId = req.user._id
  let cart = await Cart.findOne({ user: userId })
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] })
  }
  res.json(cart.items)
}

const updateCart = async (req, res) => {
  const userId = req.user._id
  const items = Array.isArray(req.body.items) ? req.body.items : []

  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    { items },
    { upsert: true, new: true }
  )

  res.json(cart.items)
}

module.exports = { getCart, updateCart }
