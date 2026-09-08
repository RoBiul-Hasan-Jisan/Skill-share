const cron = require('node-cron')
const prisma = require('../prisma/client')

function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function addWeeks(date, weeks) {
  const result = new Date(date)
  result.setDate(result.getDate() + weeks * 7)
  return result
}

function addMonths(date, months) {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

function getNextOccurrence(dueDate, recurrenceRule) {
  const date = new Date(dueDate)

  if (recurrenceRule === 'DAILY') {
    return addDays(date, 1)
  } else if (recurrenceRule === 'WEEKLY') {
    return addWeeks(date, 1)
  } else if (recurrenceRule === 'MONTHLY') {
    return addMonths(date, 1)
  }

  return null
}

async function processGoalRecurrence() {
  try {
    const recurringGoals = await prisma.goal.findMany({
      where: {
        recurrenceRule: { not: null },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        recurrenceRule: true,
        dueDate: true,
        ownerId: true,
        workspaceId: true,
      },
    })

    for (const goal of recurringGoals) {
      if (goal.dueDate && new Date(goal.dueDate) <= new Date()) {
        const nextDueDate = getNextOccurrence(goal.dueDate, goal.recurrenceRule)

        if (nextDueDate) {
          await prisma.goal.create({
            data: {
              title: goal.title,
              description: goal.description,
              recurrenceRule: goal.recurrenceRule,
              parentId: goal.id,
              dueDate: nextDueDate,
              ownerId: goal.ownerId,
              workspaceId: goal.workspaceId,
            },
          })
        }
      }
    }

    console.log(`✅ Processed ${recurringGoals.length} recurring goals`)
  } catch (error) {
    console.error('❌ Error processing goal recurrence:', error)
  }
}

async function processActionItemRecurrence() {
  try {
    const recurringActions = await prisma.actionItem.findMany({
      where: {
        recurrenceRule: { not: null },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        recurrenceRule: true,
        dueDate: true,
        priority: true,
        assigneeId: true,
        goalId: true,
        workspaceId: true,
      },
    })

    for (const action of recurringActions) {
      if (action.dueDate && new Date(action.dueDate) <= new Date()) {
        const nextDueDate = getNextOccurrence(action.dueDate, action.recurrenceRule)

        if (nextDueDate) {
          await prisma.actionItem.create({
            data: {
              title: action.title,
              description: action.description,
              recurrenceRule: action.recurrenceRule,
              parentId: action.id,
              dueDate: nextDueDate,
              priority: action.priority,
              assigneeId: action.assigneeId,
              goalId: action.goalId,
              workspaceId: action.workspaceId,
            },
          })
        }
      }
    }

    console.log(`✅ Processed ${recurringActions.length} recurring action items`)
  } catch (error) {
    console.error('❌ Error processing action item recurrence:', error)
  }
}

async function runRecurrenceJob() {
  await processGoalRecurrence()
  await processActionItemRecurrence()
}

function initRecurrenceJob() {
  // Run every day at midnight UTC
  cron.schedule('0 0 * * *', runRecurrenceJob)
  console.log('🔄 Recurrence job scheduled')
}

module.exports = { initRecurrenceJob, runRecurrenceJob }
