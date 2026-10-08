import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Heatmap } from '../components/Heatmap'
import { MonthCalendar } from '../components/MonthCalendar'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { addDays, formatLongDate, parseISODate, toISODate, todayIn } from '../lib/dates'
import { useProgress, useTopics } from '../lib/queries'
import { ALL_STATUSES, STATUS_META, chipLabel, formatDuration } from '../lib/status'
import type { DisplayStatus } from '../lib/types'

export function CalendarPage() {
  const { user } = useAuth()
  const today = todayIn(user?.timezone ?? 'UTC')
  const from = toISODate(addDays(parseISODate(today), -400))
  const calendar = useQuery({
    queryKey: ['calendar', user?.id, from, today],
    queryFn: () => api.calendar(from, today),
  })
  const progress = useProgress()
  const topics = useTopics()
  const [selected, setSelected] = useState<string | null>(null)
  const [month, setMonth] = useState(() => {
    const t = parseISODate(today)
    return new Date(t.getFullYear(), t.getMonth(), 1)
  })

  const seconds = useMemo(
    () => new Map((calendar.data?.days ?? []).map((d) => [d.date, d.total_seconds])),
    [calendar.data],
  )

  const statusCounts = useMemo(() => {
    const counts: Record<DisplayStatus, number> = {
      not_started: 0,
      opened: 0,
      studying: 0,
      completed: 0,
    }
    const map = progress.data ?? {}
    for (const s of Object.values(map)) counts[s]++
    counts.not_started = Math.max((topics.data?.length ?? 0) - Object.keys(map).length, 0)
    return counts
  }, [progress.data, topics.data])

  const select = (date: string) => {
    setSelected(date)
    const d = parseISODate(date)
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1))
  }

  const empty = calendar.isSuccess && calendar.data.days.length === 0

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Study calendar</h1>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Total study time</dt>
          <dd className="mt-1 text-xl font-semibold">
            {calendar.data ? formatDuration(calendar.data.total_seconds) : '—'}
          </dd>
        </div>
        {ALL_STATUSES.map((s) => (
          <div
            key={s}
            className="rounded-2xl border p-4"
            style={{ backgroundColor: STATUS_META[s].bg, borderColor: STATUS_META[s].border }}
          >
            <dt className="text-xs uppercase tracking-wide text-slate-700">
              <span aria-hidden>{STATUS_META[s].icon}</span> {STATUS_META[s].label}
            </dt>
            <dd className="mt-1 text-xl font-semibold text-slate-900">{statusCounts[s]}</dd>
          </div>
        ))}
      </dl>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold">Last 12 months</h2>
        {calendar.isError ? (
          <p role="alert" className="text-red-700">
            Couldn't load your calendar. {calendar.error.message}
          </p>
        ) : (
          <>
            {empty && (
              <p className="mb-3 rounded-lg bg-violet-50 p-3 text-sm text-violet-900">
                Open a topic to start tracking your study time.
              </p>
            )}
            <Heatmap today={today} seconds={seconds} selected={selected} onSelect={select} />
          </>
        )}
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <MonthCalendar
            month={month}
            today={today}
            seconds={seconds}
            selected={selected}
            onSelect={select}
            onMonthChange={setMonth}
          />
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-live="polite">
          {selected ? (
            <DayDetailPanel date={selected} />
          ) : (
            <p className="text-slate-600">Pick a day to see what you studied.</p>
          )}
        </section>
      </div>
    </div>
  )
}

function DayDetailPanel({ date }: { date: string }) {
  const { user } = useAuth()
  const day = useQuery({
    queryKey: ['day', user?.id, date],
    queryFn: () => api.day(date),
  })
  return (
    <div>
      <h2 className="font-semibold text-slate-900">{formatLongDate(date)}</h2>
      {day.isPending && <p className="mt-2 text-sm text-slate-500">Loading…</p>}
      {day.isError && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {day.error.message}
        </p>
      )}
      {day.data && (
        <>
          <p className="mt-1 text-sm text-slate-600">
            {day.data.total_seconds
              ? `${formatDuration(day.data.total_seconds)} in total`
              : 'No study time on this day.'}
          </p>
          <ul className="mt-3 divide-y divide-slate-100">
            {day.data.topics.map((t) => (
              <li key={t.topic_id} className="flex items-center justify-between gap-3 py-2">
                <Link to={`/topics/${t.topic_id}`} className="min-w-0 text-sm hover:underline">
                  <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                    {t.level}
                  </span>
                  <span className="text-slate-800">
                    {t.sub_category && t.short_title
                      ? chipLabel(t.sub_category, t.short_title)
                      : t.topic_id}
                  </span>
                </Link>
                <span className="shrink-0 text-sm text-slate-600">
                  {formatDuration(t.seconds)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
