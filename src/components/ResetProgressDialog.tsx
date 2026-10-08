import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { useProgress, useTopics } from '../lib/queries'
import { useToast } from '../lib/toast'
import { LEVELS } from '../lib/types'
import type { Level } from '../lib/types'

type Scope = Level | 'all'

export function ResetProgressDialog({
  open,
  initialScope,
  onClose,
}: {
  open: boolean
  initialScope: Scope
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [scope, setScope] = useState<Scope>(initialScope)
  const queryClient = useQueryClient()
  const toast = useToast()
  const topics = useTopics()
  const progress = useProgress()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      cancelRef.current?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  const reset = useMutation({
    mutationFn: () => api.resetProgress(scope === 'all' ? null : scope),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        predicate: (q) => q.queryKey[0] !== 'topics',
      })
      toast(
        scope === 'all' ? 'All your progress was reset.' : `Your ${scope} progress was reset.`,
      )
      onClose()
    },
    onError: () => toast("Couldn't reset your progress. Please try again.", 'error'),
  })

  const levelOf = new Map((topics.data ?? []).map((t) => [t.id, t.level]))
  const affected = Object.keys(progress.data ?? {}).filter(
    (id) => scope === 'all' || levelOf.get(id) === scope,
  ).length
  const label = scope === 'all' ? 'all levels' : scope

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        if (reset.isPending) e.preventDefault()
      }}
      aria-labelledby="reset-title"
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/50"
    >
      {open && (
        <form
          method="dialog"
          className="space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault()
            reset.mutate()
          }}
        >
          <h2 id="reset-title" className="text-lg font-semibold">
            Reset progress?
          </h2>

          <label className="block text-sm font-medium text-slate-800">
            What to reset
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as Scope)}
              disabled={reset.isPending}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="all">All levels</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  Level {l} only
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-900">
            <p className="font-medium">This permanently deletes, for {label}:</p>
            <ul className="mt-1 list-disc pl-5">
              <li>the status of every topic (opened, studying, completed)</li>
              <li>all exercise attempts and best/last scores</li>
              <li>the study time shown on your calendar</li>
            </ul>
            <p className="mt-2">
              {affected === 0
                ? 'You have no topic progress here yet.'
                : `${affected} topic${affected === 1 ? '' : 's'} will go back to "Not started".`}{' '}
              This can't be undone.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              ref={cancelRef}
              disabled={reset.isPending}
              className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reset.isPending}
              className="rounded-full bg-red-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
            >
              {reset.isPending ? 'Resetting…' : `Reset ${label}`}
            </button>
          </div>
        </form>
      )}
    </dialog>
  )
}
