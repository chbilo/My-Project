const User = require("../models/User")

const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password')
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json(user)
}

const getAllUsers = async (req, res) => {
  if (req.user.role !== 'admin') {
    const user = await User.findById(req.user._id).select('-password')
    return res.json([user])
  }
  const users = await User.find().select('-password')
  res.json(users)
}

const getUserById = async (req, res) => {
  const { id } = req.params
  if (req.user.role !== 'admin' && req.user._id !== id) {
    return res.status(403).json({ message: 'Forbidden' })
  }
  const user = await User.findById(id).select('-password')
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json(user)
}

const updateUser = async (req, res) => {
  const { id, name, email, phone, role } = req.body
  if (!id || !name) {
    return res.status(400).json({ message: 'id and name are required' })
  }
  if (req.user.role !== 'admin' && req.user._id !== id) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  const user = await User.findById(id)
  if (!user) return res.status(404).json({ message: 'User not found' })
  user.name = name
  user.email = email || user.email
  user.phone = phone || user.phone
  if (role && req.user.role === 'admin') user.role = role
  await user.save()
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role
  })
}

const deleteUser = async (req, res) => {
  const { id } = req.params
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  const user = await User.findById(id)
  if (!user) return res.status(404).json({ message: 'User not found' })
  await user.deleteOne()
  res.json({ message: 'User deleted' })
}

module.exports = { getCurrentUser, getAllUsers, getUserById, updateUser, deleteUser }
