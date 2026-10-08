import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/auth'

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
let scriptPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (window.google?.accounts) return Promise.resolve()
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Google sign-in failed to load'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

export function GoogleButton() {
  const { signIn } = useAuth()
  const ref = useRef<HTMLDivElement>(null)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const [error, setError] = useState<string | null>(
    clientId ? null : 'Google sign-in is not configured (VITE_GOOGLE_CLIENT_ID).',
  )
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!clientId) return
    let cancelled = false
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.google) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          use_fedcm_for_prompt: true,
          callback: async ({ credential }) => {
            setBusy(true)
            setError(null)
            try {
              await signIn(credential)
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Sign-in failed')
            } finally {
              setBusy(false)
            }
          },
        })
        window.google.accounts.id.renderButton(ref.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
        })
      })
      .catch((e: Error) => setError(e.message))
    return () => {
      cancelled = true
    }
  }, [clientId, signIn])

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={ref} className="min-h-[44px]" aria-busy={busy} />
      {busy && <p className="text-sm text-slate-600">Signing you in…</p>}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
