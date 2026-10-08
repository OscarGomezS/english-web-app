import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { Exercises } from '../components/Exercises'
import { Highlighted } from '../components/Highlighted'
import { StatusSelector } from '../components/StatusSelector'
import { YouGlish } from '../components/YouGlish'
import { useOpenTopic, useSetStatus, useTopic } from '../lib/queries'
import { titleCase } from '../lib/status'
import { useStudyTimer } from '../lib/useStudyTimer'
import type { Topic, TopicContent } from '../lib/types'

export function TopicPage() {
  const { id = '' } = useParams()
  const detail = useTopic(id)
  const open = useOpenTopic()
  const setStatus = useSetStatus(id)
  const openTopic = open.mutate

  useEffect(() => {
    if (id) openTopic(id)
  }, [id, openTopic])

  useStudyTimer(id, detail.isSuccess)

  if (detail.isPending)
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" aria-busy="true" />
  if (detail.isError)
    return (
      <div className="py-10 text-center">
        <p role="alert" className="text-red-700">
          {detail.error.message}
        </p>
        <Link to="/levels/A1" className="mt-3 inline-block text-violet-700 underline">
          Back to topics
        </Link>
      </div>
    )

  const { topic, content, status } = detail.data

  return (
    <article key={topic.id} className="space-y-6">
      <header className="space-y-2">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link className="hover:underline" to={`/levels/${topic.level}`}>
                {topic.level}
              </Link>
            </li>
            <li aria-hidden>·</li>
            <li>
              <Link
                className="hover:underline"
                to={`/categories/${encodeURIComponent(topic.super_category)}`}
              >
                {titleCase(topic.super_category)}
              </Link>
            </li>
            <li aria-hidden>·</li>
            <li aria-current="page">{topic.sub_category}</li>
          </ol>
        </nav>
        <h1 className="text-2xl font-semibold leading-tight text-slate-900">
          {topic.guideword}
        </h1>
        <p className="text-slate-700">{topic.can_do}</p>
      </header>

      <div className="sticky top-[53px] z-20 -mx-4 border-y border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-700">Your status:</span>
          <StatusSelector status={status} onChange={(s) => setStatus.mutate(s)} />
        </div>
      </div>

      {content ? (
        <ExplanationCard content={content} />
      ) : (
        <Card title="Explanation">
          <p className="rounded-lg bg-amber-50 p-3 text-amber-900">Explanation coming soon.</p>
        </Card>
      )}

      <LearnerExamples topic={topic} />

      {content && content.video_phrases.length > 0 && (
        <Card title="Hear it">
          <YouGlish phrases={content.video_phrases} />
        </Card>
      )}

      {content && content.exercises.length > 0 && (
        <Card title="Practice">
          <Exercises topicId={topic.id} exercises={content.exercises} />
        </Card>
      )}
    </article>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  )
}

function ExplanationCard({ content }: { content: TopicContent }) {
  const e = content.explanation
  return (
    <Card title="Explanation">
      <div className="space-y-4">
        <p className="text-slate-800">{e.summary}</p>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Form</h3>
          <p className="mt-1 inline-block rounded-lg bg-violet-50 px-3 py-1.5 font-mono text-sm text-violet-950">
            {e.pattern}
          </p>
        </div>
        {e.usage_notes.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              How to use it
            </h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-800">
              {e.usage_notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        )}
        {e.examples.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Examples
            </h3>
            <ul className="mt-1 space-y-1.5 text-slate-800">
              {e.examples.map((ex) => (
                <li key={ex.text} className="border-l-2 border-violet-200 pl-3">
                  <Highlighted text={ex.text} range={ex.highlight} />
                </li>
              ))}
            </ul>
          </div>
        )}
        {e.common_mistakes.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Common mistakes
            </h3>
            <ul className="mt-2 space-y-2">
              {e.common_mistakes.map((m) => (
                <li key={m.wrong} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="text-red-800">
                    <span aria-label="Wrong">✗</span> <s>{m.wrong}</s>
                  </p>
                  <p className="text-green-800">
                    <span aria-label="Right">✓</span> {m.right}
                  </p>
                  <p className="mt-1 text-slate-600">{m.why}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  )
}

function LearnerExamples({ topic }: { topic: Topic }) {
  const [open, setOpen] = useState(false)
  if (topic.learner_examples.length === 0) return null
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="learner-examples"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2 rounded-2xl p-5 text-left text-lg font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-violet-700"
        >
          <span aria-hidden className={`text-slate-500 transition ${open ? 'rotate-90' : ''}`}>
            ▸
          </span>
          Learner examples
          <span className="text-sm font-normal text-slate-500">
            ({topic.learner_examples.length})
          </span>
        </button>
      </h2>
      {open && (
        <ul id="learner-examples" className="space-y-2 px-5 pb-5">
          <li className="text-sm text-slate-500">
            Real sentences written by learners at this level.
          </li>
          {topic.learner_examples.map((ex, i) => (
            <li key={i} className="text-slate-800">
              {ex.text}{' '}
              {ex.meta && (
                <span className="ml-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                  {ex.meta}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
