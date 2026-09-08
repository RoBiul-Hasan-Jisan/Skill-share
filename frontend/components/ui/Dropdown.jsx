'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

export function Dropdown({ trigger, children, align = 'left' }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1"
      >
        {trigger}
        <ChevronDown className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className={`
              absolute top-full mt-1 ${align === 'right' ? 'right-0' : 'left-0'}
              bg-surface border border-border rounded-lg
              shadow-lg z-50 min-w-max
            `}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function DropdownItem({ children, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-4 py-2
        text-text-primary hover:bg-surface-2
        transition-colors first:rounded-t-lg last:rounded-b-lg
        ${className}
      `}
    >
      {children}
    </button>
  )
}
