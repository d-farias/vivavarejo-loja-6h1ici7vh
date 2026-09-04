import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, pass: string) => Promise<void>
  signup: (email: string, pass: string, name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(
    pb.authStore.isValid && pb.authStore.record ? (pb.authStore.record as unknown as User) : null,
  )
  const [token, setToken] = useState<string | null>(pb.authStore.token || null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial verification
    const currentUser =
      pb.authStore.isValid && pb.authStore.record ? (pb.authStore.record as unknown as User) : null

    setUser(currentUser)
    setToken(pb.authStore.token || null)
    setLoading(false)

    // Listen to changes in authStore
    const unsubscribe = pb.authStore.onChange((newToken, model) => {
      setToken(newToken || null)
      setUser(model ? (model as unknown as User) : null)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, pass: string) => {
    const authData = await pb.collection('users').authWithPassword<User>(email.trim(), pass)
    setUser(authData.record)
    setToken(authData.token)
  }

  const signup = async (email: string, pass: string, name: string) => {
    await pb.collection('users').create({
      email: email.trim(),
      password: pass,
      passwordConfirm: pass,
      name: name.trim(),
    })
    // Auto login right after registration
    await login(email, pass)
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
