import { useState } from 'react'
import type { FormEvent } from 'react'
import { Download, Wand2 } from 'lucide-react'
import { Card, EmptyState, PageHeader } from '../components/ui'
import { PinCanvas } from '../components/PinCanvas'
import { useAppData } from '../hooks/useAppData'
import { generatePinCopy } from '../lib/ai'
import { downloadPinPng } from '../lib/pinImage'
import type { GeneratedPin } from '../types'

export function Generator() {
  const { products, links, settings, savePin } = useAppData()
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [count, setCount] = useState<1 | 5>(5)
  const [generated, setGenerated] = useState<GeneratedPin[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const activeProductId = productId || products[0]?.id || ''
  const product = products.find((item) => item.id === activeProductId)
  const affiliateLink = product ? links.find((link) => link.product_id === product.id) : null

  async function handleGenerate(event: FormEvent) {
    event.preventDefault()
    if (!product) return
    setLoading(true)
    setError(null)

    try {
      const copy = await generatePinCopy(product, settings, count)
      const nextPins = copy.map((pin) => ({
        ...pin,
        id: crypto.randomUUID(),
        product_id: product.id,
        affiliate_link_id: affiliateLink?.id ?? null,
        affiliate_url: affiliateLink?.url ?? null,
        uploaded: false,
        status: 'Ready' as const,
      }))
      setGenerated(nextPins)
      await Promise.all(nextPins.map((pin) => savePin(pin)))
    } catch {
      setError('Could not generate pins. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader title="Pin Generator" eyebrow="Pinterest copy and visual export" />
      <Card>
        <form className="grid gap-3 md:grid-cols-[1fr_auto_auto]" onSubmit={handleGenerate}>
          <select className="input" value={activeProductId} onChange={(event) => setProductId(event.target.value)} required>
            <option value="">Choose saved product</option>
            {products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className="input md:w-44" value={count} onChange={(event) => setCount(Number(event.target.value) as 1 | 5)}>
            <option value={1}>1 pin</option>
            <option value={5}>5 styles</option>
          </select>
          <button className="btn-primary" type="submit" disabled={loading || !product}>
            <Wand2 size={16} />
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </form>
        {product && !affiliateLink ? <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">Add an affiliate URL for this product before publishing.</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </Card>

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        {generated.length === 0 ? (
          <div className="xl:col-span-2">
            <EmptyState title="Ready for your first pin" description="Choose a saved product and generate Pinterest-optimized copy across the five Phase 1 styles." />
          </div>
        ) : (
          generated.map((pin) => (
            <Card key={pin.id}>
              <PinCanvas pin={pin} product={product} />
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">{pin.style}</p>
                <h2 className="text-lg font-semibold">{pin.title}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">{pin.description}</p>
                <p className="text-sm"><strong>CTA:</strong> {pin.cta}</p>
                <p className="break-words text-sm"><strong>Affiliate URL:</strong> {pin.affiliate_url ?? links.find((link) => link.id === pin.affiliate_link_id)?.url ?? affiliateLink?.url ?? 'Missing'}</p>
                <p className="text-sm"><strong>Trigger:</strong> {pin.emotional_trigger}</p>
                <p className="text-sm"><strong>Angle:</strong> {pin.marketing_angle}</p>
              </div>
              <button className="btn-secondary mt-4" type="button" onClick={() => downloadPinPng(pin, product)}>
                <Download size={16} />
                Download PNG
              </button>
            </Card>
          ))
        )}
      </section>
    </>
  )
}
