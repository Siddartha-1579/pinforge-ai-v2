import { useState } from 'react'
import type { FormEvent } from 'react'
import { Edit2, Trash2 } from 'lucide-react'
import { Card, EmptyState, PageHeader } from '../components/ui'
import { useAppData } from '../hooks/useAppData'
import type { AffiliateLink } from '../types'

export function Links() {
  const { links, products, saveLink, deleteLink } = useAppData()
  const [editing, setEditing] = useState<AffiliateLink | null>(null)
  const [productId, setProductId] = useState('')
  const [productName, setProductName] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const selectedProduct = products.find((product) => product.id === productId)

    try {
      await saveLink({
        id: editing?.id,
        product_id: selectedProduct?.id ?? null,
        product_name: selectedProduct?.name ?? productName,
        network: 'Amazon',
        url,
        notes,
      })
      setEditing(null)
      setProductId('')
      setProductName('')
      setUrl('')
      setNotes('')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not save affiliate link.')
    }
  }

  function startEdit(link: AffiliateLink) {
    setEditing(link)
    setProductId(link.product_id ?? '')
    setProductName(link.product_name)
    setUrl(link.url)
    setNotes(link.notes ?? '')
  }

  return (
    <>
      <PageHeader title="Affiliate Link Manager" eyebrow="Amazon links" />
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h2 className="font-semibold">{editing ? 'Edit link' : 'Save affiliate link'}</h2>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <select className="input" value={productId} onChange={(event) => setProductId(event.target.value)}>
              <option value="">Manual product name</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            {!productId ? <input className="input" value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="Product name" required /> : null}
            <input className="input" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Amazon affiliate URL" required />
            <textarea className="input min-h-24" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes" />
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <button className="btn-primary w-full" type="submit">{editing ? 'Update link' : 'Save link'}</button>
          </form>
        </Card>

        <Card>
          <h2 className="font-semibold">Saved links</h2>
          <div className="mt-4 space-y-3">
            {links.length === 0 ? (
              <EmptyState title="No affiliate links" description="Save approved Amazon affiliate URLs and connect them to product ideas." />
            ) : (
              links.map((link) => (
                <div key={link.id} className="rounded-md border border-slate-200 p-3 dark:border-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{link.product_name}</p>
                      <a className="mt-1 block truncate text-sm text-rose-600" href={link.url} target="_blank" rel="noreferrer">{link.url}</a>
                      {link.notes ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{link.notes}</p> : null}
                    </div>
                    <div className="flex gap-2">
                      <button className="icon-btn" type="button" aria-label="Edit link" onClick={() => startEdit(link)}><Edit2 size={16} /></button>
                      <button className="icon-btn" type="button" aria-label="Delete link" onClick={() => void deleteLink(link.id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
