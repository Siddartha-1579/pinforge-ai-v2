import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthStartupWarning } from './components/AuthStartupWarning'
import { AuthProvider } from './hooks/useAuth'
import { Dashboard } from './pages/Dashboard'
import { Analytics } from './pages/Analytics'
import { Automation } from './pages/Automation'
import { AuthDiagnostics } from './pages/AuthDiagnostics'
import { Calendar } from './pages/Calendar'
import { Diagnostics } from './pages/Diagnostics'
import { Exports } from './pages/Exports'
import { Generator } from './pages/Generator'
import { Intelligence } from './pages/Intelligence'
import { Links } from './pages/Links'
import { Login } from './pages/Login'
import { Pinterest } from './pages/Pinterest'
import { ProductResearch } from './pages/ProductResearch'
import { Queue } from './pages/Queue'
import { Settings } from './pages/Settings'
import { Sessions } from './pages/Sessions'
import { UploadWorkspace } from './pages/UploadWorkspace'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AuthStartupWarning />
          <Routes>
            <Route path="/login" element={<Login mode="login" />} />
            <Route path="/signup" element={<Login mode="signup" />} />
            <Route path="/auth-diagnostics" element={<AuthDiagnostics />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="research" element={<ProductResearch />} />
                <Route path="links" element={<Links />} />
                <Route path="generator" element={<Generator />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="queue" element={<Queue />} />
                <Route path="upload" element={<UploadWorkspace />} />
                <Route path="sessions" element={<Sessions />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="intelligence" element={<Intelligence />} />
                <Route path="pinterest" element={<Pinterest />} />
                <Route path="automation" element={<Automation />} />
                <Route path="diagnostics" element={<Diagnostics />} />
                <Route path="exports" element={<Exports />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
