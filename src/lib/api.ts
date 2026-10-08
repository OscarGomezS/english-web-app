import type {
  AttemptResult,
  AttemptSummary,
  CalendarData,
  DayDetail,
  ProgressMap,
  Status,
  TopicDetail,
  TopicSummary,
  User,
} from './types'

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8500').replace(
  /\/$/,
  '',
)

const TOKEN_KEY = 'gp.token'
const USER_KEY = 'gp.user'
export const SESSION_EXPIRED_EVENT = 'gp:session-expired'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* storage unavailable */
  }
}

export const session = {
  token: () => safeGet(TOKEN_KEY),
  user: (): User | null => {
    const raw = safeGet(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as User
    } catch {
      return null
    }
  },
  save(token: string, user: User) {
    safeSet(TOKEN_KEY, token)
    safeSet(USER_KEY, JSON.stringify(user))
  },
  saveUser(user: User) {
    safeSet(USER_KEY, JSON.stringify(user))
  },
  clear() {
    safeSet(TOKEN_KEY, null)
    safeSet(USER_KEY, null)
  },
}

function headers(json: boolean): HeadersInit {
  const h: Record<string, string> = {}
  const token = session.token()
  if (token) h.Authorization = `Bearer ${token}`
  if (json) h['Content-Type'] = 'application/json'
  return h
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers: headers(body !== undefined),
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Network error. Check your connection and try again.')
  }
  if (res.status === 401 && path !== '/auth/google') {
    session.clear()
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
  }
  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    try {
      const data = await res.json()
      if (typeof data.detail === 'string') detail = data.detail
    } catch {
      /* not json */
    }
    throw new ApiError(res.status, detail)
  }
  return (await res.json()) as T
}

export async function pingHealth(timeoutMs: number): Promise<boolean> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API_URL}/api/health`, { signal: ctrl.signal })
    return res.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export function sendHeartbeat(topicId: string, seconds: number, keepalive = false) {
  const token = session.token()
  if (!token || seconds <= 0) return
  fetch(`${API_URL}/api/study/heartbeat`, {
    method: 'POST',
    keepalive,
    headers: headers(true),
    body: JSON.stringify({ topic_id: topicId, seconds }),
  }).catch(() => undefined)
}

export const api = {
  login: (credential: string, timezone: string) =>
    request<{ token: string; user: User }>('POST', '/auth/google', {
      credential,
      timezone,
    }),
  me: () => request<User>('GET', '/me'),
  updateMe: (timezone: string) => request<User>('PATCH', '/me', { timezone }),
  topics: () => request<TopicSummary[]>('GET', '/topics'),
  progress: () => request<ProgressMap>('GET', '/progress'),
  topic: (id: string) => request<TopicDetail>('GET', `/topics/${id}`),
  openTopic: (id: string) => request<{ status: Status }>('POST', `/topics/${id}/open`),
  setStatus: (id: string, status: Status) =>
    request<{ status: Status }>('PUT', `/topics/${id}/status`, { status }),
  submitAttempt: (id: string, answers: Record<string, string>) =>
    request<AttemptResult>('POST', `/topics/${id}/attempts`, { answers }),
  attemptSummary: (id: string) =>
    request<AttemptSummary>('GET', `/topics/${id}/attempts/summary`),
  calendar: (from: string, to: string) =>
    request<CalendarData>('GET', `/study/calendar?from=${from}&to=${to}`),
  day: (date: string) => request<DayDetail>('GET', `/study/day/${date}`),
  report: (topicId: string, exerciseId: string | null, message: string) =>
    request<{ ok: boolean }>('POST', '/reports', {
      topic_id: topicId,
      exercise_id: exerciseId,
      message,
    }),
}
