import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application error boundary caught an error.', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 p-6 text-slate-950 dark:bg-slate-950 dark:text-white">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">Something broke</p>
          <h1 className="mt-2 text-2xl font-semibold">PinForge could not render this view.</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Refresh the page to retry. Your saved Supabase data is not changed by this screen.
          </p>
          <button className="btn-primary mt-5 w-full" type="button" onClick={() => location.reload()}>
            Retry
          </button>
        </section>
      </main>
    )
  }
}
