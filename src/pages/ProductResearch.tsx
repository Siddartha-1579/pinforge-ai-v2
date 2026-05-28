import { useState } from 'react'
import type { FormEvent } from 'react'
import { Save, Sparkles } from 'lucide-react'
import { PageHeader, Card, ScoreBar, Skeleton } from '../components/ui'
import { useAppData } from '../hooks/useAppData'
import { discoverProducts } from '../lib/ai'
import { getFeatureFlags } from '../lib/featureFlags'
import type { Product } from '../types'

export function ProductResearch() {
  const { saveProduct, saveTrendHistory, settings, products } = useAppData()
  const [query, setQuery] = useState('home office upgrades')
  const [results, setResults] = useState<Product[]>(products)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Product discovery failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader title="Product Research" eyebrow="AI discovery" />
      <Card>
        <form className="flex flex-col gap-3 md:flex-row" onSubmit={handleSearch}>
          <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try: tiny apartment organization, wellness desk setup" />
          <button className="btn-primary md:w-auto" type="submit" disabled={loading}>
            <Sparkles size={16} />
            {loading ? 'Researching...' : 'Discover'}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </Card>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-80" />)
          : results.map((product) => (
              <Card key={product.id} className="flex flex-col gap-4">
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
                </div>
                <button className="btn-secondary mt-auto" type="button" onClick={() => void saveProduct(product)}>
                  <Save size={16} />
                  Save product
                </button>
              </Card>
            ))}
      </section>
    </>
  )
}
