import { Download } from 'lucide-react'
import { Card, PageHeader } from '../components/ui'
import { useAppData } from '../hooks/useAppData'
import { exportCsv } from '../lib/exportCsv'

export function Exports() {
  const { products, pins, sessions } = useAppData()

  return (
    <>
      <PageHeader title="Data Export" eyebrow="CSV downloads" />
      <section className="grid gap-4 md:grid-cols-3">
        <ExportCard title="Products" count={products.length} onExport={() => exportCsv('products.csv', products as unknown as Record<string, unknown>[])} />
        <ExportCard title="Pins" count={pins.length} onExport={() => exportCsv('pins.csv', pins as unknown as Record<string, unknown>[])} />
        <ExportCard title="Sessions" count={sessions.length} onExport={() => exportCsv('sessions.csv', sessions as unknown as Record<string, unknown>[])} />
      </section>
    </>
  )
}

function ExportCard({ title, count, onExport }: { title: string; count: number; onExport: () => void }) {
  return (
    <Card>
      <p className="text-sm text-slate-500 dark:text-slate-400">{count} records</p>
      <h2 className="mt-1 text-lg font-semibold">{title}</h2>
      <button className="btn-primary mt-4 w-full" type="button" disabled={count === 0} onClick={onExport}>
        <Download size={16} />
        Export CSV
      </button>
    </Card>
  )
}
