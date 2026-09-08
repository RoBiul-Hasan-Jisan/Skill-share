const admin = require('firebase-admin')
const path = require('path')

let initialized = false

function tryInit() {
  try {
    let serviceAccount

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      let raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim()
      serviceAccount = JSON.parse(raw)
      if (typeof serviceAccount === 'string') {
        serviceAccount = JSON.parse(serviceAccount)
      }
    } else {
      const keyPath = path.resolve(__dirname, '../../service-account.json')
      serviceAccount = require(keyPath)
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
    initialized = true
  } catch (err) {
    console.warn('Firebase Admin init failed, falling back to dev auth:', err.message)
  }
}

if (process.env.FIREBASE_SERVICE_ACCOUNT || process.env.CI) {
  tryInit()
} else {
  const fs = require('fs')
  const keyPath = path.resolve(__dirname, '../../service-account.json')
  if (fs.existsSync(keyPath)) {
    tryInit()
  } else {
    console.warn('No service-account.json found, Firebase Admin not initialized')
  }
}

module.exports = admin
module.exports.isInitialized = () => initialized
