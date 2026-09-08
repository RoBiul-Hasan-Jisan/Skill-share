const crypto = require('crypto')
const express = require('express')
const { z } = require('zod')
const prisma = require('../prisma/client')
const { requireRole } = require('../middleware/rbac')

const router = express.Router()

router.get('/unsubscribe', async (req, res) => {
  try {
    const { token } = req.query
    if (!token) {
      return res.status(400).json({ error: 'Missing unsubscribe token' })
    }

    const users = await prisma.user.findMany({
      where: {
        emailPreferences: {
          path: ['unsubscribeToken'],
          equals: token,
        },
      },
    })

    if (users.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired unsubscribe link' })
    }

    const user = users[0]

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailPreferences: {
          ...user.emailPreferences,
          unsubscribedFromAll: true,
        }
      }
    })

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribed</title>
          <style>
            body { font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
            .container { background: white; padding: 2rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; }
            h1 { color: #333; margin-bottom: 0.5rem; }
            p { color: #666; margin-bottom: 1rem; }
            a { color: #6366F1; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Unsubscribed</h1>
            <p>You have been unsubscribed from all email notifications.</p>
            <p>You can manage your email preferences in your account settings at any time.</p>
          </div>
        </body>
      </html>
    `)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/preferences', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { emailPreferences: true }
    })

    res.json({ data: user?.emailPreferences || {} })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/preferences', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const schema = z.object({
      immediateNotifications: z.boolean().optional(),
      dailyDigest: z.boolean().optional(),
      unsubscribedFromAll: z.boolean().optional(),
    })

    const preferences = schema.parse(req.body)
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    })

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: {
        emailPreferences: {
          ...user.emailPreferences,
          ...preferences,
        }
      },
      select: { emailPreferences: true }
    })

    res.json({ data: updated.emailPreferences, message: 'Email preferences updated' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input' })
    }
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
