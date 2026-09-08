'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { EmailPasswordForm } from '@/components/auth/EmailPasswordForm'
import { Target, ListChecks, Megaphone, BarChart3, CheckCircle2 } from 'lucide-react'

const highlights = [
  { icon: Target, title: 'Track goals that matter', desc: 'Milestones, owners and live progress in one place.' },
  { icon: ListChecks, title: 'Move work forward', desc: 'A kanban board your team will actually keep updated.' },
  { icon: Megaphone, title: 'Keep everyone aligned', desc: 'Announcements, comments and mentions, no noise.' },
  { icon: BarChart3, title: 'See the full picture', desc: 'Analytics that show what shipped and what stalled.' },
]

export default function LoginPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (mounted && user) {
      const params = new URLSearchParams(window.location.search)
      router.replace(params.get('redirect') || '/dashboard')
    }
  }, [mounted, user, router])

  if (!mounted || user) return null

  return (
    <div className="flex min-h-screen w-full bg-bg">
      {/* Left: brand / value prop panel */}
      <div className="hidden lg:flex w-[46%] flex-col justify-between bg-[#0F1222] px-12 py-10 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{ background: 'radial-gradient(60% 50% at 20% 10%, rgba(99,102,241,0.35), transparent), radial-gradient(50% 40% at 90% 90%, rgba(14,165,166,0.25), transparent)' }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg gradient-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">TH</span>
          </div>
          <span className="text-white font-semibold tracking-tight">SkillShare</span>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-semibold text-white leading-tight tracking-tight max-w-md">
            Where focused teams get things done
          </h1>
          <p className="mt-4 text-sm text-white/60 max-w-sm leading-relaxed">
            Goals, actions, and announcements in a single workspace your team will actually open every day.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-5 max-w-sm">
            {highlights.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-white/80" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="text-xs text-white/50 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} SkillShare. All rights reserved.</p>
      </div>

      {/* Right: auth form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
              <span className="text-white font-bold text-xs">TH</span>
            </div>
            <span className="font-semibold tracking-tight text-text-primary">SkillShare</span>
          </div>

          <h2 className="text-2xl font-semibold text-text-primary tracking-tight">Welcome back</h2>
          <p className="mt-1.5 text-sm text-text-secondary">Sign in to continue to your workspace.</p>

          <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-accent/20 bg-accent/5 px-3.5 py-3">
            <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary leading-relaxed">
              Curious first? Use the demo button below to sign in instantly with a pre-populated workspace.
            </p>
          </div>

          <div className="mt-6">
            <EmailPasswordForm />
          </div>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-accent font-medium hover:underline">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
