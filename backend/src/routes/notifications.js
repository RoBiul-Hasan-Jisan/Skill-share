const express = require('express')
const prisma = require('../prisma/client')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    })
    const unreadCount = await prisma.notification.count({
      where: { userId: req.userId, read: false },
    })
    res.json({
      data: notifications,
      unreadCount,
      message: 'Notifications fetched',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    })
    res.json({ data: notification, message: 'Notification marked as read' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, read: false },
      data: { read: true },
    })
    res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
