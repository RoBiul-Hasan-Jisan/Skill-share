'use client'

import { motion } from 'framer-motion'

export function Card({
  children,
  className = '',
  hover = false,
  ...props
}) {
  return (
    <motion.div
      whileHover={hover ? { y: -2 } : {}}
      className={`
        bg-surface border border-border rounded-lg shadow-soft
        p-4 transition-all ${hover ? 'hover:shadow-soft-lg' : ''} ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  )
}
