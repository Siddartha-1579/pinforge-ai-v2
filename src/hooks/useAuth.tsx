/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../integrations/supabase/client'
import { logAuthAction } from '../lib/authLogging'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setLoading(false)
    }).catch((error: unknown) => {
      console.warn('Supabase getSession failed.', error)
      if (!mounted) return
      setSession(null)
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      async signIn(email, password) {
        try {
          if (!isSupabaseConfigured) throw new Error('Supabase is not configured. Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.')
          const { error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) throw error
          logAuthAction('login', 'success')
        } catch (error) {
          logAuthAction('login', 'failure', error)
          throw error
        }
      },
      async signUp(email, password) {
        try {
          if (!isSupabaseConfigured) throw new Error('Supabase is not configured. Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.')
          const { error } = await supabase.auth.signUp({ email, password })
          if (error) throw error
          logAuthAction('signup', 'success')
        } catch (error) {
          logAuthAction('signup', 'failure', error)
          throw error
        }
      },
      async signOut() {
        try {
          const { error } = await supabase.auth.signOut()
          if (error) throw error
          logAuthAction('logout', 'success')
        } catch (error) {
          logAuthAction('logout', 'failure', error)
          throw error
        }
      },
      async resetPassword(email) {
        try {
          if (!isSupabaseConfigured) throw new Error('Supabase is not configured. Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.')
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login`,
          })
          if (error) throw error
          logAuthAction('password_reset', 'success')
        } catch (error) {
          logAuthAction('password_reset', 'failure', error)
          throw error
        }
      },
    }),
    [loading, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
