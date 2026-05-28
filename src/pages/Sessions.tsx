import { useState } from 'react'
import type { FormEvent } from 'react'
import { Archive, CheckCircle2, Play } from 'lucide-react'
import { Card, EmptyState, PageHeader } from '../components/ui'
import { StatusBadge } from '../components/StatusBadge'
import { useAppData } from '../hooks/useAppData'

export function Sessions() {
  const { sessions, pins, saveSession, updateSession } = useAppData()
  const [name, setName] = useState('Weekly Pinterest batch')

  async function createSession(event: FormEvent) {
    event.preventDefault()
    const pendingPins = pins.filter((pin) => pin.status !== 'Published').slice(0, 20)
    await saveSession({
      name,
      status: 'Active',
      pin_ids: pendingPins.map((pin) => pin.id),
      uploaded_count: 0,
      pending_count: pendingPins.length,
    })
  }

  return (
    <>
      <PageHeader title="Upload Sessions" eyebrow="Batch publishing" />
      <Card>
        <form className="flex flex-col gap-3 md:flex-row" onSubmit={createSession}>
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
          <button className="btn-primary" type="submit"><Play size={16} />Start Session</button>
        </form>
      </Card>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {sessions.length === 0 ? <div className="lg:col-span-2"><EmptyState title="No upload sessions" description="Create a batch session to manually publish a group of pins." /></div> : sessions.map((session) => (
          <Card key={session.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{session.name}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Created {session.created_at ? new Date(session.created_at).toLocaleDateString() : 'today'}</p>
              </div>
              <StatusBadge status={session.status} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <Metric label="Pins" value={session.pin_ids.length} />
              <Metric label="Uploaded" value={session.uploaded_count} />
              <Metric label="Pending" value={session.pending_count} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-secondary" type="button"><Play size={16} />Continue</button>
              <button className="btn-secondary" type="button" onClick={() => void updateSession(session.id, { status: 'Completed', completed_at: new Date().toISOString(), pending_count: 0, uploaded_count: session.pin_ids.length })}><CheckCircle2 size={16} />Complete</button>
              <button className="btn-secondary" type="button" onClick={() => void updateSession(session.id, { status: 'Archived' })}><Archive size={16} />Archive</button>
            </div>
          </Card>
        ))}
      </section>
    </>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-md bg-slate-50 p-3 dark:bg-white/5"><p className="text-xl font-semibold">{value}</p><p className="text-slate-500 dark:text-slate-400">{label}</p></div>
}
