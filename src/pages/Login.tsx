import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authErrorMessage } from '../lib/authErrors'

export function Login({ mode }: { mode: 'login' | 'signup' }) {
  const { signIn, signUp, resetPassword, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (mode === 'login') await signIn(email, password)
      else {
        await signUp(email, password)
        setSuccess('Signup request completed. Check your email if confirmation is required, or continue to the app if your session starts automatically.')
      }
    } catch (nextError) {
      setError(authErrorMessage(nextError))
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordReset() {
    setError(null)
    setSuccess(null)

    if (!email) {
      setError('Enter your email address first, then request a reset link.')
      return
    }

    setLoading(true)
    try {
      await resetPassword(email)
      setSuccess('Password reset email sent. Check your inbox for the next step.')
    } catch (nextError) {
      setError(authErrorMessage(nextError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-stone-50 p-4 text-slate-950 dark:bg-slate-950 dark:text-white md:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden rounded-lg bg-slate-950 p-10 text-white md:flex md:flex-col md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-300">PinForge AI v2</p>
          <h1 className="mt-4 max-w-xl text-5xl font-semibold">Pinterest affiliate content, from product idea to upload-ready pin.</h1>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm text-slate-300">
          <span>Research</span>
          <span>Generate</span>
          <span>Prepare</span>
        </div>
      </section>
      <section className="flex items-center justify-center">
        <form className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900" onSubmit={handleSubmit}>
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">{mode === 'login' ? 'Welcome back' : 'Create workspace'}</p>
          <h2 className="mt-2 text-2xl font-semibold">{mode === 'login' ? 'Login to PinForge' : 'Signup for PinForge'}</h2>
          <label className="mt-6 block text-sm font-medium" htmlFor="email">Email</label>
          <input id="email" className="input mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label className="mt-4 block text-sm font-medium" htmlFor="password">Password</label>
          <input id="password" className="input mt-2" type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error ? <p className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">{error}</p> : null}
          {success ? <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">{success}</p> : null}
          <button className="btn-primary mt-6 w-full" type="submit" disabled={loading}>
            {loading ? 'Working...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
          {mode === 'login' ? (
            <button className="btn-secondary mt-3 w-full" type="button" disabled={loading} onClick={handlePasswordReset}>
              Send password reset email
            </button>
          ) : null}
          <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-300">
            {mode === 'login' ? 'Need an account?' : 'Already have an account?'}{' '}
            <Link className="font-semibold text-rose-600" to={mode === 'login' ? '/signup' : '/login'}>
              {mode === 'login' ? 'Signup' : 'Login'}
            </Link>
          </p>
        </form>
      </section>
    </main>
  )
}
