import { useEffect, useRef, useState } from 'react'

const SCRIPT_SRC = 'https://youglish.com/public/emb/widget.js'
const COMPONENTS = 8 + 16 + 64
let ready: Promise<void> | null = null
let widgetCounter = 0

function loadYouGlish(): Promise<void> {
  if (window.YG) return Promise.resolve()
  ready ??= new Promise((resolve, reject) => {
    window.onYouglishAPIReady = () => {
      const key = import.meta.env.VITE_YOUGLISH_KEY
      if (key) window.YG?.setPartnerKey?.(key)
      resolve()
    }
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onerror = () => {
      ready = null
      reject(new Error('YouGlish failed to load'))
    }
    document.head.appendChild(script)
  })
  return ready
}

type FetchState = 'idle' | 'loading' | 'found' | 'empty' | 'error'

export function YouGlish({ phrases }: { phrases: string[] }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<YGWidget | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [state, setState] = useState<FetchState>('idle')

  useEffect(() => {
    return () => {
      try {
        widgetRef.current?.close()
      } catch {
        /* widget already gone */
      }
      widgetRef.current = null
    }
  }, [])

  const play = async (phrase: string) => {
    setSelected(phrase)
    setState('loading')
    try {
      await loadYouGlish()
    } catch {
      setState('error')
      return
    }
    const host = hostRef.current
    if (!host || !window.YG) return
    if (!widgetRef.current) {
      const id = `yg-widget-${++widgetCounter}`
      const el = document.createElement('div')
      el.id = id
      host.replaceChildren(el)
      widgetRef.current = new window.YG.Widget(id, {
        width: Math.min(host.clientWidth || 640, 720),
        components: COMPONENTS,
        autoStart: 1,
        events: {
          onFetchDone: (e) => setState(e.totalResult > 0 ? 'found' : 'empty'),
          onError: () => setState('error'),
        },
      })
    }
    widgetRef.current.fetch(phrase, 'english')
  }

  if (phrases.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Video phrases">
        {phrases.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={selected === p}
            onClick={() => void play(p)}
            className={`rounded-full border px-3 py-1 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 ${
              selected === p
                ? 'border-violet-700 bg-violet-700 text-white'
                : 'border-slate-300 bg-white text-slate-800 hover:border-violet-400'
            }`}
          >
            ▶ “{p}”
          </button>
        ))}
      </div>
      {state === 'idle' && (
        <p className="text-sm text-slate-600">
          Pick a phrase to hear it in real YouTube videos.
        </p>
      )}
      {state === 'loading' && <p className="text-sm text-slate-600">Searching videos…</p>}
      {state === 'empty' && (
        <p className="text-sm text-amber-800">
          No videos found for “{selected}”. Try another phrase.
        </p>
      )}
      {state === 'error' && (
        <p className="text-sm text-red-700">
          The video player couldn't load. Try another phrase or reload the page.
        </p>
      )}
      <div ref={hostRef} className="w-full overflow-hidden rounded-xl" />
    </div>
  )
}
