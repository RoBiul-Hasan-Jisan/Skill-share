'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useFirebaseAuth } from './FirebaseProvider'
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react'
import { Input, Button } from '@/components/ui'

const DEMO_EMAIL = 'demo@skillshare.com'
const DEMO_PASSWORD = 'demo123'

export function EmailPasswordForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const router = useRouter()
  const { signIn } = useFirebaseAuth()

  const goToApp = () => {
    const redirect = new URLSearchParams(window.location.search).get('redirect') || '/dashboard'
    router.replace(redirect)
  }

  const attemptSignIn = async (signInEmail, signInPassword) => {
    setError('')
    try {
      await signIn(signInEmail, signInPassword)
      goToApp()
      return true
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later.')
      } else {
        setError('Something went wrong. Please try again.')
      }
      return false
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      goToApp()
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Please try again.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await attemptSignIn(email, password)
    setLoading(false)
  }

  const handleTryDemo = async () => {
    setDemoLoading(true)
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    await attemptSignIn(DEMO_EMAIL, DEMO_PASSWORD)
    setDemoLoading(false)
  }

  return (
    <div className="space-y-5">
      <Button
        type="button"
        onClick={handleTryDemo}
        disabled={demoLoading || loading}
        variant="secondary"
        className="w-full justify-center gap-2 border-dashed"
      >
        <Sparkles className="w-4 h-4 text-accent" />
        {demoLoading ? 'Signing in to demo…' : 'Try the demo workspace'}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
          <span className="bg-bg lg:bg-surface px-2 text-text-muted">or sign in with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            icon={<Mail className="w-4 h-4" />}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-text-secondary">Password</label>
            <button type="button" className="text-xs text-accent hover:underline">Forgot?</button>
          </div>
          <Input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            icon={<Lock className="w-4 h-4" />}
            trailingIcon={
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-text-muted hover:text-text-secondary">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full justify-center">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <Button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        variant="outline"
        className="w-full justify-center gap-3"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {googleLoading ? 'Signing in…' : 'Continue with Google'}
      </Button>
    </div>
  )
}
