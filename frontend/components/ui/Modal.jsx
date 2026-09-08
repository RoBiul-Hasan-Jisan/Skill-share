'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={onClose}
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className={`
              relative bg-surface border border-border rounded-xl
              shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto z-50
              ${className}
            `}
          >
            {title && (
              <div className="border-b border-border px-6 py-4 sticky top-0 bg-surface">
                <h2 className="text-xl font-semibold text-text-primary">
                  {title}
                </h2>
              </div>
            )}
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
