import type { DisplayStatus, Status } from './types'

export const STATUS_META: Record<
  DisplayStatus,
  { label: string; icon: string; bg: string; border: string }
> = {
  not_started: { label: 'Not started', icon: '○', bg: '#E5E7EB', border: '#D1D5DB' },
  opened: { label: 'Opened', icon: '◐', bg: '#FEF3C7', border: '#FCD34D' },
  studying: { label: 'Studying', icon: '✎', bg: '#E9D5FF', border: '#C084FC' },
  completed: { label: 'Completed', icon: '✓', bg: '#BBF7D0', border: '#4ADE80' },
}

export const MANUAL_STATUSES: Status[] = ['opened', 'studying', 'completed']
export const ALL_STATUSES: DisplayStatus[] = [
  'not_started',
  'opened',
  'studying',
  'completed',
]

export function displayStatus(status: Status | null | undefined): DisplayStatus {
  return status ?? 'not_started'
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export function chipLabel(subCategory: string, shortTitle: string): string {
  return `${subCategory}: ${shortTitle}`
}

export function titleCase(value: string): string {
  return value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}
