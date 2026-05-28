import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader, Card, EmptyState } from '../components/ui'
import { StatusBadge } from '../components/StatusBadge'
import { useAppData } from '../hooks/useAppData'
import { addDays, monthDays, sameDay, startOfWeek } from '../lib/date'
import type { PinQueueItem } from '../types'

type CalendarMode = 'Month' | 'Week' | 'Day'

export function Calendar() {
  const { queue, pins, bulkUpdateQueue } = useAppData()
  const [cursor, setCursor] = useState(new Date())
  const [mode, setMode] = useState<CalendarMode>('Month')
  const days = useMemo(() => {
    if (mode === 'Day') return [cursor]
    if (mode === 'Week') return Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(cursor), index))
    return monthDays(cursor)
  }, [cursor, mode])

  function itemsForDate(date: Date) {
    return queue.filter((item) => item.scheduled_at && sameDay(new Date(item.scheduled_at), date))
  }

  async function schedule(item: PinQueueItem, date: Date) {
    const scheduled = new Date(date)
    scheduled.setHours(9, 0, 0, 0)
    await bulkUpdateQueue([item.id], { scheduled_at: scheduled.toISOString(), status: 'Scheduled' })
  }

  return (
    <>
      <PageHeader title="Content Calendar" eyebrow="Scheduling">
        <div className="flex flex-wrap gap-2">
          {(['Month', 'Week', 'Day'] as CalendarMode[]).map((item) => (
            <button key={item} className={mode === item ? 'btn-primary' : 'btn-secondary'} type="button" onClick={() => setMode(item)}>{item}</button>
          ))}
        </div>
      </PageHeader>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <button className="icon-btn" type="button" onClick={() => setCursor(addDays(cursor, mode === 'Month' ? -30 : mode === 'Week' ? -7 : -1))}><ChevronLeft size={18} /></button>
          <div className="flex items-center gap-2 font-semibold">
            <CalendarDays size={18} />
            {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric', day: mode === 'Day' ? 'numeric' : undefined })}
          </div>
          <button className="icon-btn" type="button" onClick={() => setCursor(addDays(cursor, mode === 'Month' ? 30 : mode === 'Week' ? 7 : 1))}><ChevronRight size={18} /></button>
        </div>

        <div className={`grid gap-2 ${mode === 'Day' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-7'}`}>
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="min-h-36 rounded-md border border-slate-200 p-2 dark:border-white/10"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                const id = event.dataTransfer.getData('text/plain')
                const item = queue.find((next) => next.id === id)
                if (item) void schedule(item, day)
              }}
            >
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}</p>
              <div className="mt-2 space-y-2">
                {itemsForDate(day).map((item) => {
                  const pin = pins.find((next) => next.id === item.pin_id)
                  return (
                    <div key={item.id} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', item.id)} className="cursor-grab rounded-md bg-slate-50 p-2 text-xs dark:bg-white/5">
                      <p className="line-clamp-2 font-medium">{pin?.title ?? 'Untitled pin'}</p>
                      <div className="mt-2"><StatusBadge status={item.status} /></div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-5">
        {queue.filter((item) => !item.scheduled_at).length === 0 ? null : (
          <Card>
            <h2 className="mb-3 font-semibold">Unscheduled pins</h2>
            <div className="grid gap-2 md:grid-cols-3">
              {queue.filter((item) => !item.scheduled_at).map((item) => {
                const pin = pins.find((next) => next.id === item.pin_id)
                return (
                  <div key={item.id} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', item.id)} className="cursor-grab rounded-md border border-slate-200 p-3 dark:border-white/10">
                    <p className="text-sm font-medium">{pin?.title ?? 'Untitled pin'}</p>
                    <div className="mt-2"><StatusBadge status={item.status} /></div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
        {queue.length === 0 ? <EmptyState title="No queue items" description="Generated pins will appear here and can be dragged onto the calendar." /> : null}
      </div>
    </>
  )
}
