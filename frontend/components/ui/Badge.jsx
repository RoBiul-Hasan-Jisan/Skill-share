'use client'

export function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const variants = {
    default: 'bg-surface-2 text-text-primary',
    'on-track': 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100',
    'at-risk': 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100',
    behind: 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100',
    completed: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100',
    todo: 'bg-surface-2 text-text-primary',
    'in-progress': 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100',
    'in-review': 'bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100',
    done: 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100',
    low: 'bg-surface-2 text-text-primary',
    medium: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100',
    high: 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100',
    urgent: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
  }

  return (
    <span className={`
      inline-flex items-center rounded-full font-medium
      ${sizes[size] || sizes.md}
      ${variants[variant] || variants.default}
      ${className}
    `}>
      {children}
    </span>
  )
}
