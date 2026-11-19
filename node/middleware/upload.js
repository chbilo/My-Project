const multer = require('multer')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3')

const region = process.env.AWS_REGION || 'eu-north-1'
const bucket = process.env.AWS_BUCKET_NAME || 'chaya-site-uploads-2026'
const s3 = new S3Client({
  region,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    : undefined
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|quicktime/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (mimetype && extname) {
    return cb(null, true)
  }
  cb(new Error('פורמט קובץ לא תקין. אנא העלה תמונה או וידאו'))
}

const parser = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
})

const uploadFilesToS3 = async (files) => {
  for (const file of files) {
    const key = `uploads/${randomUUID()}${path.extname(file.originalname).toLowerCase()}`
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    }))

    file.location = `https://${bucket}.s3.${region}.amazonaws.com/${key}`
  }
}

const withS3Upload = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, async (error) => {
    if (error) return next(error)

    const files = req.file ? [req.file] : (req.files || [])
    try {
      await uploadFilesToS3(files)
      next()
    } catch (uploadError) {
      next(uploadError)
    }
  })
}

module.exports = {
  single: (fieldName) => withS3Upload(parser.single(fieldName)),
  array: (fieldName, maxCount) => withS3Upload(parser.array(fieldName, maxCount))
}
