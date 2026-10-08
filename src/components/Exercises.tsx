import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../lib/api'
import { useToast } from '../lib/toast'
import type { AttemptResult, Exercise, ExerciseResult, ScoreRecord } from '../lib/types'

const TYPE_LABEL: Record<Exercise['type'], string> = {
  mcq: 'Choose the answer',
  fill: 'Fill in the blank',
  correct: 'Find the correct sentence',
}

export function Exercises({
  topicId,
  exercises,
}: {
  topicId: string
  exercises: Exercise[]
}) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<AttemptResult | null>(null)

  const summary = useQuery({
    queryKey: ['attempts', topicId],
    queryFn: () => api.attemptSummary(topicId),
  })

  const submit = useMutation({
    mutationFn: () => api.submitAttempt(topicId, answers),
    onSuccess: (data) => {
      setResult(data)
      queryClient.setQueryData(['attempts', topicId], data.summary)
    },
    onError: () => toast("Couldn't check your answers. Please try again.", 'error'),
  })

  const byId = new Map(result?.results.map((r) => [r.exercise_id, r]))
  const answered = exercises.filter((e) => (answers[e.id] ?? '').trim()).length

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    submit.mutate()
  }

  const reset = () => {
    setAnswers({})
    setResult(null)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ScoreLine best={summary.data?.best} last={summary.data?.last} />
      <ol className="space-y-4">
        {exercises.map((ex, i) => (
          <ExerciseItem
            key={ex.id}
            index={i + 1}
            topicId={topicId}
            exercise={ex}
            value={answers[ex.id] ?? ''}
            onChange={(v) => setAnswers((a) => ({ ...a, [ex.id]: v }))}
            result={byId.get(ex.id)}
          />
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        {result ? (
          <>
            <p className="text-lg font-semibold text-slate-900" role="status">
              You scored {result.score} / {result.total}
            </p>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-slate-300 bg-white px-5 py-2 font-medium text-slate-800 hover:bg-slate-50"
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <button
              type="submit"
              disabled={submit.isPending}
              className="rounded-full bg-violet-700 px-5 py-2 font-medium text-white hover:bg-violet-800 disabled:opacity-60"
            >
              {submit.isPending ? 'Checking…' : 'Check answers'}
            </button>
            <span className="text-sm text-slate-600">
              {answered} of {exercises.length} answered
            </span>
          </>
        )}
      </div>
    </form>
  )
}

function ScoreLine({
  best,
  last,
}: {
  best: ScoreRecord | null | undefined
  last: ScoreRecord | null | undefined
}) {
  if (!best || !last) return null
  return (
    <p className="text-sm text-slate-700">
      Best score <strong>{best.score} / {best.total}</strong> · Last score{' '}
      <strong>
        {last.score} / {last.total}
      </strong>
    </p>
  )
}

function ExerciseItem({
  index,
  topicId,
  exercise,
  value,
  onChange,
  result,
}: {
  index: number
  topicId: string
  exercise: Exercise
  value: string
  onChange: (v: string) => void
  result: ExerciseResult | undefined
}) {
  const locked = !!result
  const tone = result
    ? result.correct
      ? 'border-green-400 bg-green-50'
      : 'border-red-300 bg-red-50'
    : 'border-slate-200 bg-white'
  const name = `ex-${exercise.id}`

  return (
    <li className={`rounded-xl border p-4 ${tone}`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {index}. {TYPE_LABEL[exercise.type]}
        </p>
        <ReportLink topicId={topicId} exerciseId={exercise.id} />
      </div>

      {exercise.type === 'fill' ? (
        <FillPrompt
          prompt={exercise.prompt}
          value={value}
          onChange={onChange}
          disabled={locked}
          label={`Answer for question ${index}`}
        />
      ) : (
        <fieldset>
          <legend className="mb-2 text-slate-900">{exercise.prompt}</legend>
          <div className="space-y-1.5">
            {(exercise.options ?? []).map((opt) => (
              <label
                key={opt}
                className={`flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 ${
                  locked ? 'cursor-default' : ''
                }`}
              >
                <input
                  type="radio"
                  name={name}
                  value={opt}
                  checked={value === opt}
                  disabled={locked}
                  onChange={() => onChange(opt)}
                  className="mt-1 accent-violet-700"
                />
                <span className="text-slate-800">{opt}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {result && (
        <div className="mt-3 text-sm" role="status">
          <p className={result.correct ? 'text-green-800' : 'text-red-800'}>
            {result.correct ? '✓ Correct' : '✗ Not quite'}
            {!result.correct && (
              <>
                {' '}
                — answer: <strong>{result.answers.join(' / ')}</strong>
              </>
            )}
          </p>
          <p className="mt-1 text-slate-700">{result.explanation}</p>
        </div>
      )}
    </li>
  )
}

function FillPrompt({
  prompt,
  value,
  onChange,
  disabled,
  label,
}: {
  prompt: string
  value: string
  onChange: (v: string) => void
  disabled: boolean
  label: string
}) {
  const [before, ...rest] = prompt.split('___')
  const after = rest.join('___')
  return (
    <p className="leading-9 text-slate-900">
      {before}
      <input
        type="text"
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        className="mx-1 w-40 rounded-md border border-slate-300 bg-white px-2 py-0.5 text-slate-900 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:bg-slate-100"
      />
      {after}
    </p>
  )
}

function ReportLink({ topicId, exerciseId }: { topicId: string; exerciseId: string }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const send = useMutation({
    mutationFn: () => api.report(topicId, exerciseId, message.trim()),
    onSuccess: () => {
      toast('Thanks! We received your report.')
      setOpen(false)
      setMessage('')
    },
    onError: () => toast("Couldn't send the report. Please try again.", 'error'),
  })

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 text-xs text-slate-500 underline hover:text-slate-800"
      >
        Report a problem
      </button>
    )
  }
  return (
    <div className="flex w-full max-w-xs flex-col gap-1.5">
      <textarea
        aria-label="Describe the problem"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        maxLength={2000}
        placeholder="What's wrong with this exercise?"
        className="rounded-md border border-slate-300 bg-white p-2 text-sm"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-slate-600 underline"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!message.trim() || send.isPending}
          onClick={() => send.mutate()}
          className="rounded-full bg-slate-800 px-3 py-1 text-xs text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  )
}
