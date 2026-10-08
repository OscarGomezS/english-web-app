import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { pingHealth } from '../lib/api'

type Phase = 'checking' | 'waking' | 'ready' | 'failed'

const FIRST_WAIT_MS = 1500
const GIVE_UP_MS = 90_000

export function WakeGate({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<Phase>('checking')
  const run = useRef(0)

  const wake = useCallback(async () => {
    const id = ++run.current
    const started = Date.now()
    setPhase('checking')
    const slow = setTimeout(() => {
      if (run.current === id) setPhase((p) => (p === 'checking' ? 'waking' : p))
    }, FIRST_WAIT_MS)
    let delay = 1000
    while (run.current === id && Date.now() - started < GIVE_UP_MS) {
      if (await pingHealth(15_000)) {
        clearTimeout(slow)
        if (run.current === id) {
          setPhase('ready')
          queryClient.invalidateQueries({
            predicate: (q) => q.state.status === 'error',
          })
        }
        return
      }
      await new Promise((r) => setTimeout(r, delay))
      delay = Math.min(delay * 1.6, 8000)
    }
    clearTimeout(slow)
    if (run.current === id) setPhase('failed')
  }, [queryClient])

  useEffect(() => {
    void wake()
    return () => {
      run.current++
    }
  }, [wake])

  const hasCache = !!queryClient.getQueryData(['topics'])

  if (phase === 'ready' || phase === 'checking') return <>{children}</>

  if (hasCache) {
    return (
      <>
        <div
          role="status"
          className="sticky top-0 z-40 bg-amber-100 px-4 py-2 text-center text-sm text-amber-900"
        >
          {phase === 'waking' ? (
            <>
              <Spinner /> Waking up the server… this can take up to a minute.
            </>
          ) : (
            <>
              The server isn't responding.{' '}
              <button className="font-semibold underline" onClick={() => void wake()}>
                Retry
              </button>
            </>
          )}
        </div>
        {children}
      </>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
      {phase === 'waking' ? (
        <>
          <Spinner large />
          <h1 className="text-xl font-semibold text-slate-900">Waking up the server…</h1>
          <p className="max-w-sm text-slate-600">
            This can take up to a minute. The free server goes to sleep when nobody is
            using it.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold text-slate-900">
            We couldn't reach the server
          </h1>
          <p className="max-w-sm text-slate-600">
            Check your connection and try again in a moment.
          </p>
          <button
            onClick={() => void wake()}
            className="rounded-full bg-violet-700 px-5 py-2 font-medium text-white hover:bg-violet-800"
          >
            Retry
          </button>
        </>
      )}
    </main>
  )
}

function Spinner({ large = false }: { large?: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px] ${
        large ? 'h-8 w-8 text-violet-600' : 'mr-1 h-3.5 w-3.5'
      }`}
    />
  )
}
