import { GoogleButton } from '../components/GoogleButton'
import { useAuth } from '../lib/auth'
import { STATUS_META } from '../lib/status'

const SAMPLE_CHIPS: { label: string; status: keyof typeof STATUS_META }[] = [
  { label: 'combining: and', status: 'completed' },
  { label: 'modifying: very', status: 'studying' },
  { label: 'past simple: regular', status: 'opened' },
  { label: 'present perfect: ever', status: 'not_started' },
]

export function Landing() {
  const { notice } = useAuth()
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-violet-50 to-slate-50 px-4 py-12 text-center">
      <img src="/favicon.svg" alt="" className="mb-6 h-14 w-14" />
      <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Every English grammar topic, from A1 to C2
      </h1>
      <p className="mt-4 max-w-lg text-slate-700">
        Read clear explanations, hear each structure in real YouTube clips, practise with
        exercises and track your progress on a study calendar.
      </p>
      <ul className="mt-6 flex max-w-lg flex-wrap justify-center gap-2" aria-hidden>
        {SAMPLE_CHIPS.map((c) => (
          <li
            key={c.label}
            className="rounded-full border px-3 py-1 text-sm text-slate-900"
            style={{
              backgroundColor: STATUS_META[c.status].bg,
              borderColor: STATUS_META[c.status].border,
            }}
          >
            {STATUS_META[c.status].icon} {c.label}
          </li>
        ))}
      </ul>
      {notice && (
        <p role="alert" className="mt-8 rounded-lg bg-amber-100 px-4 py-2 text-sm text-amber-900">
          {notice}
        </p>
      )}
      <div className="mt-8">
        <GoogleButton />
      </div>
      <p className="mt-6 text-xs text-slate-500">
        Based on the English Grammar Profile · 1,222 topics
      </p>
    </main>
  )
}
