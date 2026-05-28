import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Skeleton } from './ui'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 p-6 dark:bg-slate-950">
        <Skeleton className="mx-auto mt-20 h-72 max-w-3xl" />
      </div>
    )
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />
}
