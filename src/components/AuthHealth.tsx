import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Card } from './ui'
import { runAuthHealthCheck, type AuthHealthStatus } from '../lib/authHealth'

export function AuthHealth() {
  const [status, setStatus] = useState<AuthHealthStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const runTest = useCallback(async () => {
    setLoading(true)
    const nextStatus = await runAuthHealthCheck()
    setStatus(nextStatus)
    setLoading(false)
  }, [])

  useEffect(() => {
    let mounted = true

    async function checkHealth() {
      const nextStatus = await runAuthHealthCheck()
      if (!mounted) return
      setStatus(nextStatus)
      setLoading(false)
    }

    void checkHealth()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Auth Health</p>
          <h2 className="mt-1 font-semibold">Authentication Phase</h2>
        </div>
        <button className="btn-secondary" type="button" onClick={runTest} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Run Auth Test
        </button>
      </div>

      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <HealthRow label="Supabase URL configured" value={status?.supabaseUrlConfigured ?? false} loading={loading && !status} />
        <HealthRow label="Supabase Key configured" value={status?.supabaseKeyConfigured ?? false} loading={loading && !status} />
        <HealthRow label="Auth service reachable" value={status?.authServiceReachable ?? false} loading={loading && !status} />
        <HealthRow label="Current user session" value={status?.currentUserSession ?? false} loading={loading && !status} />
        <HealthRow label="Email confirmation enabled" value={status?.emailConfirmationEnabled ?? false} loading={loading && !status} />
      </div>

      <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm dark:bg-white/5">
        <p className="font-medium">Auth test results</p>
        {status ? (
          <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-300">
            {status.results.map((result) => (
              <li key={result}>{result}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-slate-500 dark:text-slate-400">Checking authentication health...</p>
        )}
      </div>
    </Card>
  )
}

function HealthRow({ label, value, loading }: { label: string; value: boolean; loading: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-slate-50 p-3 dark:bg-white/5">
      <span>{label}</span>
      <span className={value ? 'font-semibold text-emerald-600' : 'font-semibold text-amber-600'}>
        {loading ? 'Checking' : value ? 'YES' : 'NO'}
      </span>
    </div>
  )
}
