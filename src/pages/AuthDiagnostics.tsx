import { useEffect, useState } from 'react'
import { supabaseDiagnostics } from '../integrations/supabase/client'

type Reachability = 'Checking' | 'YES' | 'NO'

export function AuthDiagnostics() {
  const [authReachable, setAuthReachable] = useState<Reachability>('Checking')

  useEffect(() => {
    let mounted = true

    async function checkAuthEndpoint() {
      if (!supabaseDiagnostics.urlPresent || !supabaseDiagnostics.keyPresent || !supabaseDiagnostics.urlHost) {
        setAuthReachable('NO')
        return
      }

      try {
        const response = await fetch(`https://${supabaseDiagnostics.urlHost}/auth/v1/health`, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          },
        })
        if (mounted) setAuthReachable(response.ok ? 'YES' : 'NO')
      } catch (error) {
        console.error('Auth diagnostics health check failed.', error)
        if (mounted) setAuthReachable('NO')
      }
    }

    void checkAuthEndpoint()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <main className="min-h-screen bg-stone-50 p-6 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Auth Diagnostics</p>
        <h1 className="mt-2 text-2xl font-semibold">Supabase Connectivity</h1>
        <div className="mt-6 space-y-3 text-sm">
          <Row label="Supabase URL present" value={yesNo(supabaseDiagnostics.urlPresent)} />
          <Row label="Supabase key present" value={yesNo(supabaseDiagnostics.keyPresent)} />
          <Row label="Client initialized" value={yesNo(supabaseDiagnostics.clientInitialized)} />
          <Row label="Auth endpoint reachable" value={authReachable} />
          <Row label="Supabase host" value={supabaseDiagnostics.urlHost ?? 'Missing'} />
          <Row label="Anon key preview" value={supabaseDiagnostics.keyPreview ?? 'Missing'} />
        </div>
      </section>
    </main>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-slate-50 p-3 dark:bg-white/5">
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function yesNo(value: boolean) {
  return value ? 'YES' : 'NO'
}
