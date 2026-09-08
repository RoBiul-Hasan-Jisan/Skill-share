'use client'

import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  token: null,
  signOut: null,
  authInitialized: false,

  setUser: (user) => {
    if (typeof window !== 'undefined') {
      if (user) {
        const { token, ...safeUser } = user
        localStorage.setItem('user', JSON.stringify(safeUser))
        if (token) localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
    set({
      user,
      isAuthenticated: !!user,
      token: user?.token || null,
      authInitialized: true,
    })
  },

  setSignOut: (fn) => set({ signOut: fn }),

  loadUser: () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user')
      const storedToken = localStorage.getItem('token')
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser)
          set({
            user,
            isAuthenticated: !!user,
            token: storedToken || null,
            authInitialized: true,
          })
          return user
        } catch (e) {
          console.error('Failed to load user from localStorage', e)
        }
      }
    }
    return null
  },

  clearUser: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
    set({
      user: null,
      isAuthenticated: false,
      token: null,
      authInitialized: true,
    })
  },

  updateUser: (updates) =>
    set((state) => {
      const updatedUser = state.user ? { ...state.user, ...updates } : null
      if (typeof window !== 'undefined' && updatedUser) {
        const { token, ...safeUser } = updatedUser
        localStorage.setItem('user', JSON.stringify(safeUser))
        if (token) localStorage.setItem('token', token)
      }
      return {
        user: updatedUser,
        token: updatedUser?.token || state.token,
      }
    }),
}))
