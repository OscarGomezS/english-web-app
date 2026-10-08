export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, days: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + days)
  return out
}

export function todayIn(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  } catch {
    return toISODate(new Date())
  }
}

export function formatLongDate(value: string): string {
  return parseISODate(value).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function intensity(seconds: number): 0 | 1 | 2 | 3 | 4 {
  const minutes = seconds / 60
  if (minutes < 1) return 0
  if (minutes < 15) return 1
  if (minutes < 30) return 2
  if (minutes < 60) return 3
  return 4
}

export const HEAT_COLORS = ['#F1F5F9', '#DDD6FE', '#C4B5FD', '#A78BFA', '#7C3AED']
