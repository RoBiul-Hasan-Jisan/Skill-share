'use client'

import { useEffect, createContext, useContext } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut, getIdToken } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'

const FirebaseAuthContext = createContext(null)

export function useFirebaseAuth() {
  return useContext(FirebaseAuthContext)
}

export function FirebaseProvider({ children }) {
  const { setUser, clearUser, setSignOut } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await getIdToken(firebaseUser)
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          avatarUrl: firebaseUser.photoURL,
          role: 'ADMIN',
          token,
        })
      } else {
        clearUser()
      }
    })

    return () => unsubscribe()
  }, [setUser, clearUser])

  useEffect(() => {
    setSignOut(() => {
      fbSignOut(auth)
      clearUser()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user')
      }
    })
    return () => setSignOut(null)
  }, [setSignOut, clearUser])

  const signIn = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password)
  }

  return (
    <FirebaseAuthContext.Provider value={{ signIn }}>
      {children}
    </FirebaseAuthContext.Provider>
  )
}
