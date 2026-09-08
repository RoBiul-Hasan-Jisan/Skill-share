'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">Something went wrong</h1>
          <p className="text-text-secondary">An unexpected error occurred. Try refreshing the page or go back.</p>
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
            className="w-full"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/dashboard'}
            variant="secondary"
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
