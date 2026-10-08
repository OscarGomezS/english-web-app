import { useMemo, useState } from 'react'
import { Navigate, NavLink, useParams } from 'react-router'
import { ResetProgressDialog } from '../components/ResetProgressDialog'
import { StatusLegend, TopicChip } from '../components/TopicChip'
import { useProgress, useTopics } from '../lib/queries'
import { STATUS_META, titleCase } from '../lib/status'
import { LEVELS } from '../lib/types'
import type { Level, ProgressMap, TopicSummary } from '../lib/types'

type Mode = 'level' | 'category'

export function LevelView() {
  const { level } = useParams()
  if (!LEVELS.includes(level as Level)) return <Navigate to="/levels/A1" replace />
  return <Browse mode="level" value={level as Level} />
}

export function CategoryView() {
  const { category } = useParams()
  return <Browse mode="category" value={category ?? ''} />
}

function Browse({ mode, value }: { mode: Mode; value: string }) {
  const topics = useTopics()
  const progress = useProgress()
  const all = useMemo(() => topics.data ?? [], [topics.data])
  const statusMap = progress.data ?? {}
  const [resetOpen, setResetOpen] = useState(false)

  const categories = useMemo(
    () => [...new Set(all.map((t) => t.super_category))].sort(),
    [all],
  )

  if (topics.isPending) return <BrowseSkeleton />
  if (topics.isError)
    return (
      <p role="alert" className="py-10 text-center text-red-700">
        Couldn't load the topics. {topics.error.message}
      </p>
    )
  if (mode === 'category' && !categories.includes(value) && categories.length)
    return <Navigate to={`/categories/${encodeURIComponent(categories[0])}`} replace />

  const inView = all.filter((t) =>
    mode === 'level' ? t.level === value : t.super_category === value,
  )
  const groups = groupBy(inView, (t) => (mode === 'level' ? t.super_category : t.level))
  const groupKeys =
    mode === 'level' ? [...groups.keys()].sort() : LEVELS.filter((l) => groups.has(l))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Grammar topics</h1>
        <ModeToggle mode={mode} firstCategory={categories[0]} />
      </div>

      <Tabs
        label={mode === 'level' ? 'Levels' : 'Categories'}
        items={
          mode === 'level'
            ? LEVELS.map((l) => ({ key: l, label: l, to: `/levels/${l}` }))
            : categories.map((c) => ({
                key: c,
                label: titleCase(c),
                to: `/categories/${encodeURIComponent(c)}`,
              }))
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Overview topics={inView} statusMap={statusMap} />
          {mode === 'level' && inView.some((t) => statusMap[t.id]) && (
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="text-sm text-slate-500 underline hover:text-red-700"
            >
              Reset {value} progress
            </button>
          )}
        </div>
        <StatusLegend />
      </div>
      {resetOpen && (
        <ResetProgressDialog
          open
          initialScope={value as Level}
          onClose={() => setResetOpen(false)}
        />
      )}

      <div className="space-y-3">
        {groupKeys.map((key) => (
          <Section
            key={`${value}-${key}`}
            title={mode === 'level' ? titleCase(key) : key}
            topics={groups.get(key) ?? []}
            statusMap={statusMap}
          />
        ))}
      </div>
    </div>
  )
}

function ModeToggle({ mode, firstCategory }: { mode: Mode; firstCategory?: string }) {
  const cls = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm font-medium transition ${
      active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
    }`
  return (
    <div className="inline-flex rounded-full bg-slate-200 p-1" role="group" aria-label="Group by">
      <NavLink to="/levels/A1" className={cls(mode === 'level')} aria-current={mode === 'level'}>
        Level
      </NavLink>
      <NavLink
        to={`/categories/${encodeURIComponent(firstCategory ?? 'ADJECTIVES')}`}
        className={cls(mode === 'category')}
        aria-current={mode === 'category'}
      >
        SuperCategory
      </NavLink>
    </div>
  )
}

function Tabs({ label, items }: { label: string; items: { key: string; label: string; to: string }[] }) {
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-1.5 sm:w-auto sm:flex-wrap">
        {items.map((item) => (
          <li key={item.key}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `block whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 ${
                  isActive
                    ? 'border-violet-700 bg-violet-700 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-violet-400'
                }`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Overview({ topics, statusMap }: { topics: TopicSummary[]; statusMap: ProgressMap }) {
  const done = topics.filter((t) => statusMap[t.id] === 'completed').length
  return (
    <p className="text-sm text-slate-700">
      <strong>{done}</strong> of {topics.length} topics completed
    </p>
  )
}

function Section({
  title,
  topics,
  statusMap,
}: {
  title: string
  topics: TopicSummary[]
  statusMap: ProgressMap
}) {
  const [open, setOpen] = useState(true)
  const id = `section-${title.replace(/\W+/g, '-')}`
  const counts = { opened: 0, studying: 0, completed: 0 }
  for (const t of topics) {
    const s = statusMap[t.id]
    if (s) counts[s]++
  }
  const pct = (n: number) => (topics.length ? (n / topics.length) * 100 : 0)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
        >
          <span aria-hidden className={`text-slate-500 transition ${open ? 'rotate-90' : ''}`}>
            ▸
          </span>
          <span className="font-semibold text-slate-900">{title}</span>
          <span className="text-sm text-slate-500">
            {counts.completed}/{topics.length}
          </span>
          <span
            className="ml-auto flex h-2 w-24 overflow-hidden rounded-full bg-slate-200 sm:w-40"
            role="img"
            aria-label={`${counts.completed} completed, ${counts.studying} studying, ${counts.opened} opened of ${topics.length}`}
          >
            <span style={{ width: `${pct(counts.completed)}%`, background: STATUS_META.completed.border }} />
            <span style={{ width: `${pct(counts.studying)}%`, background: STATUS_META.studying.border }} />
            <span style={{ width: `${pct(counts.opened)}%`, background: STATUS_META.opened.border }} />
          </span>
        </button>
      </h2>
      {open && (
        <ul id={id} className="flex flex-wrap gap-2 px-4 pb-4">
          {topics.map((t) => (
            <li key={t.id} className="max-w-full">
              <TopicChip topic={t} status={statusMap[t.id]} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function BrowseSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading topics">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />
      ))}
    </div>
  )
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const k = key(item)
    const list = map.get(k)
    if (list) list.push(item)
    else map.set(k, [item])
  }
  return map
}
