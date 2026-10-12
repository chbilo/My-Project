const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const register = async (req, res) => {
  const { name, email, password, phone } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' })
  }

  const duplicate = await User.findOne({ email }).lean()
  if (duplicate) {
    return res.status(409).json({ message: 'Email already in use' })
  }

  const hashedPwd = await bcrypt.hash(password, 10)
  const user = await User.create({
    name,
    email,
    password: hashedPwd,
    phone,
    role: 'user'
  })

  const userInfo = {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role
  }
  const accessToken = jwt.sign(userInfo, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '3h' })

  res.status(201).json({ accessToken })
}

const login = async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  const foundUser = await User.findOne({ email }).lean()
  if (!foundUser) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const match = await bcrypt.compare(password, foundUser.password)
  if (!match) return res.status(401).json({ message: 'Unauthorized' })

  const userInfo = {
    _id: foundUser._id.toString(),
    name: foundUser.name,
    email: foundUser.email,
    role: foundUser.role
  }

  const accessToken = jwt.sign(userInfo, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '3h' })
  res.json({ accessToken })
}

const registerAdmin = async (req, res) => {
  const { name, email, password, phone } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' })
  }

  const duplicate = await User.findOne({ email }).lean()
  if (duplicate) {
    return res.status(409).json({ message: 'Email already in use' })
  }

  const hashedPwd = await bcrypt.hash(password, 10)
  const user = await User.create({
    name,
    email,
    password: hashedPwd,
    phone,
    role: 'admin'
  })

  const userInfo = {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role
  }
  const accessToken = jwt.sign(userInfo, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '3h' })

  res.status(201).json({ accessToken })
}

module.exports = { register, login, registerAdmin }
