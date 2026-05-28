import type { PinStatus, SessionStatus } from '../types'

const pinClasses: Record<PinStatus, string> = {
  Draft: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
  Ready: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200',
  Scheduled: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  Published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
  Failed: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200',
}

const sessionClasses: Record<SessionStatus, string> = {
  Active: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200',
  Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
  Archived: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
}

export function StatusBadge({ status }: { status: PinStatus | SessionStatus }) {
  const className = status in pinClasses ? pinClasses[status as PinStatus] : sessionClasses[status as SessionStatus]
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${className}`}>{status}</span>
}
