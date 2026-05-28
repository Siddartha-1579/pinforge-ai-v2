import { Pause, Play, ShieldAlert, Wand2 } from 'lucide-react'
import { Card, EmptyState, PageHeader } from '../components/ui'
import { useAppData } from '../hooks/useAppData'
import { automationBlockedReason, getFeatureFlags } from '../lib/featureFlags'
import { publishQueueItem } from '../lib/publishing'

export function Automation() {
  const { settings, saveSettings, queue, pins, pinterestAccounts, publishingJobs, uploadLogs, savePublishingJob, saveUploadLog, bulkUpdateQueue, updatePinWorkflow } = useAppData()
  const flags = getFeatureFlags(settings)
  const connectedAccount = pinterestAccounts.find((account) => account.connected)
  const blockedReason = automationBlockedReason(settings, Boolean(connectedAccount))
  const readyItems = queue.filter((item) => ['Ready', 'Scheduled', 'Failed'].includes(item.status))

  async function processNext() {
    const item = readyItems[0]
    if (!item) return
    const result = await publishQueueItem({ item, settings, account: connectedAccount })
    await savePublishingJob(result.job)
    await saveUploadLog(result.log)
    if (result.job.status === 'Published') {
      await bulkUpdateQueue([item.id], { status: 'Published' })
      await updatePinWorkflow(item.pin_id, { status: 'Published', uploaded: true, published_at: new Date().toISOString() })
    } else if (result.job.status === 'Retrying') {
      await bulkUpdateQueue([item.id], { status: 'Failed' })
    }
  }

  return (
    <>
      <PageHeader title="Automation Engine" eyebrow="Optional publishing controls">
        <button className="btn-primary" type="button" disabled={!flags.AUTO_PUBLISH || Boolean(blockedReason)} onClick={() => void processNext()}>
          <Wand2 size={16} />
          Process Next
        </button>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm text-slate-500 dark:text-slate-400">AUTO_PUBLISH</p><p className="mt-2 text-2xl font-semibold">{flags.AUTO_PUBLISH ? 'Enabled' : 'Disabled'}</p></Card>
        <Card><p className="text-sm text-slate-500 dark:text-slate-400">Ready/Retryable</p><p className="mt-2 text-2xl font-semibold">{readyItems.length}</p></Card>
        <Card><p className="text-sm text-slate-500 dark:text-slate-400">Publishing Jobs</p><p className="mt-2 text-2xl font-semibold">{publishingJobs.length}</p></Card>
      </section>

      <Card className="mt-5">
        <h2 className="font-semibold">Safe automation controls</h2>
        {blockedReason ? <p className="mt-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">{blockedReason}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-secondary" type="button" onClick={() => void saveSettings({ ...settings, automation_paused: true })}><Pause size={16} />Pause automation</button>
          <button className="btn-secondary" type="button" onClick={() => void saveSettings({ ...settings, automation_paused: false, emergency_stop: false })}><Play size={16} />Resume automation</button>
          <button className="btn-secondary" type="button" onClick={() => void saveSettings({ ...settings, emergency_stop: true, automation_paused: true })}><ShieldAlert size={16} />Emergency stop</button>
        </div>
      </Card>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Publishing history</h2>
          {publishingJobs.length === 0 ? <EmptyState title="No jobs yet" description="Automation jobs appear here after manual processing or future scheduled processors." /> : (
            <div className="space-y-3">
              {publishingJobs.slice(0, 8).map((job) => {
                const pin = pins.find((item) => item.id === job.pin_id)
                return <div key={job.id} className="rounded-md border border-slate-200 p-3 dark:border-white/10"><div className="flex justify-between gap-3"><p className="font-medium">{pin?.title ?? 'Untitled pin'}</p><span className="rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-white/10">{job.status}</span></div><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{job.last_error ?? `Retries ${job.retry_count}/${job.max_retries}`}</p></div>
              })}
            </div>
          )}
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Upload logs</h2>
          <div className="space-y-3">
            {uploadLogs.slice(0, 8).map((log) => <div key={log.id} className="rounded-md border border-slate-200 p-3 text-sm dark:border-white/10"><p className="font-medium">{log.level.toUpperCase()}</p><p className="mt-1 text-slate-600 dark:text-slate-300">{log.message}</p></div>)}
          </div>
        </Card>
      </section>
    </>
  )
}
