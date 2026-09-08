'use client'

import { motion } from 'framer-motion'

export function ProgressBar({ value = 0, size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  const percentage = Math.min(100, Math.max(0, value))

  const getColor = () => {
    return 'bg-accent'
  }

  return (
    <div className={`${sizes[size]} w-full bg-surface-2 rounded-full overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ type: 'spring', stiffness: 50, damping: 20 }}
        className={`h-full ${getColor()} rounded-full`}
      />
    </div>
  )
}
