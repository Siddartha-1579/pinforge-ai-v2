import { Link } from 'react-router-dom'
import { AuthHealth } from '../components/AuthHealth'

export function AuthDiagnostics() {
  return (
    <main className="min-h-screen bg-stone-50 p-6 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Auth Diagnostics</p>
            <h1 className="mt-1 text-2xl font-semibold">Supabase Connectivity</h1>
          </div>
          <Link className="btn-secondary" to="/login">Login</Link>
        </div>
        <AuthHealth />
      </div>
    </main>
  )
}
