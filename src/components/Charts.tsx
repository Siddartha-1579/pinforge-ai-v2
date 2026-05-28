export function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((item) => item.value), 1)

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{item.label}</span>
            <span>{item.value}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div className="h-full rounded-full bg-rose-600" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function MiniLineChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((item) => item.value), 1)

  return (
    <div className="flex h-40 items-end gap-2">
      {data.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="w-full rounded-t-md bg-rose-600" style={{ height: `${Math.max((item.value / max) * 130, 6)}px` }} />
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
