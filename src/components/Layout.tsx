import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BarChart3, Bot, CalendarDays, Download, Gauge, Image, Layers, Link2, ListChecks, LogOut, Menu, Search, Settings, Sparkles, UploadCloud, X } from 'lucide-react'
import { useState } from 'react'
import { AppDataProvider } from '../hooks/useAppData'
import { useAuth } from '../hooks/useAuth'
import { authErrorMessage } from '../lib/authErrors'

const navItems = [
  { to: '/', label: 'Dashboard', icon: BarChart3 },
  { to: '/research', label: 'Research', icon: Search },
  { to: '/links', label: 'Links', icon: Link2 },
  { to: '/generator', label: 'Generator', icon: Image },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/queue', label: 'Queue', icon: ListChecks },
  { to: '/upload', label: 'Upload', icon: UploadCloud },
  { to: '/sessions', label: 'Sessions', icon: Layers },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/intelligence', label: 'Intelligence', icon: Sparkles },
  { to: '/pinterest', label: 'Pinterest', icon: Link2 },
  { to: '/automation', label: 'Automation', icon: Bot },
  { to: '/diagnostics', label: 'Diagnostics', icon: Gauge },
  { to: '/exports', label: 'Exports', icon: Download },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Layout() {
  const [open, setOpen] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    setLogoutError(null)
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      setLogoutError(authErrorMessage(error))
    }
  }

  return (
    <AppDataProvider>
      <div className="min-h-screen bg-stone-50 text-slate-950 dark:bg-slate-950 dark:text-white">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-slate-950/90 lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Link to="/" className="font-semibold">PinForge AI v2</Link>
            <button className="icon-btn" type="button" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white p-4 transition lg:translate-x-0 dark:border-white/10 dark:bg-slate-950`}>
          <div className="flex h-full flex-col">
            <Link to="/" className="flex items-center gap-3 px-2 py-3" onClick={() => setOpen(false)}>
              <span className="grid size-10 place-items-center rounded-lg bg-rose-600 font-bold text-white">PF</span>
              <span>
                <span className="block font-semibold">PinForge AI v2</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Affiliate content engine</span>
              </span>
            </Link>

            <nav className="mt-6 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto rounded-lg border border-slate-200 p-3 dark:border-white/10">
              <p className="truncate text-sm font-medium">{user?.email}</p>
              {logoutError ? <p className="mt-2 rounded-md bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">{logoutError}</p> : null}
              <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-white/10" type="button" onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {open ? <button className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" aria-label="Close navigation" type="button" onClick={() => setOpen(false)} /> : null}

        <main className="px-4 py-6 lg:ml-72 lg:px-8">
          <Outlet />
        </main>
      </div>
    </AppDataProvider>
  )
}
