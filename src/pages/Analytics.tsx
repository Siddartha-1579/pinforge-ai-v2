import { BarChart, MiniLineChart } from '../components/Charts'
import { Card, PageHeader } from '../components/ui'
import { useAppData } from '../hooks/useAppData'

export function Analytics() {
  const { pins, products, queue, sessions } = useAppData()
  const totalPins = pins.length
  const scheduledPins = queue.filter((item) => item.status === 'Scheduled').length
  const publishedPins = pins.filter((pin) => pin.status === 'Published' || pin.uploaded).length
  const failedPins = pins.filter((pin) => pin.status === 'Failed').length
  const days = lastSevenDays().map((date) => ({
    label: date.toLocaleDateString(undefined, { weekday: 'short' }),
    value: pins.filter((pin) => pin.created_at && sameDate(new Date(pin.created_at), date)).length,
  }))
  const activity = [
    { label: 'Draft', value: queue.filter((item) => item.status === 'Draft').length },
    { label: 'Ready', value: queue.filter((item) => item.status === 'Ready').length },
    { label: 'Scheduled', value: scheduledPins },
    { label: 'Published', value: publishedPins },
    { label: 'Failed', value: failedPins },
  ]
  const performance = products.slice(0, 6).map((product) => ({
    label: product.name.slice(0, 22),
    value: pins.filter((pin) => pin.product_id === product.id).length,
  }))

  return (
    <>
      <PageHeader title="Analytics" eyebrow="Content performance" />
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Metric label="Total Pins" value={totalPins} />
        <Metric label="Scheduled" value={scheduledPins} />
        <Metric label="Published" value={publishedPins} />
        <Metric label="Failed" value={failedPins} />
        <Metric label="Products" value={products.length} />
        <Metric label="Sessions" value={sessions.length} />
      </section>
      <section className="mt-6 grid gap-5 xl:grid-cols-3">
        <Card><h2 className="mb-4 font-semibold">Pins Over Time</h2><MiniLineChart data={days} /></Card>
        <Card><h2 className="mb-4 font-semibold">Publishing Activity</h2><BarChart data={activity} /></Card>
        <Card><h2 className="mb-4 font-semibold">Product Performance</h2><BarChart data={performance.length ? performance : [{ label: 'No products', value: 0 }]} /></Card>
      </section>
    </>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return <Card><p className="text-2xl font-semibold">{value}</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</p></Card>
}

function lastSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    return date
  })
}

function sameDate(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}
