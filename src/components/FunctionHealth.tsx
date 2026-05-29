import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { supabase } from '../integrations/supabase/client'
import { useAuth } from '../hooks/useAuth'
import { Card } from './ui'

type CheckStatus = 'Checking' | 'PASS' | 'FAIL'

interface FunctionCheck {
  name: string
  status: CheckStatus
  message: string
}

const functionChecks = [
  { name: 'discover-products', body: { query: 'audit' } },
  {
    name: 'generate-pin-copy',
    body: {
      product: { name: 'Audit product', category: 'Audit', target_audience: 'Audit users' },
      count: 1,
      settings: { cta_preferences: 'Save this idea', global_pin_instructions: 'Audit instruction', brand_tone: 'Helpful' },
    },
  },
  { name: 'pinterest-oauth-start', body: {} },
  { name: 'pinterest-refresh-token', body: { accountId: '00000000-0000-0000-0000-000000000000' } },
  { name: 'pinterest-disconnect', body: { accountId: '00000000-0000-0000-0000-000000000000' } },
  { name: 'publish-queued-pin', body: { queueItemId: '00000000-0000-0000-0000-000000000000', pinId: '00000000-0000-0000-0000-000000000000' } },
  { name: 'process-publishing-queue', body: {} },
]

export function FunctionHealth() {
  const { user } = useAuth()
  const [checks, setChecks] = useState<FunctionCheck[]>(() => functionChecks.map((item) => ({ name: item.name, status: 'Checking', message: 'Not checked yet.' })))
  const [bucketStatus, setBucketStatus] = useState<FunctionCheck>({ name: 'pin-assets bucket', status: 'Checking', message: 'Not checked yet.' })
  const [loading, setLoading] = useState(false)

  async function runChecks() {
    setLoading(true)
    const { nextChecks, nextBucketStatus } = await collectChecks(user?.id)
    setChecks(nextChecks)
    setBucketStatus(nextBucketStatus)
    setLoading(false)
  }

  useEffect(() => {
    let mounted = true

    async function check() {
      const { nextChecks, nextBucketStatus } = await collectChecks(user?.id)
      if (!mounted) return
      setChecks(nextChecks)
      setBucketStatus(nextBucketStatus)
    }

    void check()

    return () => {
      mounted = false
    }
  }, [user?.id])

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Function Health</p>
          <h2 className="mt-1 font-semibold">Edge functions, secrets, bucket, scheduler</h2>
        </div>
        <button className="btn-secondary" type="button" onClick={runChecks} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Run Function Checks
        </button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500 dark:text-slate-400">
            <tr>
              <th className="p-3">Check</th>
              <th className="p-3">Status</th>
              <th className="p-3">Result</th>
            </tr>
          </thead>
          <tbody>
            {[...checks, bucketStatus].map((item) => (
              <tr key={item.name} className="border-t border-slate-200 dark:border-white/10">
                <td className="p-3 font-medium">{item.name}</td>
                <td className="p-3"><Status value={item.status} /></td>
                <td className="p-3">{item.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

async function collectChecks(userId?: string) {
  const nextChecks = await Promise.all(functionChecks.map(async (item) => {
    const { data, error } = await supabase.functions.invoke(item.name, { body: item.body })
    if (error) return { name: item.name, status: 'FAIL' as const, message: error.message }
    return { name: item.name, status: 'PASS' as const, message: summarizeFunctionResult(item.name, data) }
  }))

  if (!userId) {
    return {
      nextChecks,
      nextBucketStatus: { name: 'pin-assets bucket', status: 'Checking' as const, message: 'Login required for private bucket access check.' },
    }
  }

  const { error } = await supabase.storage.from('pin-assets').list(userId, { limit: 1 })
  return {
    nextChecks,
    nextBucketStatus: {
      name: 'pin-assets bucket',
      status: error ? 'FAIL' as const : 'PASS' as const,
      message: error?.message ?? 'Private bucket is accessible for the current user.',
    },
  }
}

function Status({ value }: { value: CheckStatus }) {
  const className = value === 'PASS'
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'
    : value === 'FAIL'
      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200'
      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-100'

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${className}`}>{value}</span>
}

function summarizeFunctionResult(name: string, data: unknown) {
  if (name === 'pinterest-oauth-start') {
    const result = data as { url?: string }
    return result.url?.includes('pinterest.com/oauth') ? 'OAuth URL returned; Pinterest secrets are present.' : 'Function responded without an OAuth URL.'
  }
  if (name === 'process-publishing-queue') {
    const result = data as { processed?: number; reason?: string }
    return `Scheduler endpoint responded. Processed ${result.processed ?? 0}. ${result.reason ?? ''}`.trim()
  }
  if (name === 'generate-pin-copy') return Array.isArray(data) && data.length > 0 ? 'Valid pin copy returned.' : 'Function responded without pin copy.'
  return 'Function responded successfully.'
}
