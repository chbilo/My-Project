const Cart = require('../models/Cart')
const Item = require('../models/Item')

const getCart = async (req, res) => {
  const userId = req.user._id
  let cart = await Cart.findOne({ user: userId })
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] })
  }
  const itemIds = cart.items.map((entry) => entry.itemId)
  const currentItems = await Item.find({ _id: { $in: itemIds } })
  const currentItemsById = new Map(currentItems.map((item) => [item._id.toString(), item]))
  const hydratedItems = cart.items.map((entry) => {
    const currentItem = currentItemsById.get(entry.itemId.toString())
    if (!currentItem) return entry

    return {
      ...entry.toObject(),
      title: currentItem.code || currentItem.title,
      code: currentItem.code || currentItem.title,
      image: currentItem.images?.[0] || null,
      category: currentItem.category,
      subcategory: currentItem.subcategory || '',
      variantGroupId: currentItem.variantGroupId || '',
      size: currentItem.size || '',
      material: currentItem.material || '',
      extraRentalFee: Number(currentItem.extraRentalFee) || 0,
      maxQuantity: currentItem.quantity
    }
  })

  res.json(hydratedItems)
}

const updateCart = async (req, res) => {
  const userId = req.user._id
  const items = Array.isArray(req.body.items) ? req.body.items : []

  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    { items },
    { upsert: true, returnDocument: 'after' }
  )

  res.json(cart.items)
}

module.exports = { getCart, updateCart }
