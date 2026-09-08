'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import dynamic from 'next/dynamic'

const DashboardClient = dynamic(() => import('./dashboard-client').then(mod => ({ default: mod.DashboardClient })), {
  loading: () => (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="animate-spin text-2xl">⟳</div>
    </div>
  ),
  ssr: false,
})

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const authInitialized = useAuthStore((s) => s.authInitialized)

  useEffect(() => {
    if (authInitialized && !user) {
      router.replace('/login')
    }
  }, [authInitialized, user, router])

  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin text-2xl">⟳</div>
      </div>
    )
  }

  if (!user) return null

  return <DashboardClient>{children}</DashboardClient>
}
