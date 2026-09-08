'use client'

import { Button } from './Button'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel = 'Create',
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <Icon className="w-12 h-12 text-text-muted mb-4 opacity-50" />
      )}
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-text-secondary mb-6 max-w-md">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
