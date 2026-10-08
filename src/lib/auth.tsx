import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { SESSION_EXPIRED_EVENT, api, session } from './api'
import type { User } from './types'

interface AuthState {
  user: User | null
  notice: string | null
  signIn: (credential: string) => Promise<void>
  signOut: () => void
  setUser: (user: User) => void
  clearNotice: () => void
}

const AuthContext = createContext<AuthState | null>(null)

function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUserState] = useState<User | null>(() =>
    session.token() ? session.user() : null,
  )
  const [notice, setNotice] = useState<string | null>(null)

  const clearUserData = useCallback(() => {
    queryClient.removeQueries({
      predicate: (q) => q.queryKey[0] !== 'topics',
    })
  }, [queryClient])

  useEffect(() => {
    const onExpired = () => {
      setUserState(null)
      clearUserData()
      setNotice('Session expired, sign in again.')
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [clearUserData])

  const signIn = useCallback(
    async (credential: string) => {
      const { token, user: u } = await api.login(credential, browserTimezone())
      clearUserData()
      session.save(token, u)
      setNotice(null)
      setUserState(u)
    },
    [clearUserData],
  )

  const signOut = useCallback(() => {
    session.clear()
    clearUserData()
    setUserState(null)
    window.google?.accounts.id.disableAutoSelect()
  }, [clearUserData])

  const setUser = useCallback((u: User) => {
    session.saveUser(u)
    setUserState(u)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        notice,
        signIn,
        signOut,
        setUser,
        clearNotice: () => setNotice(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
