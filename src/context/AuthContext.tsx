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
  const [user, setUser] = useState<User | null>(() => {
    if (pb.authStore.isValid && pb.authStore.record) {
      const rec = pb.authStore.record as unknown as User
      return {
        ...rec,
        perfil: rec.perfil || (rec.email === 'dfarias53@gmail.com' ? 'admin' : 'lider'),
      }
    }
    return null
  })
  const [token, setToken] = useState<string | null>(pb.authStore.token || null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial verification
    if (pb.authStore.isValid && pb.authStore.record) {
      const rec = pb.authStore.record as unknown as User
      const updatedUser = {
        ...rec,
        perfil: rec.perfil || (rec.email === 'dfarias53@gmail.com' ? 'admin' : 'lider'),
      }
      setUser(updatedUser)
      // If perfil isn't set yet on model, refresh auth store
      if (!rec.perfil) {
        pb.collection('users')
          .getOne<User>(rec.id)
          .then((fresh) => {
            setUser(fresh)
          })
          .catch(() => {})
      }
    } else {
      setUser(null)
    }

    setToken(pb.authStore.token || null)
    setLoading(false)

    // Listen to changes in authStore
    const unsubscribe = pb.authStore.onChange((newToken, model) => {
      setToken(newToken || null)
      if (model) {
        const rec = model as unknown as User
        setUser({
          ...rec,
          perfil: rec.perfil || (rec.email === 'dfarias53@gmail.com' ? 'admin' : 'lider'),
        })
      } else {
        setUser(null)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, pass: string) => {
    const authData = await pb.collection('users').authWithPassword<User>(email.trim(), pass)
    if (authData.record.ativo === false) {
      pb.authStore.clear()
      setUser(null)
      setToken(null)
      throw new Error('Esta conta de usuário foi desativada pelo administrador.')
    }
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
