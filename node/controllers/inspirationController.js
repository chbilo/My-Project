const Inspiration = require('../models/Inspiration')

const parsePublished = (value) => {
  if (typeof value === 'boolean') return value
  return value === 'true' || value === 'on' || value === '1'
}

const getPublishedInspirations = async (req, res) => {
  try {
    const inspirations = await Inspiration.find({ isPublished: true }).sort({ order: 1, createdAt: -1 })
    res.json(inspirations)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getAllInspirations = async (req, res) => {
  try {
    const inspirations = await Inspiration.find().sort({ order: 1, createdAt: -1 })
    res.json(inspirations)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const createInspiration = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' })
    }

    const inspiration = await Inspiration.create({
      image: `/uploads/${req.file.filename}`,
      title: req.body.title || '',
      description: req.body.description || '',
      category: req.body.category || '',
      order: req.body.order || 0,
      isPublished: req.user?.role === 'admin'
        ? (req.body.isPublished === undefined ? true : parsePublished(req.body.isPublished))
        : false
    })

    res.status(201).json(inspiration)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

const updateInspiration = async (req, res) => {
  try {
    const data = {
      title: req.body.title || '',
      description: req.body.description || '',
      category: req.body.category || '',
      order: req.body.order || 0,
    }
    if (req.body.isPublished !== undefined) {
      data.isPublished = parsePublished(req.body.isPublished)
    }

    if (req.file) data.image = `/uploads/${req.file.filename}`

    const updated = await Inspiration.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true
    })
    if (!updated) return res.status(404).json({ message: 'Inspiration not found' })
    res.json(updated)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

const deleteInspiration = async (req, res) => {
  try {
    const deleted = await Inspiration.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ message: 'Inspiration not found' })
    res.json({ message: 'Inspiration deleted' })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

module.exports = {
  getPublishedInspirations,
  getAllInspirations,
  createInspiration,
  updateInspiration,
  deleteInspiration
}
