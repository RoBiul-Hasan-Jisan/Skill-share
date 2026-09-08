const express = require('express')
const multer = require('multer')
const prisma = require('../prisma/client')
const { uploadAvatar } = require('../services/cloudinaryService')

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
})

router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const avatarUrl = await uploadAvatar(req.file.buffer, req.userId)

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { avatarUrl },
    })

    res.json({
      data: { avatarUrl: user.avatarUrl },
      message: 'Avatar uploaded',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Upload failed' })
  }
})

module.exports = router
