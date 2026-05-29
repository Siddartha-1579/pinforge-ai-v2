import { useState } from 'react'
import type { FormEvent } from 'react'
import { Edit2, Save, Sparkles, Trash2, X } from 'lucide-react'
import { PageHeader, Card, ScoreBar, Skeleton } from '../components/ui'
import { useAppData } from '../hooks/useAppData'
import { importProductFromAffiliateUrl } from '../lib/affiliateImport'
import { discoverProducts } from '../lib/ai'
import { getFeatureFlags } from '../lib/featureFlags'
import type { Product } from '../types'

export function ProductResearch() {
  const { saveProduct, saveLink, deleteProduct, saveTrendHistory, settings, products } = useAppData()
  const [query, setQuery] = useState('home office upgrades')
  const [affiliateUrl, setAffiliateUrl] = useState('')
  const [results, setResults] = useState<Product[]>(products)
  const [competition, setCompetition] = useState<'All' | Product['competition_level']>('All')
  const [editing, setEditing] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const visibleProducts = results.length > 0 ? results : products
  const filteredResults = visibleProducts.filter((product) => competition === 'All' || product.competition_level === competition)

  async function handleSearch(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const discovered = await discoverProducts(query, settings)
      setResults(discovered)
      if (getFeatureFlags(settings).TREND_INTELLIGENCE) {
        await Promise.all(discovered.map((product) => saveTrendHistory({
          query,
          product_name: product.name,
          opportunity_score: Math.round((product.virality_score + product.affiliate_potential) / 2),
          competition_estimate: product.competition_level,
          evergreen: product.competition_level !== 'High',
          reasoning: product.trend_reasoning,
        })))
      }
    } catch {
      setError('Product discovery failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAffiliateImport(event: FormEvent) {
    event.preventDefault()
    setImporting(true)
    setError(null)

    try {
      const product = await importProductFromAffiliateUrl(affiliateUrl)
      await saveProduct(product)
      await saveLink({
        product_id: product.id,
        product_name: product.name,
        network: product.affiliate_network ?? 'Other',
        url: product.affiliate_url ?? affiliateUrl,
        notes: 'Imported from Research intake.',
      })
      setResults((current) => [product, ...current.filter((item) => item.id !== product.id)])
      setAffiliateUrl('')
    } catch {
      setError('Could not import this affiliate link. Check the URL and try again.')
    } finally {
      setImporting(false)
    }
  }

  async function saveCurrentProduct(product: Product) {
    setSavingId(product.id)
    setError(null)
    try {
      await saveProduct(product)
      setEditing(null)
    } catch {
      setError('Could not save this product. Please try again.')
    } finally {
      setSavingId(null)
    }
  }

  async function removeProduct(id: string) {
    setSavingId(id)
    setError(null)
    try {
      await deleteProduct(id)
      setResults((current) => current.filter((product) => product.id !== id))
    } catch {
      setError('Could not delete this product. Please try again.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <>
      <PageHeader title="Product Research" eyebrow="AI discovery" />
      <Card>
        <form className="mb-4 flex flex-col gap-3 md:flex-row" onSubmit={handleAffiliateImport}>
          <input className="input" value={affiliateUrl} onChange={(event) => setAffiliateUrl(event.target.value)} placeholder="Paste Amazon, ClickBank, Impact, CJ, ShareASale, or Digistore24 affiliate link" />
          <button className="btn-primary md:w-auto" type="submit" disabled={importing || !affiliateUrl.trim()}>
            <Save size={16} />
            {importing ? 'Importing...' : 'Import Affiliate Link'}
          </button>
        </form>
        <form className="flex flex-col gap-3 md:flex-row" onSubmit={handleSearch}>
          <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try: tiny apartment organization, wellness desk setup" />
          <button className="btn-primary md:w-auto" type="submit" disabled={loading}>
            <Sparkles size={16} />
            {loading ? 'Researching...' : 'Discover'}
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['All', 'Low', 'Medium', 'High'] as const).map((item) => (
            <button key={item} className={competition === item ? 'btn-primary' : 'btn-secondary'} type="button" onClick={() => setCompetition(item)}>
              {item}
            </button>
          ))}
        </div>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </Card>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-80" />)
          : filteredResults.map((product) => (
              <Card key={product.id} className="flex flex-col gap-4">
                {editing?.id === product.id ? (
                  <ProductEditor product={editing} onChange={setEditing} />
                ) : (
                  <>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">{product.category}</p>
                      <h2 className="mt-2 text-lg font-semibold">{product.name}</h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{product.price_range}</p>
                    </div>
                    <ScoreBar label="Virality" value={product.virality_score} />
                    <ScoreBar label="Affiliate potential" value={product.affiliate_potential} />
                    <div className="rounded-md bg-slate-50 p-3 text-sm dark:bg-white/5">
                      <p className="font-medium">Competition: {product.competition_level}</p>
                      <p className="mt-2 text-slate-600 dark:text-slate-300">{product.trend_reasoning}</p>
                      <p className="mt-2 text-slate-500 dark:text-slate-400">Audience: {product.target_audience}</p>
                      {product.affiliate_url ? <p className="mt-2 break-words text-slate-500 dark:text-slate-400">Affiliate URL: {product.affiliate_url}</p> : null}
                      {product.resolved_url && product.resolved_url !== product.affiliate_url ? <p className="mt-2 break-words text-slate-500 dark:text-slate-400">Resolved URL: {product.resolved_url}</p> : null}
                      {product.short_description ? <p className="mt-2 text-slate-600 dark:text-slate-300">{product.short_description}</p> : null}
                      {product.brand ? <p className="mt-2 text-slate-500 dark:text-slate-400">Brand: {product.brand}</p> : null}
                      {product.features?.length ? <p className="mt-2 text-slate-500 dark:text-slate-400">Features: {product.features.join(', ')}</p> : null}
                      {product.keywords?.length ? <p className="mt-2 text-slate-500 dark:text-slate-400">Keywords: {product.keywords.join(', ')}</p> : null}
                      {product.hashtags?.length ? <p className="mt-2 text-slate-500 dark:text-slate-400">Hashtags: {product.hashtags.join(' ')}</p> : null}
                    </div>
                  </>
                )}
                <div className="mt-auto flex flex-wrap gap-2">
                  <button className="btn-secondary" type="button" disabled={savingId === product.id} onClick={() => void saveCurrentProduct(editing?.id === product.id ? editing : product)}>
                    <Save size={16} />
                    {savingId === product.id ? 'Saving...' : 'Save'}
                  </button>
                  <button className="btn-secondary" type="button" onClick={() => setEditing(editing?.id === product.id ? null : product)}>
                    {editing?.id === product.id ? <X size={16} /> : <Edit2 size={16} />}
                    {editing?.id === product.id ? 'Cancel' : 'Edit'}
                  </button>
                  <button className="btn-secondary" type="button" disabled={savingId === product.id} onClick={() => void removeProduct(product.id)}>
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </Card>
            ))}
      </section>
    </>
  )
}

