import { AlertTriangle, Link2, RefreshCw, Unplug } from 'lucide-react'
import { useState } from 'react'
import { Card, EmptyState, PageHeader } from '../components/ui'
import { useAppData } from '../hooks/useAppData'
import { requestPinterestConnect, requestPinterestDisconnect, requestTokenRefresh } from '../lib/publishing'

export function Pinterest() {
  const { pinterestAccounts, disconnectPinterestAccount, saveUploadLog } = useAppData()
  const [now] = useState(() => Date.now())

  async function connect() {
    try {
      await requestPinterestConnect()
    } catch (error) {
      await saveUploadLog({
        id: crypto.randomUUID(),
        level: 'error',
        message: error instanceof Error ? error.message : 'Pinterest connection failed.',
        created_at: new Date().toISOString(),
      })
    }
  }

  async function disconnect(id: string) {
    try {
      await requestPinterestDisconnect(id)
    } catch (error) {
      await saveUploadLog({ id: crypto.randomUUID(), level: 'warn', message: `Local disconnect used: ${error instanceof Error ? error.message : 'edge function unavailable'}`, created_at: new Date().toISOString() })
    }
    await disconnectPinterestAccount(id)
  }

  async function refresh(id: string) {
    try {
      await requestTokenRefresh(id)
    } catch (error) {
      await saveUploadLog({ id: crypto.randomUUID(), level: 'error', message: error instanceof Error ? error.message : 'Token refresh failed.', created_at: new Date().toISOString() })
    }
  }

  return (
    <>
      <PageHeader title="Pinterest Connection" eyebrow="OAuth management">
        <button className="btn-primary" type="button" onClick={() => void connect()}>
          <Link2 size={16} />
          Connect Pinterest
        </button>
      </PageHeader>

      <Card>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
          Tokens are designed to be stored in Supabase tables and refreshed through edge functions. The client only displays account status.
        </div>
        <div className="mt-4 space-y-3">
          {pinterestAccounts.length === 0 ? (
            <EmptyState title="No Pinterest account connected" description="Manual upload workflows keep working while OAuth is disconnected." />
          ) : (
            pinterestAccounts.map((account) => {
              const expiresSoon = account.token_expires_at ? new Date(account.token_expires_at).getTime() - now < 1000 * 60 * 60 * 24 * 7 : false
              return (
                <div key={account.id} className="rounded-md border border-slate-200 p-4 dark:border-white/10">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">{account.display_name || account.username || 'Pinterest account'}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{account.connected ? 'Connected' : 'Disconnected'}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Expires: {account.token_expires_at ? new Date(account.token_expires_at).toLocaleString() : 'Unknown'}</p>
                    </div>
                    {expiresSoon ? <span className="inline-flex items-center gap-2 rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-100"><AlertTriangle size={16} />Token expires soon</span> : null}
                    <div className="flex gap-2">
                      <button className="btn-secondary" type="button" onClick={() => void refresh(account.id)}><RefreshCw size={16} />Refresh</button>
                      <button className="btn-secondary" type="button" onClick={() => void disconnect(account.id)}><Unplug size={16} />Disconnect</button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>
    </>
  )
}
