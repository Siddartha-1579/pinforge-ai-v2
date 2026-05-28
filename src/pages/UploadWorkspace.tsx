import { useState } from 'react'
import { AlertCircle, CheckCircle2, Copy, ExternalLink, Save } from 'lucide-react'
import { Card, EmptyState, PageHeader } from '../components/ui'
import { PinCanvas } from '../components/PinCanvas'
import { StatusBadge } from '../components/StatusBadge'
import { useAppData } from '../hooks/useAppData'
import type { GeneratedPin, PinStatus } from '../types'

export function UploadWorkspace() {
  const { pins, products, links, markPinUploaded, updatePinWorkflow } = useAppData()

  async function copy(value: string) {
    await navigator.clipboard.writeText(value)
  }

  return (
    <>
      <PageHeader title="Upload Workspace" eyebrow="Manual Pinterest prep">
        <a className="btn-primary" href="https://www.pinterest.com/pin-builder/" target="_blank" rel="noreferrer">
          <ExternalLink size={16} />
          Open Pinterest create
        </a>
      </PageHeader>

      {pins.length === 0 ? (
        <EmptyState title="No pins ready" description="Generated pins appear here with copy buttons, links, workflow notes, and publish status." />
      ) : (
        <section className="grid gap-5 xl:grid-cols-2">
          {pins.map((pin) => {
            const product = products.find((item) => item.id === pin.product_id)
            const link = links.find((item) => item.id === pin.affiliate_link_id || item.product_id === pin.product_id)

            return (
              <Card key={pin.id}>
                <div className="mb-3 flex items-center justify-between">
                  <StatusBadge status={pin.status ?? (pin.uploaded ? 'Published' : 'Draft')} />
                  {pin.published_at ? <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(pin.published_at).toLocaleDateString()}</span> : null}
                </div>
                <PinCanvas pin={pin} product={product} />
                <div className="mt-4 space-y-3">
                  <CopyRow label="Title" value={pin.title} onCopy={copy} />
                  <CopyRow label="Description" value={pin.description} onCopy={copy} />
                  <CopyRow label="Affiliate link" value={link?.url ?? 'No affiliate link connected'} onCopy={copy} />
                  <WorkflowForm pin={pin} onSave={(updates) => updatePinWorkflow(pin.id, updates)} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button className="btn-secondary" type="button" onClick={() => void markPinUploaded(pin.id)}>
                      <CheckCircle2 size={16} />
                      Mark Published
                    </button>
                    <button className="btn-secondary" type="button" onClick={() => void updatePinWorkflow(pin.id, { status: 'Failed' })}>
                      <AlertCircle size={16} />
                      Mark Failed
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </section>
      )}
    </>
  )
}

function WorkflowForm({
  pin,
  onSave,
}: {
  pin: GeneratedPin
  onSave: (updates: Partial<Pick<GeneratedPin, 'status' | 'notes' | 'pinterest_url' | 'published_at'>>) => Promise<void>
}) {
  const [status, setStatus] = useState<PinStatus>(pin.status ?? (pin.uploaded ? 'Published' : 'Draft'))
  const [notes, setNotes] = useState(pin.notes ?? '')
  const [pinterestUrl, setPinterestUrl] = useState(pin.pinterest_url ?? '')
  const [publishedAt, setPublishedAt] = useState(pin.published_at?.slice(0, 10) ?? '')

  return (
    <div className="rounded-md border border-slate-200 p-3 dark:border-white/10">
      <div className="grid gap-3 md:grid-cols-2">
        <select className="input" value={status} onChange={(event) => setStatus(event.target.value as PinStatus)}>
          {(['Draft', 'Ready', 'Scheduled', 'Published', 'Failed'] as PinStatus[]).map((item) => <option key={item}>{item}</option>)}
        </select>
        <input className="input" type="date" value={publishedAt} onChange={(event) => setPublishedAt(event.target.value)} />
      </div>
      <input className="input mt-3" type="url" value={pinterestUrl} onChange={(event) => setPinterestUrl(event.target.value)} placeholder="Pinterest URL" />
      <textarea className="input mt-3 min-h-20" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Publishing notes" />
      <button className="btn-secondary mt-3 w-full" type="button" onClick={() => void onSave({ status, notes, pinterest_url: pinterestUrl, published_at: publishedAt ? new Date(`${publishedAt}T12:00:00`).toISOString() : null })}>
        <Save size={16} />
        Save Workflow
      </button>
    </div>
  )
}

function CopyRow({ label, value, onCopy }: { label: string; value: string; onCopy: (value: string) => Promise<void> }) {
  return (
    <div className="rounded-md border border-slate-200 p-3 dark:border-white/10">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm">{value}</p>
      <button className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-rose-600" type="button" onClick={() => void onCopy(value)}>
        <Copy size={14} />
        Copy
      </button>
    </div>
  )
}
