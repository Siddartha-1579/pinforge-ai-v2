import { useMemo } from 'react'
import { Card } from './ui'
import { useAppData } from '../hooks/useAppData'

type CheckStatus = 'PASS' | 'FAIL'

export function WorkflowHealth() {
  const { products, links, pins, queue, publishingJobs } = useAppData()
  const checks = useMemo(() => {
    const productIds = new Set(products.map((product) => product.id))
    const linkById = new Map(links.map((link) => [link.id, link]))
    const productsWithAffiliateUrls = products.filter((product) => product.affiliate_url)
    const pinsWithLinks = pins.filter((pin) => pin.affiliate_link_id || pin.affiliate_url)
    const queueWithPins = queue.filter((item) => pins.some((pin) => pin.id === item.pin_id))
    const queueWithLinks = queue.filter((item) => item.affiliate_link_id || item.affiliate_url)

    return [
      {
        label: 'Research -> Generator',
        status: products.length > 0 && products.every((product) => productIds.has(product.id)) && productsWithAffiliateUrls.length > 0 ? 'PASS' as const : 'FAIL' as const,
        message: products.length > 0 ? `${products.length} saved products available to Generator; ${productsWithAffiliateUrls.length} include affiliate URLs.` : 'No saved products available.',
      },
      {
        label: 'Generator -> Affiliate Link',
        status: pinsWithLinks.length > 0 && pinsWithLinks.every((pin) => pin.affiliate_url || products.find((product) => product.id === pin.product_id)?.affiliate_url || (pin.affiliate_link_id && linkById.has(pin.affiliate_link_id))) ? 'PASS' as const : 'FAIL' as const,
        message: pinsWithLinks.length > 0 ? `${pinsWithLinks.length} generated pins have affiliate link metadata.` : 'No generated pins have affiliate link metadata.',
      },
      {
        label: 'Generator -> Queue',
        status: pins.length > 0 && queueWithPins.length === pins.length ? 'PASS' as const : 'FAIL' as const,
        message: `${queueWithPins.length}/${pins.length} generated pins are represented in queue.`,
      },
      {
        label: 'Queue -> Publishing',
        status: queueWithLinks.length > 0 && queueWithLinks.every((item) => item.affiliate_url || products.find((product) => product.id === item.product_id)?.affiliate_url || (item.affiliate_link_id && linkById.has(item.affiliate_link_id))) ? 'PASS' as const : 'FAIL' as const,
        message: `${queueWithLinks.length}/${queue.length} queue items carry affiliate link metadata. ${publishingJobs.length} publishing jobs recorded.`,
      },
    ]
  }, [links, pins, products, publishingJobs.length, queue])

  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Workflow Health</p>
      <h2 className="mt-1 font-semibold">Product to publishing integrity</h2>
      <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
        {checks.map((check) => (
          <div key={check.label} className="rounded-md bg-slate-50 p-3 dark:bg-white/5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">{check.label}</span>
              <Status value={check.status} />
            </div>
            <p className="mt-2 text-slate-500 dark:text-slate-400">{check.message}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Status({ value }: { value: CheckStatus }) {
  return (
    <span className={value === 'PASS' ? 'rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200' : 'rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-200'}>
      {value}
    </span>
  )
}
