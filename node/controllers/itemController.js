const Item = require('../models/Item')
const { attachAvailabilityForDate } = require('../utils/availability')
const { startOfDay } = require('../utils/rentalDates')
const { generateItemCode, shouldRegenerateCode } = require('../utils/itemCode')
const { buildItemSearchText } = require('../utils/itemSearchText')

const getAllItems = async (req, res) => {
  try {
    const items = await Item.find()
    const eventDateParam = req.query.eventDate

    if (!eventDateParam) {
      return res.json(items)
    }

    const event = startOfDay(new Date(eventDateParam))

    if (Number.isNaN(event.getTime())) {
      return res.status(400).json({ message: 'Invalid eventDate' })
    }

    const itemsWithAvailability = await attachAvailabilityForDate(items, event)
    res.json(itemsWithAvailability)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getItemById = async (req, res) => {
  const item = await Item.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Item not found' })
  res.json(item)
}

const parseAvailability = (value) => {
  if (value === undefined) return undefined
  if (typeof value === 'boolean') return value
  return value === 'true' || value === 'on' || value === '1'
}

const parseImageArray = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.filter(Boolean)
    } catch (e) {
      // ignore invalid JSON and fall back to comma splitting
    }

    return value.split(',').map((entry) => entry.trim()).filter(Boolean)
  }

  return []
}

const createItem = async (req, res) => {
  try {
    const data = req.body
    if (req.files && req.files.length > 0) {
      data.images = req.files.map(file => `/uploads/${file.filename}`)
    }
    if (data.isAvailable !== undefined) {
      data.isAvailable = parseAvailability(data.isAvailable)
    }
    if (data.colors) {
      try {
        data.colors = JSON.parse(data.colors)
      } catch (e) {
        data.colors = data.colors.split(',').map(color => color.trim()).filter(color => color)
      }
    }
    if (data.variantGroupId !== undefined) {
      data.variantGroupId = data.variantGroupId.trim()
    }
    data.code = await generateItemCode(data.category, data.subcategory)
    data.title = data.code
    data.embeddingText = buildItemSearchText(data)
    const newItem = new Item(data)
    const saved = await newItem.save()
    res.status(201).json(saved)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

const updateItem = async (req, res) => {
  try {
    const data = req.body
    const existing = await Item.findById(req.params.id)
    if (!existing) return res.status(404).json({ message: 'Item not found' })

    if (data.code !== undefined) {
      data.code = data.code.trim()
      if (!data.code) delete data.code
    }

    const removeImages = parseImageArray(data.removeImages)
    const orderedImages = parseImageArray(data.imageOrder)
    delete data.removeImages
    delete data.imageOrder

    const currentImages = Array.isArray(existing.images) ? existing.images : []
    const remainingImages = currentImages.filter((image) => !removeImages.includes(image))
    const orderedRemainingImages = orderedImages.length > 0
      ? orderedImages.filter((image) => remainingImages.includes(image))
      : remainingImages

    if (req.files && req.files.length > 0) {
      const uploadedImages = req.files.map((file) => `/uploads/${file.filename}`)
      const mergedImages = [...orderedRemainingImages, ...uploadedImages.filter((image) => !orderedRemainingImages.includes(image))]
      if (removeImages.length > 0 || orderedImages.length > 0 || uploadedImages.length > 0) {
        data.images = mergedImages
      }
    } else if (removeImages.length > 0 || orderedImages.length > 0) {
      data.images = orderedRemainingImages
    }

    if (data.isAvailable !== undefined) {
      data.isAvailable = parseAvailability(data.isAvailable)
    }
    if (data.colors) {
      try {
        data.colors = JSON.parse(data.colors)
      } catch (e) {
        data.colors = data.colors.split(',').map(color => color.trim()).filter(color => color)
      }
    }
    if (data.variantGroupId !== undefined) {
      data.variantGroupId = data.variantGroupId.trim()
    }

    const nextCategory = data.category || existing.category
    const nextSubcategory = data.subcategory !== undefined ? data.subcategory : existing.subcategory
    if (!data.code && shouldRegenerateCode(existing, nextCategory, nextSubcategory)) {
      data.code = await generateItemCode(nextCategory, nextSubcategory, existing._id)
    }
    if (data.code) {
      data.title = data.code
    }

    data.embeddingText = buildItemSearchText({
      ...existing.toObject(),
      ...data
    })
    const updated = await Item.findByIdAndUpdate(req.params.id, data, { new: true })
    if (!updated) return res.status(404).json({ message: 'Item not found' })
    res.json(updated)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

const deleteItem = async (req, res) => {
  const deleted = await Item.findByIdAndDelete(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Item not found' })
  res.json({ message: 'Item deleted' })
}

module.exports = { getAllItems, getItemById, createItem, updateItem, deleteItem }
