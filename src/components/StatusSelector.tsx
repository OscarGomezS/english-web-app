import { MANUAL_STATUSES, STATUS_META, displayStatus } from '../lib/status'
import type { Status } from '../lib/types'

export function StatusSelector({
  status,
  onChange,
  disabled,
}: {
  status: Status | null
  onChange: (status: Status) => void
  disabled?: boolean
}) {
  const current = displayStatus(status)
  return (
    <div role="radiogroup" aria-label="Topic status" className="flex flex-wrap gap-1.5">
      {MANUAL_STATUSES.map((s) => {
        const meta = STATUS_META[s]
        const active = current === s
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => !active && onChange(s)}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium text-slate-900 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 ${
              active ? 'shadow-sm ring-2 ring-slate-900/70' : 'opacity-80 hover:opacity-100'
            }`}
            style={{
              backgroundColor: active ? meta.bg : '#fff',
              borderColor: meta.border,
            }}
          >
            <span aria-hidden>{meta.icon}</span>
            {meta.label}
          </button>
        )
      })}
    </div>
  )
}
