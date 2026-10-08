import { useEffect } from 'react'
import { sendHeartbeat } from './api'

const TICK_MS = 5_000
const BEAT_MS = 30_000
const IDLE_MS = 2 * 60_000

export function useStudyTimer(topicId: string | undefined, enabled: boolean) {
  useEffect(() => {
    if (!topicId || !enabled) return
    let lastInteraction = Date.now()
    let lastTick = Date.now()
    let lastBeat = Date.now()
    let pending = 0

    const isActive = () => {
      const visible = document.visibilityState === 'visible'
      const watching = document.activeElement?.tagName === 'IFRAME'
      return visible && (watching || Date.now() - lastInteraction < IDLE_MS)
    }

    const accumulate = () => {
      const now = Date.now()
      if (isActive()) pending += (now - lastTick) / 1000
      lastTick = now
    }

    const flush = (keepalive: boolean) => {
      accumulate()
      const seconds = Math.round(pending)
      pending -= seconds
      lastBeat = Date.now()
      if (seconds > 0) sendHeartbeat(topicId, Math.min(seconds, 60), keepalive)
    }

    const onInteract = () => {
      if (!isActive()) lastTick = Date.now()
      lastInteraction = Date.now()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush(true)
      else {
        lastTick = Date.now()
        lastInteraction = Date.now()
      }
    }
    const onPageHide = () => flush(true)

    const timer = window.setInterval(() => {
      accumulate()
      if (Date.now() - lastBeat >= BEAT_MS) flush(false)
    }, TICK_MS)

    const events = ['pointerdown', 'keydown', 'scroll', 'mousemove', 'touchstart']
    events.forEach((e) => window.addEventListener(e, onInteract, { passive: true }))
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)

    return () => {
      window.clearInterval(timer)
      events.forEach((e) => window.removeEventListener(e, onInteract))
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
      flush(true)
    }
  }, [topicId, enabled])
}
