async function sendSlackMessage(webhookUrl, blocks) {
  if (!webhookUrl) {
    console.warn('No Slack webhook URL configured')
    return false
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blocks: Array.isArray(blocks) ? blocks : [blocks],
      }),
    })

    if (!response.ok) {
      console.error(`Slack webhook error: ${response.statusText}`)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending Slack message:', error.message)
    return false
  }
}

function createAnnouncementBlock(announcement, workspaceName) {
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*New Announcement in ${workspaceName}*\n\n*${announcement.title}*\n${announcement.content}`,
    },
  }
}

function createGoalUpdateBlock(goal, workspaceName, status) {
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Goal Update in ${workspaceName}*\n\n*${goal.title}*\nStatus: ${status}${goal.progress ? `\nProgress: ${goal.progress}%` : ''}`,
    },
  }
}

function createActionAssignmentBlock(action, assigneeName, workspaceName) {
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Action Assignment in ${workspaceName}*\n\nAssigned to: ${assigneeName}\n*${action.title}*${action.dueDate ? `\nDue: ${new Date(action.dueDate).toLocaleDateString()}` : ''}`,
    },
  }
}

module.exports = {
  sendSlackMessage,
  createAnnouncementBlock,
  createGoalUpdateBlock,
  createActionAssignmentBlock,
}
