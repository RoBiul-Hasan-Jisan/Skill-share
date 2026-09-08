'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { ShieldCheck, Zap, Users } from 'lucide-react'

const highlights = [
  { icon: Zap, text: 'Set up your first workspace in under a minute' },
  { icon: Users, text: 'Invite teammates and assign roles instantly' },
  { icon: ShieldCheck, text: 'Every change tracked in an immutable audit log' },
]

export default function RegisterPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (mounted && user) router.replace('/dashboard')
  }, [mounted, user, router])

  if (!mounted || user) return null

  return (
    <div className="flex min-h-screen w-full bg-bg">
      {/* Left: brand / value prop panel */}
      <div className="hidden lg:flex w-[46%] flex-col justify-between bg-[#0F1222] px-12 py-10 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{ background: 'radial-gradient(60% 50% at 80% 10%, rgba(99,102,241,0.35), transparent), radial-gradient(50% 40% at 10% 90%, rgba(14,165,166,0.25), transparent)' }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg gradient-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">TH</span>
          </div>
          <span className="text-white font-semibold tracking-tight">SkillShare</span>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-semibold text-white leading-tight tracking-tight max-w-md">
            Build the workspace your team actually wants to use
          </h1>
          <p className="mt-4 text-sm text-white/60 max-w-sm leading-relaxed">
            Create a free account and spin up your first workspace — goals, tasks and announcements, all in one place.
          </p>

          <div className="mt-10 space-y-4 max-w-sm">
            {highlights.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white/80" />
                </div>
                <p className="text-sm text-white/80">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} SkillShare. All rights reserved.</p>
      </div>

      {/* Right: register form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
              <span className="text-white font-bold text-xs">TH</span>
            </div>
            <span className="font-semibold tracking-tight text-text-primary">SkillShare</span>
          </div>

          <h2 className="text-2xl font-semibold text-text-primary tracking-tight">Create your account</h2>
          <p className="mt-1.5 text-sm text-text-secondary">
            Already have one?{' '}
            <Link href="/login" className="text-accent font-medium hover:underline">Sign in instead</Link>
          </p>

          <div className="mt-6">
            <RegisterForm />
          </div>

          <p className="mt-6 text-center text-xs text-text-muted">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
