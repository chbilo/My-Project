const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { createHash, randomBytes } = require('node:crypto')
const { Resend } = require('resend')

const resetPasswordMessage = 'אם כתובת המייל קיימת במערכת, נשלח אליה קישור לאיפוס הסיסמה'

const forgotPassword = async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  if (!email) {
    return res.status(400).json({ message: 'Email is required' })
  }
  if (!process.env.RESEND_API_KEY || !process.env.FRONTEND_URL) {
    return res.status(503).json({ message: 'Password reset is temporarily unavailable' })
  }

  const user = await User.findOne({ email })
  if (!user) {
    return res.json({ message: resetPasswordMessage })
  }

  const resetToken = randomBytes(32).toString('hex')
  const resetTokenHash = createHash('sha256').update(resetToken).digest('hex')
  user.resetPasswordToken = resetTokenHash
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000)
  await user.save()

  const resetUrl = new URL('/reset-password', process.env.FRONTEND_URL)
  resetUrl.searchParams.set('token', resetToken)

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'האתר שלי <onboarding@resend.dev>',
      to: email,
      subject: 'איפוס סיסמה',
      html: `<p>קיבלנו בקשה לאיפוס הסיסמה שלך.</p><p><a href="${resetUrl.toString()}">לאיפוס הסיסמה לחצו כאן</a></p><p>הקישור תקף למשך 15 דקות וניתן להשתמש בו פעם אחת בלבד.</p>`
    })

    if (error) {
      throw error
    }
  } catch (error) {
    await User.updateOne(
      { _id: user._id, resetPasswordToken: resetTokenHash },
      { $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 } }
    )
    console.error('Password reset email could not be sent:', error.message || error)
    return res.json({ message: resetPasswordMessage })
  }

  return res.json({ message: resetPasswordMessage })
}

const resetPassword = async (req, res) => {
  const { token, password } = req.body
  if (
    typeof token !== 'string' ||
    !token ||
    typeof password !== 'string' ||
    password.length < 8 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return res.status(400).json({ message: 'הסיסמה צריכה להכיל לפחות 8 תווים ועד 72 בתים, ונדרש קישור איפוס תקף' })
  }

  const resetTokenHash = createHash('sha256').update(token).digest('hex')
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.findOneAndUpdate(
    {
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: new Date() }
    },
    {
      $set: { password: passwordHash },
      $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 }
    },
    { new: true, select: '_id' }
  )

  if (!user) {
    return res.status(400).json({ message: 'קישור האיפוס אינו תקף או שפג תוקפו. בקשו קישור חדש.' })
  }

  return res.json({ message: 'הסיסמה עודכנה בהצלחה. אפשר להתחבר עם הסיסמה החדשה.' })
}

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

module.exports = { register, login, registerAdmin, forgotPassword, resetPassword }
