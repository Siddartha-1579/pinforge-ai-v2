import { Link } from 'react-router-dom'
import { CalendarDays, Image, Layers, Link2, Search, UploadCloud } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAppData } from '../hooks/useAppData'
import { Card, EmptyState, PageHeader, Skeleton } from '../components/ui'
import { StatusBadge } from '../components/StatusBadge'
import type { PinStatus, SessionStatus } from '../types'

export function Dashboard() {
  const { products, links, pins, queue, sessions, loading, error, refresh } = useAppData()
  const scheduled = queue.filter((item) => item.status === 'Scheduled')
  const published = pins.filter((pin) => pin.status === 'Published' || pin.uploaded)
  const failed = pins.filter((pin) => pin.status === 'Failed')

  return (
    <>
      <PageHeader title="Dashboard" eyebrow="Overview">
        <Link className="btn-primary" to="/research">Find products</Link>
      </PageHeader>

      {error ? (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
          {error} <button className="font-semibold underline" type="button" onClick={() => void refresh()}>Retry</button>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Stat icon={<Search size={20} />} label="Products" value={products.length} />
          <Stat icon={<Image size={20} />} label="Pins" value={pins.length} />
          <Stat icon={<Link2 size={20} />} label="Links" value={links.length} />
          <Stat icon={<CalendarDays size={20} />} label="Scheduled" value={scheduled.length} />
          <Stat icon={<UploadCloud size={20} />} label="Published" value={published.length} />
          <Stat icon={<Layers size={20} />} label="Sessions" value={sessions.length} />
        </div>
      )}

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        <DashboardList title="Recent Products" link="/research" empty="Save product ideas from research.">
          {products.slice(0, 4).map((product) => <Row key={product.id} title={product.name} meta={`${product.category} - ${product.virality_score}/100 virality`} />)}
        </DashboardList>
        <DashboardList title="Upcoming Scheduled Pins" link="/calendar" empty="Schedule queue items on the calendar.">
          {scheduled.slice(0, 4).map((item) => {
            const pin = pins.find((next) => next.id === item.pin_id)
            return <Row key={item.id} title={pin?.title ?? 'Untitled pin'} meta={item.scheduled_at ? new Date(item.scheduled_at).toLocaleString() : 'No date'} status={item.status} />
          })}
        </DashboardList>
        <DashboardList title="Recent Sessions" link="/sessions" empty="Create upload sessions for batches.">
          {sessions.slice(0, 4).map((session) => <Row key={session.id} title={session.name} meta={`${session.uploaded_count} uploaded - ${session.pending_count} pending`} status={session.status} />)}
        </DashboardList>
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Analytics Snapshot</h2>
            <Link className="text-sm font-semibold text-rose-600" to="/analytics">View analytics</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Queue" value={queue.length} />
            <Metric label="Published" value={published.length} />
            <Metric label="Failed" value={failed.length} />
          </div>
        </Card>
      </section>
    </>
  )
}

function DashboardList({ title, link, empty, children }: { title: string; link: string; empty: string; children: ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children)
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <Link className="text-sm font-semibold text-rose-600" to={link}>Open</Link>
      </div>
      {hasChildren ? <div className="space-y-3">{children}</div> : <EmptyState title="Nothing here yet" description={empty} />}
    </Card>
  )
}

function Row({ title, meta, status }: { title: string; meta: string; status?: PinStatus | SessionStatus }) {
  return <div className="flex items-start justify-between gap-3 rounded-md border border-slate-200 p-3 dark:border-white/10"><div><p className="font-medium">{title}</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{meta}</p></div>{status ? <StatusBadge status={status} /> : null}</div>
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return <Card><div className="flex items-center justify-between"><div className="rounded-md bg-rose-50 p-2 text-rose-600 dark:bg-rose-950/40">{icon}</div><p className="text-2xl font-semibold">{value}</p></div><p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{label}</p></Card>
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-md bg-slate-50 p-3 dark:bg-white/5"><p className="text-xl font-semibold">{value}</p><p className="text-sm text-slate-500 dark:text-slate-400">{label}</p></div>
}
