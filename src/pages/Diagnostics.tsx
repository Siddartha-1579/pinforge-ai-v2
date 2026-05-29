import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { AuthHealth } from '../components/AuthHealth'
import { Card, PageHeader } from '../components/ui'
import { useAppData } from '../hooks/useAppData'
import { getFeatureFlags } from '../lib/featureFlags'

export function Diagnostics() {
  const { queue, publishingJobs, uploadLogs, pinterestAccounts, settings, error, events } = useAppData()
  const flags = getFeatureFlags(settings)
  const failures = uploadLogs.filter((log) => log.level === 'error').slice(0, 6)
  const connected = pinterestAccounts.some((account) => account.connected)
  const queueHealth = queue.filter((item) => item.status === 'Failed').length === 0
  const publishingHealth = publishingJobs.filter((job) => job.status === 'Failed').length < 3
  const dashboard = [
    { label: 'Supabase', status: error ? 'yellow' : 'green', message: error ?? 'Workspace data loaded.' },
    { label: 'Auth', status: 'green', message: 'See Auth Health section for live endpoint checks.' },
    { label: 'Storage', status: 'yellow', message: 'No Supabase storage bucket is required for current PNG exports.' },
    { label: 'Pinterest', status: connected ? 'green' : 'yellow', message: connected ? 'Account connected.' : 'Manual upload mode active.' },
    { label: 'Queue', status: queueHealth ? 'green' : 'red', message: `${queue.filter((item) => item.status === 'Failed').length} failed queue items.` },
    { label: 'Automation', status: settings.emergency_stop ? 'red' : settings.automation_paused || !flags.AUTO_PUBLISH ? 'yellow' : publishingHealth ? 'green' : 'red', message: settings.emergency_stop ? 'Emergency stop is active.' : settings.automation_paused ? 'Automation is paused.' : flags.AUTO_PUBLISH ? 'Automation is enabled.' : 'AUTO_PUBLISH is disabled.' },
    { label: 'Analytics', status: events.length > 0 ? 'green' : 'yellow', message: `${events.length} analytics events tracked.` },
  ] as const

  return (
    <>
      <PageHeader title="System Diagnostics" eyebrow="Admin monitoring" />
      <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboard.map((item) => <HealthStatus key={item.label} label={item.label} status={item.status} message={item.message} />)}
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HealthCard label="Function health" ok message="Edge functions configured as optional safe fallbacks." />
        <HealthCard label="Queue health" ok={queueHealth} message={`${queue.length} queue items tracked.`} />
        <HealthCard label="Publishing health" ok={publishingHealth} message={`${publishingJobs.length} publishing jobs recorded.`} />
        <HealthCard label="Pinterest API" ok={connected} message={connected ? 'Account connected.' : 'Disconnected; manual upload active.'} />
      </section>

      <section className="mt-5">
        <AuthHealth />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h2 className="font-semibold">Feature flags</h2>
          <div className="mt-4 space-y-2 text-sm">
            {Object.entries(flags).map(([key, value]) => (
              <div key={key} className="flex justify-between rounded-md bg-slate-50 p-3 dark:bg-white/5">
                <span>{key}</span>
                <span className={value ? 'text-emerald-600' : 'text-slate-500'}>{value ? 'On' : 'Off'}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Recent failures</h2>
          <div className="mt-4 space-y-3">
            {failures.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">No recent failures logged.</p> : failures.map((failure) => (
              <div key={failure.id} className="rounded-md border border-rose-200 p-3 text-sm dark:border-rose-500/30">
                <p className="font-medium text-rose-700 dark:text-rose-200">{failure.message}</p>
                <p className="mt-1 text-slate-500 dark:text-slate-400">{failure.created_at ? new Date(failure.created_at).toLocaleString() : ''}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </>
  )
}

function HealthStatus({ label, status, message }: { label: string; status: 'green' | 'yellow' | 'red'; message: string }) {
  const styles = {
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
    yellow: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-100',
    red: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200',
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{label}</p>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold uppercase ${styles[status]}`}>{status}</span>
      </div>
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </Card>
  )
}

function HealthCard({ label, ok, message }: { label: string; ok: boolean; message: string }) {
  return (
    <Card>
      <div className="flex items-center gap-2">
        {ok ? <CheckCircle2 className="text-emerald-600" size={18} /> : <AlertTriangle className="text-amber-600" size={18} />}
        <p className="font-semibold">{label}</p>
      </div>
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{message}</p>
      <Activity className="mt-4 text-slate-300 dark:text-white/20" size={20} />
    </Card>
  )
}
