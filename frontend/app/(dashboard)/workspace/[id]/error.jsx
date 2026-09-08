'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui'

export default function WorkspaceError({ error, reset }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-md space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Workspace Error</h2>
          <p className="text-text-secondary">Something went wrong while loading this workspace.</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700 font-mono break-words">
            {error?.message || 'Unknown error'}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => reset()}
            variant="primary"
          >
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = '/dashboard'}
            variant="secondary"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
