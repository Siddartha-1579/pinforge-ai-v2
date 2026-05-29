import { useMemo, useState } from 'react'
import { Download, Search, Trash2 } from 'lucide-react'
import { Card, EmptyState, PageHeader } from '../components/ui'
import { StatusBadge } from '../components/StatusBadge'
import { useAppData } from '../hooks/useAppData'
import { exportCsv } from '../lib/exportCsv'
import type { PinStatus } from '../types'

const statuses: PinStatus[] = ['Draft', 'Ready', 'Scheduled', 'Published', 'Failed']

export function Queue() {
  const { queue, pins, products, links, bulkUpdateQueue, deleteQueueItems } = useAppData()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'All' | PinStatus>('All')
  const [selected, setSelected] = useState<string[]>([])
  const [scheduleDate, setScheduleDate] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const pageSize = 10

  const rows = useMemo(() => queue.map((item) => {
    const pin = pins.find((next) => next.id === item.pin_id)
    const product = products.find((next) => next.id === item.product_id || next.id === pin?.product_id)
    const link = links.find((next) => next.id === item.affiliate_link_id || next.product_id === product?.id)
    const affiliateUrl = item.affiliate_url ?? pin?.affiliate_url ?? link?.url ?? null
    return { item, pin, product, link, affiliateUrl }
  }).filter((row) => {
    const haystack = `${row.pin?.title ?? ''} ${row.product?.name ?? ''} ${row.pin?.style ?? ''}`.toLowerCase()
    return haystack.includes(query.toLowerCase()) && (status === 'All' || row.item.status === status)
  }), [links, pins, products, query, queue, status])

  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize)
  const stats = statuses.map((item) => ({ label: item, value: queue.filter((row) => row.status === item).length }))

  async function bulkSchedule() {
    if (!scheduleDate || selected.length === 0) return
    setError(null)
    try {
      await bulkUpdateQueue(selected, { scheduled_at: new Date(`${scheduleDate}T09:00:00`).toISOString(), status: 'Scheduled' })
    } catch {
      setError('Could not schedule selected pins. Please try again.')
    }
  }

  async function runBulkUpdate(nextStatus: PinStatus) {
    setError(null)
    try {
      await bulkUpdateQueue(selected, { status: nextStatus })
    } catch {
      setError('Could not update selected pins. Please try again.')
    }
  }

  async function removeSelected() {
    setError(null)
    try {
      await deleteQueueItems(selected)
      setSelected([])
    } catch {
      setError('Could not delete selected queue items. Please try again.')
    }
  }

  return (
    <>
      <PageHeader title="Pin Queue" eyebrow="Content management">
        <button className="btn-secondary" type="button" onClick={() => exportCsv('pin-queue.csv', rows.map(({ item, pin, product, affiliateUrl }) => ({
          product: product?.name,
          title: pin?.title,
          style: pin?.style,
          scheduled_at: item.scheduled_at,
          status: item.status,
          affiliate_link: affiliateUrl,
        })))}>
          <Download size={16} />
          Export
        </button>
      </PageHeader>

      <div className="mb-5 grid gap-3 md:grid-cols-5">
        {stats.map((item) => <Card key={item.label}><p className="text-2xl font-semibold">{item.value}</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.label}</p></Card>)}
      </div>

      <Card>
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <label className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input className="input pl-9" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search queue" />
          </label>
          <select className="input" value={status} onChange={(event) => setStatus(event.target.value as 'All' | PinStatus)}>
            <option>All</option>
            {statuses.map((item) => <option key={item}>{item}</option>)}
          </select>
          <button className="btn-secondary" type="button" onClick={() => setSelected(rows.map((row) => row.item.id))}>Select visible</button>
        </div>

        {selected.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-2 rounded-md bg-slate-50 p-3 dark:bg-white/5">
            <input className="input max-w-44" type="date" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} />
            <button className="btn-secondary" type="button" onClick={() => void bulkSchedule()}>Schedule</button>
            <button className="btn-secondary" type="button" onClick={() => void runBulkUpdate('Published')}>Mark Published</button>
            <button className="btn-secondary" type="button" onClick={() => void removeSelected()}><Trash2 size={16} />Delete</button>
          </div>
        ) : null}
        {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}

        {rows.length === 0 ? <EmptyState title="No queue results" description="Try a different search or generate pins to populate the queue." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="p-3"></th><th className="p-3">Product</th><th className="p-3">Pin Title</th><th className="p-3">Style</th><th className="p-3">Scheduled Date</th><th className="p-3">Status</th><th className="p-3">Affiliate Link</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map(({ item, pin, product, affiliateUrl }) => (
                  <tr key={item.id} className="border-t border-slate-200 dark:border-white/10">
                    <td className="p-3"><input type="checkbox" checked={selected.includes(item.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} /></td>
                    <td className="p-3">{product?.name ?? 'Unassigned'}</td>
                    <td className="p-3">{pin?.title ?? 'Untitled'}</td>
                    <td className="p-3">{pin?.style ?? '-'}</td>
                    <td className="p-3">{item.scheduled_at ? new Date(item.scheduled_at).toLocaleDateString() : 'Not scheduled'}</td>
                    <td className="p-3"><StatusBadge status={item.status} /></td>
                    <td className="max-w-56 truncate p-3">{affiliateUrl ?? 'Missing'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secondary" type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
          <button className="btn-secondary" type="button" disabled={page * pageSize >= rows.length} onClick={() => setPage((value) => value + 1)}>Next</button>
        </div>
      </Card>
    </>
  )
}