function ProductEditor({ product, onChange }: { product: Product; onChange: (product: Product) => void }) {
  return (
    <div className="space-y-3">
      <input className="input" value={product.name} onChange={(event) => onChange({ ...product, name: event.target.value })} />
      <input className="input" value={product.category} onChange={(event) => onChange({ ...product, category: event.target.value })} />
      <input className="input" value={product.price_range} onChange={(event) => onChange({ ...product, price_range: event.target.value })} />
      <select className="input" value={product.competition_level} onChange={(event) => onChange({ ...product, competition_level: event.target.value as Product['competition_level'] })}>
        <option>Low</option>
        <option>Medium</option>
        <option>High</option>
      </select>
      <textarea className="input min-h-24" value={product.trend_reasoning} onChange={(event) => onChange({ ...product, trend_reasoning: event.target.value })} />
      <textarea className="input min-h-20" value={product.target_audience} onChange={(event) => onChange({ ...product, target_audience: event.target.value })} />
      <input className="input" value={product.affiliate_url ?? ''} onChange={(event) => onChange({ ...product, affiliate_url: event.target.value })} placeholder="Affiliate URL" />
      <input className="input" value={product.resolved_url ?? ''} onChange={(event) => onChange({ ...product, resolved_url: event.target.value })} placeholder="Resolved URL" />
      <input className="input" value={product.brand ?? ''} onChange={(event) => onChange({ ...product, brand: event.target.value })} placeholder="Brand" />
      <input className="input" value={product.product_image_url ?? ''} onChange={(event) => onChange({ ...product, product_image_url: event.target.value })} placeholder="Product image URL" />
      <textarea className="input min-h-20" value={product.short_description ?? ''} onChange={(event) => onChange({ ...product, short_description: event.target.value })} placeholder="Short description" />
      <textarea className="input min-h-20" value={product.features?.join('\n') ?? ''} onChange={(event) => onChange({ ...product, features: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })} placeholder="Features, one per line" />
      <textarea className="input min-h-20" value={product.benefits?.join('\n') ?? ''} onChange={(event) => onChange({ ...product, benefits: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })} placeholder="Benefits, one per line" />
      <input className="input" value={product.keywords?.join(', ') ?? ''} onChange={(event) => onChange({ ...product, keywords: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} placeholder="Keywords" />
      <input className="input" value={product.hashtags?.join(' ') ?? ''} onChange={(event) => onChange({ ...product, hashtags: event.target.value.split(/\s+/).map((item) => item.trim()).filter(Boolean) })} placeholder="Hashtags" />
    </div>
  )
}
