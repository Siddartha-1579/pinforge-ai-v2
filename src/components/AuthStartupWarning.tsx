import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { runAuthHealthCheck } from '../lib/authHealth'

export function AuthStartupWarning() {
  const [warning, setWarning] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function validateAuth() {
      const status = await runAuthHealthCheck()
      const invalidConfig = !status.supabaseUrlConfigured || !status.supabaseKeyConfigured
      const unreachableAuth = status.supabaseUrlConfigured && status.supabaseKeyConfigured && !status.authServiceReachable

      if (!mounted) return
      if (invalidConfig) {
        setWarning('Authentication configuration is incomplete. Signup and login may not work.')
      } else if (unreachableAuth) {
        setWarning('Authentication service is not reachable. Signup and login may be unavailable.')
      } else {
        setWarning(null)
      }
    }

    void validateAuth()

    return () => {
      mounted = false
    }
  }, [])

  if (!warning) return null

  return (
    <div className="fixed inset-x-3 top-3 z-50 mx-auto flex max-w-3xl items-center gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm dark:border-amber-400/30 dark:bg-amber-950 dark:text-amber-100">
      <AlertTriangle size={18} />
      <span>{warning}</span>
    </div>
  )
}
