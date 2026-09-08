const crypto = require('crypto')
const cron = require('node-cron')
const prisma = require('../prisma/client')
const { sendDigestEmail } = require('../services/emailService')

async function sendDailyDigest() {
  try {
    const usersWithDigest = await prisma.user.findMany({
      where: {
        emailPreferences: {
          path: ['dailyDigest'],
          equals: true,
        },
      },
      include: {
        notifications: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    for (const user of usersWithDigest) {
      if (user.notifications.length > 0) {
        const unsubscribeToken = crypto.randomUUID()
        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailPreferences: {
              ...user.emailPreferences,
              unsubscribeToken,
            },
          },
        })
        await sendDigestEmail(user.email, user.name, user.notifications, unsubscribeToken)
      }

      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        data: {
          digestSentAt: new Date(),
        },
      })
    }

    console.log(`✅ Daily digest sent to ${usersWithDigest.length} users`)
  } catch (error) {
    console.error('❌ Error sending daily digest:', error)
  }
}

function initDigestJob() {
  // Run every day at 9 AM UTC
  cron.schedule('0 9 * * *', sendDailyDigest)
  console.log('📧 Daily digest job scheduled')
}

module.exports = { initDigestJob, sendDailyDigest }
