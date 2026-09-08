'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function Tooltip({ children, content, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false)

  const positions = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  }

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`
              absolute ${positions[position]}
              bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900
              px-2 py-1 rounded text-xs whitespace-nowrap
              shadow-soft
              z-50 pointer-events-none
            `}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
