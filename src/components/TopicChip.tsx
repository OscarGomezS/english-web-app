import { Link } from 'react-router'
import { STATUS_META, chipLabel, displayStatus } from '../lib/status'
import type { Status, TopicSummary } from '../lib/types'

export function TopicChip({
  topic,
  status,
}: {
  topic: TopicSummary
  status: Status | undefined
}) {
  const meta = STATUS_META[displayStatus(status)]
  const label = chipLabel(topic.sub_category, topic.short_title)
  return (
    <Link
      to={`/topics/${topic.id}`}
      title={`${topic.guideword}\n${topic.can_do}`}
      aria-label={`${label}. ${meta.label}. ${topic.guideword}`}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-sm text-slate-900 transition hover:-translate-y-px hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
      style={{ backgroundColor: meta.bg, borderColor: meta.border }}
    >
      <span aria-hidden className="text-xs text-slate-700">
        {meta.icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  )
}

export function StatusLegend() {
  return (
    <ul className="flex flex-wrap gap-2 text-xs text-slate-700" aria-label="Status legend">
      {(Object.keys(STATUS_META) as (keyof typeof STATUS_META)[]).map((key) => {
        const meta = STATUS_META[key]
        return (
          <li
            key={key}
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5"
            style={{ backgroundColor: meta.bg, borderColor: meta.border }}
          >
            <span aria-hidden>{meta.icon}</span>
            {meta.label}
          </li>
        )
      })}
    </ul>
  )
}
