const cloudinary = require('cloudinary').v2

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function uploadAvatar(buffer, userId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'avatars',
        public_id: userId,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result.secure_url)
      }
    )
    stream.end(buffer)
  })
}

async function uploadAttachment(buffer, filename) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'attachments',
        public_id: filename.split('.')[0],
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result.secure_url)
      }
    )
    stream.end(buffer)
  })
}

async function deleteFile(publicId) {
  return cloudinary.uploader.destroy(publicId)
}

module.exports = {
  uploadAvatar,
  uploadAttachment,
  deleteFile,
}
