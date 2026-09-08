'use client'

import { forwardRef } from 'react'

export const Input = forwardRef(({
  label,
  error,
  hint,
  icon,
  trailingIcon,
  type = 'text',
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3 text-text-muted pointer-events-none flex items-center">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          className={`
            w-full h-10 px-3.5 rounded-lg
            bg-surface border border-border
            text-sm text-text-primary placeholder-text-muted
            focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
            transition-all
            ${icon ? 'pl-9' : ''}
            ${trailingIcon ? 'pr-9' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `}
          {...props}
        />
        {trailingIcon && (
          <span className="absolute right-3 flex items-center">
            {trailingIcon}
          </span>
        )}
      </div>
      {hint && !error && (
        <p className="text-text-muted text-xs mt-1.5">{hint}</p>
      )}
      {error && (
        <p className="text-red-500 text-xs mt-1.5">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
