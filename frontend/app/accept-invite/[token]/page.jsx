'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui'

export default function AcceptInvitePage() {
  const { token } = useParams()
  const router = useRouter()
  const [status, setStatus] = useState('loading')
  const [workspaceName, setWorkspaceName] = useState('')
  const [error, setError] = useState('')
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    acceptInvite()
  }, [token, user])

  async function acceptInvite() {
    if (!user) {
      router.push(`/login?redirect=/accept-invite/${token}`)
      return
    }

    try {
      const res = await api.post(`/workspaces/join/${token}`)
      setStatus('success')
      setWorkspaceName(res.data.message)
      toast.success('Welcome to the workspace!')
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      setStatus('error')
      const message = err.response?.data?.error || 'Failed to accept invitation'
      setError(message)
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          {status === 'loading' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex justify-center mb-4"
            >
              <Loader className="w-12 h-12 text-accent" />
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="flex justify-center mb-4"
            >
              <CheckCircle className="w-16 h-16 text-green-500" />
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="flex justify-center mb-4"
            >
              <AlertCircle className="w-16 h-16 text-red-500" />
            </motion.div>
          )}

          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {status === 'loading' && 'Accepting Invitation...'}
            {status === 'success' && 'Welcome!'}
            {status === 'error' && 'Invitation Error'}
          </h1>

          <p className="text-text-muted mb-6">
            {status === 'loading' && 'Please wait while we process your invitation.'}
            {status === 'success' && 'You have successfully joined the workspace!'}
            {status === 'error' && error}
          </p>

          {status === 'success' && (
            <p className="text-sm text-text-secondary mb-6">
              Redirecting to dashboard in 2 seconds...
            </p>
          )}

          {status === 'error' && (
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => router.push('/dashboard')}
                className="flex-1"
              >
                Go to Dashboard
              </Button>
              <Button
                onClick={() => {
                  setStatus('loading')
                  setError('')
                  acceptInvite()
                }}
                className="flex-1"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
