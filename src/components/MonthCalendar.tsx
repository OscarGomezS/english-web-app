import { HEAT_COLORS, addDays, intensity, parseISODate, toISODate } from '../lib/dates'
import { formatDuration } from '../lib/status'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function MonthCalendar({
  month,
  today,
  seconds,
  selected,
  onSelect,
  onMonthChange,
}: {
  month: Date
  today: string
  seconds: Map<string, number>
  selected: string | null
  onSelect: (date: string) => void
  onMonthChange: (month: Date) => void
}) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = addDays(first, -first.getDay())
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i))
  const todayDate = parseISODate(today)
  const canGoNext =
    first < new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => onMonthChange(new Date(first.getFullYear(), first.getMonth() - 1, 1))}
          className="rounded-full px-3 py-1 text-slate-700 hover:bg-slate-100"
        >
          ‹
        </button>
        <h3 className="font-semibold text-slate-900">
          {first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          type="button"
          aria-label="Next month"
          disabled={!canGoNext}
          onClick={() => onMonthChange(new Date(first.getFullYear(), first.getMonth() + 1, 1))}
          className="rounded-full px-3 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-30"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
        {WEEKDAYS.map((d) => (
          <div key={d} aria-hidden>
            {d}
          </div>
        ))}
        {days.map((day) => {
          const iso = toISODate(day)
          const inMonth = day.getMonth() === first.getMonth()
          const future = day > todayDate
          const secs = seconds.get(iso) ?? 0
          const level = intensity(secs)
          return (
            <button
              key={iso}
              type="button"
              disabled={future}
              onClick={() => onSelect(iso)}
              aria-label={`${iso}: ${secs ? formatDuration(secs) : 'no study'}`}
              aria-pressed={selected === iso}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition focus-visible:outline-2 focus-visible:outline-violet-700 disabled:cursor-default disabled:opacity-30 ${
                inMonth ? '' : 'opacity-40'
              } ${selected === iso ? 'ring-2 ring-slate-900' : ''}`}
              style={{ backgroundColor: HEAT_COLORS[level] }}
            >
              <span className={level >= 3 ? 'font-semibold text-white' : 'text-slate-800'}>
                {day.getDate()}
              </span>
              {secs >= 60 && (
                <span
                  className={`hidden text-[10px] sm:block ${
                    level >= 3 ? 'text-violet-50' : 'text-slate-600'
                  }`}
                >
                  {Math.round(secs / 60)}m
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
