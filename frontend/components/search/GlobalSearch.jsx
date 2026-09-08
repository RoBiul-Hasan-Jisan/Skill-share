'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Search, Target, ListChecks, Megaphone, Users } from 'lucide-react'
import Link from 'next/link'

export function GlobalSearch({ workspaceId }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ goals: [], actions: [], announcements: [], members: [] })
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef(null)
  const debounceTimer = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e) => {
    if (!isOpen) return

    const allResults = [
      ...results.goals.map((g, i) => ({ type: 'goal', data: g, index: i })),
      ...results.actions.map((a, i) => ({ type: 'action', data: a, index: i })),
      ...results.announcements.map((an, i) => ({ type: 'announcement', data: an, index: i })),
      ...results.members.map((m, i) => ({ type: 'member', data: m, index: i })),
    ]

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % (allResults.length || 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + (allResults.length || 1)) % (allResults.length || 1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && allResults[selectedIndex]) {
          const item = allResults[selectedIndex]
          navigateToItem(item.type, item.data)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  const navigateToItem = (type, item) => {
    setIsOpen(false)
    setQuery('')
    setSelectedIndex(-1)

    if (type === 'goal') {
      router.push(`/workspace/${workspaceId}/goals`)
    } else if (type === 'action') {
      router.push(`/workspace/${workspaceId}/actions`)
    } else if (type === 'announcement') {
      router.push(`/workspace/${workspaceId}/announcements`)
    } else if (type === 'member') {
      router.push(`/workspace/${workspaceId}/members`)
    }
  }

  useEffect(() => {
    clearTimeout(debounceTimer.current)

    if (query.length < 2) {
      setIsOpen(false)
      setResults({ goals: [], actions: [], announcements: [], members: [] })
      setSelectedIndex(-1)
      return
    }

    setLoading(true)
    setIsOpen(true)
    setSelectedIndex(-1)

    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await api.get(`/workspaces/${workspaceId}/search?q=${encodeURIComponent(query.toLowerCase())}`)
        setResults(response.data.data)
      } catch (error) {
        setResults({ goals: [], actions: [], announcements: [], members: [] })
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => clearTimeout(debounceTimer.current)
  }, [query, workspaceId])

  if (!workspaceId) {
    return null
  }

  const resultCount = results.goals.length + results.actions.length + results.announcements.length + results.members.length

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2 px-3 py-2 bg-surface-2 border border-border rounded-lg">
        <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search goals, actions, members..."
          className="bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none w-full"
          autoComplete="off"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-surface border border-border rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-text-muted text-sm">Searching...</div>
          ) : resultCount === 0 ? (
            <div className="p-4 text-center text-text-muted text-sm">No results found</div>
          ) : (
            <>
              {results.goals.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold text-text-muted uppercase tracking-wider">Goals ({results.goals.length})</p>
                  {results.goals.map((goal, idx) => (
                    <button
                      key={goal.id}
                      onClick={() => navigateToItem('goal', goal)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-sm cursor-pointer ${
                        selectedIndex === idx ? 'bg-accent/20' : 'hover:bg-surface-2'
                      }`}
                    >
                      <Target className="w-4 h-4 text-accent flex-shrink-0" />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-text-primary truncate">{goal.title}</div>
                        <div className="text-xs text-text-muted">{goal.status.replace(/_/g, ' ')}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.actions.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold text-text-muted uppercase tracking-wider">Actions ({results.actions.length})</p>
                  {results.actions.map((action, idx) => (
                    <button
                      key={action.id}
                      onClick={() => navigateToItem('action', action)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-sm cursor-pointer ${
                        selectedIndex === results.goals.length + idx ? 'bg-accent/20' : 'hover:bg-surface-2'
                      }`}
                    >
                      <ListChecks className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-text-primary truncate">{action.title}</div>
                        <div className="text-xs text-text-muted">{action.status.replace(/_/g, ' ')}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.announcements.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold text-text-muted uppercase tracking-wider">Announcements ({results.announcements.length})</p>
                  {results.announcements.map((announcement, idx) => (
                    <button
                      key={announcement.id}
                      onClick={() => navigateToItem('announcement', announcement)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-sm cursor-pointer ${
                        selectedIndex === results.goals.length + results.actions.length + idx ? 'bg-accent/20' : 'hover:bg-surface-2'
                      }`}
                    >
                      <Megaphone className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-text-primary truncate">{announcement.title}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.members.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold text-text-muted uppercase tracking-wider">Members ({results.members.length})</p>
                  {results.members.map((member, idx) => (
                    <button
                      key={member.user.id}
                      onClick={() => navigateToItem('member', member)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-sm cursor-pointer ${
                        selectedIndex === results.goals.length + results.actions.length + results.announcements.length + idx ? 'bg-accent/20' : 'hover:bg-surface-2'
                      }`}
                    >
                      <Users className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-text-primary truncate">{member.user.name}</div>
                        <div className="text-xs text-text-muted">{member.user.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
