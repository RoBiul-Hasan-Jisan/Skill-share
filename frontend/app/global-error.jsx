'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backgroundColor: '#f5f5f5',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}>
            <div>
              <h1 style={{
                fontSize: '2.25rem',
                fontWeight: 'bold',
                color: '#111',
                marginBottom: '0.5rem',
              }}>
                Critical Error
              </h1>
              <p style={{
                color: '#666',
                fontSize: '1rem',
              }}>
                The application encountered a critical error. Please try refreshing.
              </p>
            </div>

            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              padding: '1rem',
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#991b1b',
                fontFamily: 'monospace',
                wordBreak: 'break-word',
              }}>
                {error?.message || 'Unknown error'}
              </p>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              <button
                onClick={() => reset()}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#1a1a1a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#e5e7eb',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
