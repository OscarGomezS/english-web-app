import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { api } from '../lib/api'
import { ResetProgressDialog } from './ResetProgressDialog'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-4 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}

function Header() {
  const { pathname } = useLocation()
  const browsing = pathname.startsWith('/levels') || pathname.startsWith('/categories')
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-1.5 text-sm font-medium transition ${
      isActive ? 'bg-violet-100 text-violet-900' : 'text-slate-700 hover:bg-slate-100'
    }`
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2 sm:px-6">
        <NavLink to="/levels/A1" className="mr-2 flex items-center gap-2 font-semibold">
          <img src="/favicon.svg" alt="" className="h-7 w-7" />
          <span className="hidden sm:inline">Grammar Path</span>
        </NavLink>
        <nav className="flex gap-1" aria-label="Main">
          <NavLink
            to="/levels/A1"
            className={(p) => navClass({ isActive: p.isActive || browsing })}
          >
            Topics
          </NavLink>
          <NavLink to="/calendar" className={navClass}>
            Calendar
          </NavLink>
        </nav>
        <div className="ml-auto">
          <SettingsMenu />
        </div>
      </div>
    </header>
  )
}

function SettingsMenu() {
  const { user, signOut, setUser } = useAuth()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const zones = useMemo(() => {
    try {
      return Intl.supportedValuesOf('timeZone')
    } catch {
      return ['UTC']
    }
  }, [])

  const save = useMutation({
    mutationFn: (tz: string) => api.updateMe(tz),
    onSuccess: (u) => {
      setUser(u)
      toast(`Timezone set to ${u.timezone}`)
    },
    onError: () => toast("Couldn't update the timezone.", 'error'),
  })

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null
  const initial = (user.name ?? user.email ?? '?').charAt(0).toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Account and settings"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-violet-200 font-semibold text-violet-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
      >
        {user.picture ? (
          <img src={user.picture} alt="" referrerPolicy="no-referrer" className="h-full w-full" />
        ) : (
          initial
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          <p className="font-medium text-slate-900">{user.name}</p>
          <p className="truncate text-sm text-slate-600">{user.email}</p>
          <label className="mt-4 block text-sm font-medium text-slate-800" htmlFor="tz">
            Timezone
          </label>
          <p className="mb-1 text-xs text-slate-500">Used to decide which day you studied.</p>
          <select
            id="tz"
            value={user.timezone}
            disabled={save.isPending}
            onChange={(e) => save.mutate(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
          >
            {!zones.includes(user.timezone) && <option>{user.timezone}</option>}
            {zones.map((z) => (
              <option key={z}>{z}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setResetOpen(true)
            }}
            className="mt-4 w-full rounded-full border border-red-200 px-4 py-1.5 text-sm font-medium text-red-800 hover:bg-red-50"
          >
            Reset progress…
          </button>
          <button
            type="button"
            onClick={signOut}
            className="mt-2 w-full rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      )}
      {resetOpen && (
        <ResetProgressDialog open initialScope="all" onClose={() => setResetOpen(false)} />
      )}
    </div>
  )
}
