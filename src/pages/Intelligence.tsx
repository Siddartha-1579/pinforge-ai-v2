import { Card, PageHeader, ScoreBar } from '../components/ui'
import { useAppData } from '../hooks/useAppData'
import { getFeatureFlags } from '../lib/featureFlags'

export function Intelligence() {
  const { trendHistory, products, pins, settings } = useAppData()
  const flags = getFeatureFlags(settings)
  const styleScores = ['Scandinavian Minimal', 'Premium Lifestyle', 'High Contrast Ad', 'Wellness Aesthetic', 'Productivity Style'].map((style) => ({
    label: style,
    value: pins.filter((pin) => pin.style === style && (pin.uploaded || pin.status === 'Published')).length,
  })).sort((a, b) => b.value - a.value)
  const productScores = products.map((product) => ({
    label: product.name,
    value: pins.filter((pin) => pin.product_id === product.id && (pin.uploaded || pin.status === 'Published')).length,
  })).sort((a, b) => b.value - a.value)
  const ctaPatterns = pins.reduce<Record<string, number>>((acc, pin) => {
    acc[pin.cta] = (acc[pin.cta] ?? 0) + (pin.uploaded || pin.status === 'Published' ? 1 : 0)
    return acc
  }, {})

  return (
    <>
      <PageHeader title="Analytics Intelligence" eyebrow="Optional insights" />
      {!flags.ADVANCED_ANALYTICS ? <div className="mb-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">ADVANCED_ANALYTICS is disabled. Showing local summary insights only.</div> : null}
      <section className="grid gap-5 xl:grid-cols-3">
        <Card><h2 className="mb-4 font-semibold">Best-performing styles</h2>{styleScores.map((item) => <ScoreBar key={item.label} label={item.label} value={Math.min(item.value * 20, 100)} />)}</Card>
        <Card><h2 className="mb-4 font-semibold">Best-performing products</h2><div className="space-y-3">{productScores.slice(0, 5).map((item) => <p key={item.label} className="text-sm"><span className="font-medium">{item.label}</span> - {item.value} published</p>)}</div></Card>
        <Card><h2 className="mb-4 font-semibold">CTA patterns</h2><div className="space-y-3">{Object.entries(ctaPatterns).slice(0, 5).map(([cta, count]) => <p key={cta} className="text-sm"><span className="font-medium">{cta}</span> - {count}</p>)}</div></Card>
      </section>
      <Card className="mt-5">
        <h2 className="font-semibold">Trend intelligence history</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {trendHistory.map((trend) => <div key={trend.id} className="rounded-md border border-slate-200 p-3 dark:border-white/10"><p className="font-medium">{trend.product_name}</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{trend.query} - {trend.competition_estimate} competition - {trend.evergreen ? 'Evergreen' : 'Emerging'}</p><ScoreBar label="Opportunity" value={trend.opportunity_score} /><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{trend.reasoning}</p></div>)}
        </div>
      </Card>
    </>
  )
}
