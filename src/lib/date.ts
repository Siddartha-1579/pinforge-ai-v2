export function toDateInput(value?: string | null) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}

export function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function startOfWeek(date: Date) {
  const next = new Date(date)
  next.setDate(date.getDate() - date.getDay())
  next.setHours(0, 0, 0, 0)
  return next
}

export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(date.getDate() + days)
  return next
}

export function monthDays(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const gridStart = startOfWeek(first)
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))
}
