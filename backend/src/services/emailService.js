const crypto = require('crypto')
const nodemailer = require('nodemailer')

let transporter

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

async function sendInviteEmail(to, workspaceName, inviteLink, inviterName) {
  if (!transporter) {
    console.warn('Email transporter not configured. Set EMAIL_USER and EMAIL_PASS environment variables.')
    return
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: `You're invited to join ${workspaceName} on SkillShare`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #6366F1; padding: 20px; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">SkillShare</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
            <h2>You're invited!</h2>
            <p>Hi there,</p>
            <p><strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> on SkillShare.</p>
            <a href="${inviteLink}" style="display: inline-block; background-color: #6366F1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0;">
              Accept Invitation
            </a>
            <p style="color: #999; font-size: 12px;">This invitation expires in 7 days.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">SkillShare — Collaborative workspace for teams</p>
          </div>
        </div>
      `,
    })
    console.log(`Invite email sent to ${to} for workspace ${workspaceName}`)
  } catch (error) {
    console.error(`Failed to send invite email to ${to}:`, error.message)
  }
}

async function sendMentionEmail(to, mentionedByName, workspaceName, commentPreview, link) {
  if (!transporter) return

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: `${mentionedByName} mentioned you in ${workspaceName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #6366F1; padding: 20px; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">SkillShare</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
            <h2>You were mentioned</h2>
            <p><strong>${mentionedByName}</strong> mentioned you in ${workspaceName}:</p>
            <blockquote style="border-left: 4px solid #6366F1; padding-left: 20px; margin: 20px 0; color: #666;">
              ${commentPreview}
            </blockquote>
            <a href="${link}" style="display: inline-block; background-color: #6366F1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0;">
              View Comment
            </a>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">SkillShare — Collaborative workspace for teams</p>
          </div>
        </div>
      `,
    })
  } catch (error) {
    console.error('Error sending mention email:', error)
  }
}

async function sendAssignmentEmail(to, assignedByName, actionTitle, workspaceName, actionLink) {
  if (!transporter) return

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: `You've been assigned to "${actionTitle}" in ${workspaceName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #6366F1; padding: 20px; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">SkillShare</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
            <h2>You've been assigned!</h2>
            <p>Hi there,</p>
            <p><strong>${assignedByName}</strong> has assigned you to <strong>${actionTitle}</strong> in <strong>${workspaceName}</strong>.</p>
            <a href="${actionLink}" style="display: inline-block; background-color: #6366F1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0;">
              View Action
            </a>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">SkillShare — Collaborative workspace for teams</p>
          </div>
        </div>
      `,
    })
  } catch (error) {
    console.error('Error sending assignment email:', error)
  }
}

async function sendDigestEmail(to, userName, notifications, unsubscribeToken) {
  if (!transporter) return

  try {
    const notificationItems = notifications.slice(0, 20).map(n => `
      <li style="padding: 10px; background-color: #fff; border-left: 4px solid #6366F1; margin-bottom: 10px;">
        <strong>${n.type}</strong>: ${n.message}
        <div style="font-size: 12px; color: #999; margin-top: 4px;">
          ${new Date(n.createdAt).toLocaleString()}
        </div>
      </li>
    `).join('')

    const token = unsubscribeToken || crypto.randomUUID()
    const unsubscribeLink = `${process.env.API_URL || 'http://localhost:4000'}/email/unsubscribe?token=${token}`

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: `Your SkillShare Daily Digest — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #6366F1; padding: 20px; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">SkillShare Daily Digest</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
            <h2>Hello ${userName},</h2>
            <p>Here's your summary of activity from the last 24 hours:</p>
            <ul style="list-style: none; padding: 0;">
              ${notificationItems}
            </ul>
            ${notifications.length > 20 ? `<p style="color: #666; font-size: 12px;">... and ${notifications.length - 20} more notifications</p>` : ''}
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">
              <a href="${unsubscribeLink}" style="color: #6366F1; text-decoration: none;">Unsubscribe from all emails</a> |
              Manage preferences in your account settings
            </p>
            <p style="color: #666; font-size: 12px;">SkillShare — Collaborative workspace for teams</p>
          </div>
        </div>
      `,
    })
    console.log(`Digest email sent to ${to}`)
  } catch (error) {
    console.error('Error sending digest email:', error)
  }
}

module.exports = {
  sendInviteEmail,
  sendMentionEmail,
  sendAssignmentEmail,
  sendDigestEmail,
}
