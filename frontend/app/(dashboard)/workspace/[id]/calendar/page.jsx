'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Button, EmptyState, SkeletonCard } from '@/components/ui'
import { ChevronLeft, ChevronRight, CalendarDays, X, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isToday(date) {
  return isSameDay(date, new Date())
}

function isCurrentMonth(date, month, year) {
  return date.getMonth() === month && date.getFullYear() === year
}

export default function CalendarPage() {
  const { id: workspaceId } = useParams()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filterType, setFilterType] = useState('all') // 'all', 'goal', 'action'
  const [viewType, setViewType] = useState('month') // 'month', 'agenda'
  const [selectedEvent, setSelectedEvent] = useState(null)

  const month = currentDate.getMonth()
  const year = currentDate.getFullYear()

  const filteredEvents = events.filter((e) => {
    if (filterType === 'all') return true
    return e.type === filterType
  })

  const getUpcomingEvents = () => {
    const now = new Date()
    return events
      .filter((e) => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 10)
  }

  useEffect(() => {
    if (!workspaceId) return
    fetchData()
  }, [workspaceId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [goalsRes, actionsRes] = await Promise.all([
        api.get(`/workspaces/${workspaceId}/goals`),
        api.get(`/workspaces/${workspaceId}/actions`),
      ])

      const calendarEvents = []

      goalsRes.data.data.forEach((goal) => {
        if (goal.dueDate) {
          calendarEvents.push({
            id: `goal-${goal.id}`,
            title: goal.title,
            date: new Date(goal.dueDate),
            type: 'goal',
            color: 'bg-indigo-500',
          })
        }
      })

      actionsRes.data.data.forEach((action) => {
        if (action.dueDate) {
          calendarEvents.push({
            id: `action-${action.id}`,
            title: action.title,
            date: new Date(action.dueDate),
            type: 'action',
            color: 'bg-blue-500',
          })
        }
      })

      setEvents(calendarEvents)
    } catch (error) {
      console.error('Failed to fetch calendar events:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate()

  const getStartDayOfMonth = (m, y) => new Date(y, m, 1).getDay()

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(month, year)
    const startDay = getStartDayOfMonth(month, year)

    const prevMonthDays = getDaysInMonth(month - 1, year)
    const days = []

    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      })
    }

    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      })
    }

    return days
  }

  const days = renderCalendar()
  const monthName = new Date(year, month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const getDayEvents = (date) => {
    return filteredEvents.filter((event) => isSameDay(event.date, date))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-surface-2 rounded-lg animate-pulse" />
        <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
          {Array.from({ length: 42 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-surface-2 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary">
            Calendar
          </h1>
          <p className="text-sm sm:text-base text-text-secondary mt-2">Track deadlines and milestones</p>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-accent text-white'
                : 'bg-surface-2 text-text-primary hover:bg-surface'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilterType('goal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'goal'
                ? 'bg-accent text-white'
                : 'bg-surface-2 text-text-primary hover:bg-surface'
            }`}
          >
            Goals
          </button>
          <button
            onClick={() => setFilterType('action')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'action'
                ? 'bg-accent text-white'
                : 'bg-surface-2 text-text-primary hover:bg-surface'
            }`}
          >
            Actions
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewType('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewType === 'month'
                ? 'bg-accent text-white'
                : 'bg-surface-2 text-text-primary hover:bg-surface'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewType('agenda')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewType === 'agenda'
                ? 'bg-accent text-white'
                : 'bg-surface-2 text-text-primary hover:bg-surface'
            }`}
          >
            Agenda
          </button>
        </div>
      </div>

      {viewType === 'month' ? (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevMonth}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-lg font-semibold text-text-primary">
                {monthName}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextMonth}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="bg-surface-2 p-2 sm:p-3 text-center text-[10px] sm:text-xs font-semibold text-text-muted"
                >
                  {day}
                </div>
              ))}

              {days.map((day, index) => {
                const dayEvents = getDayEvents(day.date)
                const isToday_ = isToday(day.date)

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`min-h-16 sm:min-h-24 p-1 sm:p-2 border border-border flex flex-col cursor-pointer hover:bg-opacity-80 transition-colors ${
                      day.isCurrentMonth ? 'bg-surface' : 'bg-surface-2'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1 ${
                        isToday_
                          ? 'bg-accent text-white'
                          : 'text-text-primary'
                      }`}
                    >
                      {day.date.getDate()}
                    </div>

                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`text-xs px-1.5 py-0.5 rounded-full truncate text-white ${event.color} hover:opacity-80 transition-opacity cursor-pointer`}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div
                          className="text-xs text-text-muted px-1.5 cursor-pointer hover:text-accent"
                          onClick={() => {
                            const firstExtra = dayEvents[2]
                            if (firstExtra) setSelectedEvent(firstExtra)
                          }}
                        >
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">Upcoming Events</h2>
          </div>

          <div className="p-6 space-y-3">
            {getUpcomingEvents().length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-muted">No upcoming events</p>
              </div>
            ) : (
              getUpcomingEvents().map((event) => {
                const daysUntil = Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24))
                const isToday_ = isSameDay(new Date(event.date), new Date())
                const isSoon = daysUntil <= 3

                return (
                  <motion.div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="p-4 bg-surface-2 border border-border rounded-lg hover:border-accent transition-colors cursor-pointer group"
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-1 h-12 rounded-full ${event.color}`} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                          {event.title}
                        </h3>
                        <p className="text-sm text-text-muted mt-1 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {new Date(event.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {isToday_ ? (
                          <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-xs font-medium">
                            Today
                          </span>
                        ) : isSoon ? (
                          <span className="px-3 py-1 bg-orange-500/20 text-orange-500 rounded-full text-xs font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Soon
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">
                            in {daysUntil} days
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-2xl max-w-xl w-full"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-12 rounded-full ${selectedEvent.color}`} />
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary">{selectedEvent.title}</h2>
                    <p className="text-sm text-text-muted mt-1">
                      {selectedEvent.type === 'goal' ? 'Goal' : 'Action'} • {new Date(selectedEvent.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-text-muted mb-2">Due Date & Time</p>
                  <div className="flex items-center gap-2 p-3 bg-surface-2 rounded-lg">
                    <Clock className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-text-muted">
                        {new Date(selectedEvent.date).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-text-muted mb-2">Days Until Due</p>
                  <div className="p-3 bg-surface-2 rounded-lg">
                    <p className="text-sm text-text-primary">
                      {Math.ceil((new Date(selectedEvent.date) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                    Mark Complete
                  </button>
                  <button className="flex-1 px-4 py-2 bg-surface-2 text-text-primary rounded-lg font-medium hover:bg-surface transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">
          Legend
        </h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span className="text-sm text-text-secondary">Goal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-text-secondary">Action</span>
          </div>
        </div>
      </div>
    </div>
  )
}
