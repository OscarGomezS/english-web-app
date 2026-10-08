import { HEAT_COLORS, addDays, intensity, parseISODate, toISODate } from '../lib/dates'
import { formatDuration } from '../lib/status'

const CELL = 12
const GAP = 3
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

export function Heatmap({
  today,
  seconds,
  selected,
  onSelect,
}: {
  today: string
  seconds: Map<string, number>
  selected: string | null
  onSelect: (date: string) => void
}) {
  const end = parseISODate(today)
  const start = addDays(end, -(52 * 7 + end.getDay()))
  const weeks: Date[][] = []
  for (let d = start; d <= end; d = addDays(d, 1)) {
    if (d.getDay() === 0) weeks.push([])
    weeks[weeks.length - 1].push(d)
  }
  const monthLabels = weeks.map((week, i) => {
    const first = week[0]
    const prev = weeks[i - 1]?.[0]
    return !prev || prev.getMonth() !== first.getMonth()
      ? first.toLocaleDateString('en-US', { month: 'short' })
      : ''
  })

  return (
    <div className="overflow-x-auto pb-2">
      <div className="inline-flex gap-2">
        <div
          className="grid text-[10px] text-slate-500"
          style={{ gridTemplateRows: `14px repeat(7, ${CELL}px)`, rowGap: GAP }}
          aria-hidden
        >
          <span />
          {DAY_LABELS.map((l, i) => (
            <span key={i} className="leading-3">
              {l}
            </span>
          ))}
        </div>
        <div className="flex" style={{ gap: GAP }} role="grid" aria-label="Study heatmap">
          {weeks.map((week, wi) => (
            <div
              key={wi}
              className="grid"
              role="row"
              style={{ gridTemplateRows: `14px repeat(7, ${CELL}px)`, rowGap: GAP }}
            >
              <span className="whitespace-nowrap text-[10px] leading-3 text-slate-500">
                {monthLabels[wi]}
              </span>
              {week.map((day) => {
                const iso = toISODate(day)
                const secs = seconds.get(iso) ?? 0
                const label = `${iso}: ${secs ? formatDuration(secs) : 'no study'}`
                return (
                  <button
                    key={iso}
                    type="button"
                    role="gridcell"
                    title={label}
                    aria-label={label}
                    aria-selected={selected === iso}
                    onClick={() => onSelect(iso)}
                    className={`rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet-700 ${
                      selected === iso ? 'ring-2 ring-slate-900' : ''
                    }`}
                    style={{
                      width: CELL,
                      height: CELL,
                      gridRowStart: day.getDay() + 2,
                      backgroundColor: HEAT_COLORS[intensity(secs)],
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500" aria-hidden>
        Less
        {HEAT_COLORS.map((c) => (
          <span
            key={c}
            className="inline-block rounded-[3px]"
            style={{ width: CELL, height: CELL, backgroundColor: c }}
          />
        ))}
        More
      </div>
    </div>
  )
}
