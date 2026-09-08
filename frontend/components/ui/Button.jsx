'use client'

import { motion } from 'framer-motion'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const variants = {
    primary: 'bg-accent text-accent-fg hover:opacity-90 shadow-sm',
    secondary: 'bg-surface text-text-primary hover:bg-surface-2 border border-border',
    outline: 'bg-transparent text-text-primary hover:bg-surface-2 border border-border',
    ghost: 'text-text-primary hover:bg-surface-2',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-sm',
  }

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      disabled={disabled || loading}
      className={`
        inline-flex items-center rounded-lg font-medium transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading ? (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          className="inline-block"
        >
          ⟳
        </motion.span>
      ) : (
        children
      )}
    </motion.button>
  )
}
