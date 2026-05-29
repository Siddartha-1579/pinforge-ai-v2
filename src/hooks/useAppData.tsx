/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../integrations/supabase/client'
import { defaultSettings, demoEvents, demoLinks, demoPins, demoPinterestAccounts, demoPins as fallbackPins, demoProducts, demoPublishingJobs, demoQueue, demoSessions, demoTrendHistory, demoUploadLogs } from '../lib/constants'
import type { AffiliateLink, AnalyticsEvent, GeneratedPin, PinterestAccount, PinQueueItem, PinStatus, Product, PublishingJob, TrendIntelligence, UploadLog, UploadSession, UserSettings } from '../types'
import { useAuth } from './useAuth'

interface AppDataContextValue {
  products: Product[]
  links: AffiliateLink[]
  pins: GeneratedPin[]
  queue: PinQueueItem[]
  sessions: UploadSession[]
  events: AnalyticsEvent[]
  pinterestAccounts: PinterestAccount[]
  publishingJobs: PublishingJob[]
  uploadLogs: UploadLog[]
  trendHistory: TrendIntelligence[]
  settings: UserSettings
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  saveProduct: (product: Product) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  saveLink: (link: Omit<AffiliateLink, 'id'> & { id?: string }) => Promise<void>
  deleteLink: (id: string) => Promise<void>
  savePin: (pin: Omit<GeneratedPin, 'id' | 'uploaded'> & { id?: string; uploaded?: boolean }) => Promise<void>
  markPinUploaded: (id: string) => Promise<void>
  updatePinWorkflow: (id: string, updates: Partial<Pick<GeneratedPin, 'status' | 'notes' | 'pinterest_url' | 'published_at' | 'uploaded'>>) => Promise<void>
  saveQueueItem: (item: Omit<PinQueueItem, 'id'> & { id?: string }) => Promise<void>
  deleteQueueItems: (ids: string[]) => Promise<void>
  bulkUpdateQueue: (ids: string[], updates: Partial<Pick<PinQueueItem, 'status' | 'scheduled_at'>>) => Promise<void>
  saveSession: (session: Omit<UploadSession, 'id'> & { id?: string }) => Promise<void>
  updateSession: (id: string, updates: Partial<UploadSession>) => Promise<void>
  trackEvent: (event: Omit<AnalyticsEvent, 'id' | 'created_at'>) => Promise<void>
  savePinterestAccount: (account: Omit<PinterestAccount, 'id'> & { id?: string }) => Promise<void>
  disconnectPinterestAccount: (id: string) => Promise<void>
  savePublishingJob: (job: PublishingJob) => Promise<void>
  saveUploadLog: (log: UploadLog) => Promise<void>
  saveTrendHistory: (trend: Omit<TrendIntelligence, 'id' | 'created_at'>) => Promise<void>
  saveSettings: (settings: UserSettings) => Promise<void>
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [links, setLinks] = useState<AffiliateLink[]>([])
  const [pins, setPins] = useState<GeneratedPin[]>([])
  const [queue, setQueue] = useState<PinQueueItem[]>([])
  const [sessions, setSessions] = useState<UploadSession[]>([])
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [pinterestAccounts, setPinterestAccounts] = useState<PinterestAccount[]>([])
  const [publishingJobs, setPublishingJobs] = useState<PublishingJob[]>([])
  const [uploadLogs, setUploadLogs] = useState<UploadLog[]>([])
  const [trendHistory, setTrendHistory] = useState<TrendIntelligence[]>([])
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setProducts([])
      setLinks([])
      setPins([])
      setQueue([])
      setSessions([])
      setEvents([])
      setPinterestAccounts([])
      setPublishingJobs([])
      setUploadLogs([])
      setTrendHistory([])
      setSettings(defaultSettings)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [productsResult, linksResult, pinsResult, queueResult, sessionsResult, eventsResult, accountsResult, jobsResult, logsResult, trendsResult, settingsResult] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('affiliate_links').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('generated_pins').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('pin_queue').select('*').order('scheduled_at', { ascending: true, nullsFirst: false }).limit(200),
        supabase.from('upload_sessions').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(300),
        supabase.from('pinterest_accounts').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('publishing_jobs').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('upload_logs').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('trend_intelligence').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('user_settings').select('*').maybeSingle(),
      ])

      if (productsResult.error) throw productsResult.error
      if (linksResult.error) throw linksResult.error
      if (pinsResult.error) throw pinsResult.error
      if (queueResult.error) throw queueResult.error
      if (sessionsResult.error) throw sessionsResult.error
      if (eventsResult.error) throw eventsResult.error
      if (accountsResult.error) throw accountsResult.error
      if (jobsResult.error) throw jobsResult.error
      if (logsResult.error) throw logsResult.error
      if (trendsResult.error) throw trendsResult.error
      if (settingsResult.error) throw settingsResult.error

      setProducts(productsResult.data ?? [])
      setLinks(linksResult.data ?? [])
      setPins((pinsResult.data ?? fallbackPins).map((pin) => ({ ...pin, status: pin.status ?? (pin.uploaded ? 'Published' : 'Draft') })))
      setQueue(queueResult.data ?? [])
      setSessions(sessionsResult.data ?? [])
      setEvents(eventsResult.data ?? [])
      setPinterestAccounts(accountsResult.data ?? [])
      setPublishingJobs(jobsResult.data ?? [])
      setUploadLogs(logsResult.data ?? [])
      setTrendHistory(trendsResult.data ?? [])
      setSettings(settingsResult.data ?? defaultSettings)
    } catch (nextError) {
      console.warn('Workspace load failed.', nextError)
      setError('Could not load your workspace. Showing demo data so you can keep working.')
      setProducts(demoProducts)
      setLinks(demoLinks)
      setPins(demoPins)
      setQueue(demoQueue)
      setSessions(demoSessions)
      setEvents(demoEvents)
      setPinterestAccounts(demoPinterestAccounts)
      setPublishingJobs(demoPublishingJobs)
      setUploadLogs(demoUploadLogs)
      setTrendHistory(demoTrendHistory)
      setSettings(defaultSettings)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    // The provider hydrates its client cache after auth state is known.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  const value = useMemo<AppDataContextValue>(
    () => ({
      products,
      links,
      pins,
      queue,
      sessions,
      events,
      pinterestAccounts,
      publishingJobs,
      uploadLogs,
      trendHistory,
      settings,
      loading,
      error,
      refresh,
      async saveProduct(product) {
        const payload = { ...product, id: product.id ?? crypto.randomUUID(), user_id: user?.id }
        setProducts((current) => [payload, ...current.filter((item) => item.id !== product.id)])
        if (!user) return
        const { error: saveError } = await supabase.from('products').upsert(payload)
        if (saveError) throw saveError
      },
      async deleteProduct(id) {
        setProducts((current) => current.filter((item) => item.id !== id))
        setLinks((current) => current.map((item) => (item.product_id === id ? { ...item, product_id: null } : item)))
        setPins((current) => current.map((item) => (item.product_id === id ? { ...item, product_id: null } : item)))
        setQueue((current) => current.map((item) => (item.product_id === id ? { ...item, product_id: null } : item)))
        if (!user) return
        const { error: deleteError } = await supabase.from('products').delete().eq('id', id)
        if (deleteError) throw deleteError
      },
      async saveLink(link) {
        const payload = { ...link, id: link.id ?? crypto.randomUUID(), user_id: user?.id }
        setLinks((current) => [payload, ...current.filter((item) => item.id !== payload.id)])
        if (!user) return
        const { error: saveError } = await supabase.from('affiliate_links').upsert(payload)
        if (saveError) throw saveError
      },
      async deleteLink(id) {
        setLinks((current) => current.filter((item) => item.id !== id))
        if (!user) return
        const { error: deleteError } = await supabase.from('affiliate_links').delete().eq('id', id)
        if (deleteError) throw deleteError
      },
      async savePin(pin) {
        const payload = {
          ...pin,
          id: pin.id ?? crypto.randomUUID(),
          uploaded: pin.uploaded ?? false,
          user_id: user?.id,
        }
        setPins((current) => [payload, ...current.filter((item) => item.id !== payload.id)])
        setQueue((current) =>
          current.some((item) => item.pin_id === payload.id)
            ? current
            : [
                {
                  id: crypto.randomUUID(),
                  pin_id: payload.id,
                  product_id: payload.product_id,
                  affiliate_link_id: payload.affiliate_link_id,
                  status: payload.status ?? 'Draft',
                },
                ...current,
              ],
        )
        if (!user) return
        const { error: saveError } = await supabase.from('generated_pins').upsert(payload)
        if (saveError) throw saveError
        await supabase.from('pin_queue').upsert({
          pin_id: payload.id,
          product_id: payload.product_id,
          affiliate_link_id: payload.affiliate_link_id,
          status: payload.status ?? 'Draft',
          user_id: user.id,
        }, { onConflict: 'pin_id' })
      },
      async markPinUploaded(id) {
        setPins((current) => current.map((pin) => (pin.id === id ? { ...pin, uploaded: true, status: 'Published', published_at: pin.published_at ?? new Date().toISOString() } : pin)))
        setQueue((current) => current.map((item) => (item.pin_id === id ? { ...item, status: 'Published' } : item)))
        if (!user) return
        const { error: saveError } = await supabase.from('generated_pins').update({ uploaded: true, status: 'Published', published_at: new Date().toISOString() }).eq('id', id)
        if (saveError) throw saveError
        await supabase.from('pin_queue').update({ status: 'Published' }).eq('pin_id', id)
      },
      async updatePinWorkflow(id, updates) {
        setPins((current) => current.map((pin) => (pin.id === id ? { ...pin, ...updates } : pin)))
        if (updates.status) setQueue((current) => current.map((item) => (item.pin_id === id ? { ...item, status: updates.status as PinStatus } : item)))
        if (!user) return
        const { error: saveError } = await supabase.from('generated_pins').update(updates).eq('id', id)
        if (saveError) throw saveError
        if (updates.status) await supabase.from('pin_queue').update({ status: updates.status }).eq('pin_id', id)
      },
      async saveQueueItem(item) {
        const payload = { ...item, id: item.id ?? crypto.randomUUID(), user_id: user?.id }
        setQueue((current) => [payload, ...current.filter((next) => next.id !== payload.id)])
        if (!user) return
        const { error: saveError } = await supabase.from('pin_queue').upsert(payload)
        if (saveError) throw saveError
      },
      async deleteQueueItems(ids) {
        setQueue((current) => current.filter((item) => !ids.includes(item.id)))
        if (!user) return
        const { error: deleteError } = await supabase.from('pin_queue').delete().in('id', ids)
        if (deleteError) throw deleteError
      },
      async bulkUpdateQueue(ids, updates) {
        setQueue((current) => current.map((item) => (ids.includes(item.id) ? { ...item, ...updates } : item)))
        if (!user) return
        const { error: saveError } = await supabase.from('pin_queue').update(updates).in('id', ids)
        if (saveError) throw saveError
      },
      async saveSession(session) {
        const payload = { ...session, id: session.id ?? crypto.randomUUID(), user_id: user?.id }
        setSessions((current) => [payload, ...current.filter((item) => item.id !== payload.id)])
        if (!user) return
        const { error: saveError } = await supabase.from('upload_sessions').upsert(payload)
        if (saveError) throw saveError
      },
      async updateSession(id, updates) {
        setSessions((current) => current.map((session) => (session.id === id ? { ...session, ...updates } : session)))
        if (!user) return
        const { error: saveError } = await supabase.from('upload_sessions').update(updates).eq('id', id)
        if (saveError) throw saveError
      },
      async trackEvent(event) {
        const payload = { ...event, id: crypto.randomUUID(), created_at: new Date().toISOString(), user_id: user?.id }
        setEvents((current) => [payload, ...current])
        if (!user) return
        const { error: saveError } = await supabase.from('analytics_events').insert(payload)
        if (saveError) throw saveError
      },
      async savePinterestAccount(account) {
        const payload = { ...account, id: account.id ?? crypto.randomUUID(), user_id: user?.id }
        setPinterestAccounts((current) => [payload, ...current.filter((item) => item.id !== payload.id)])
        if (!user) return
        const { error: saveError } = await supabase.from('pinterest_accounts').upsert(payload)
        if (saveError) throw saveError
      },
      async disconnectPinterestAccount(id) {
        setPinterestAccounts((current) => current.map((account) => (account.id === id ? { ...account, connected: false } : account)))
        if (!user) return
        const { error: saveError } = await supabase.from('pinterest_accounts').update({ connected: false }).eq('id', id)
        if (saveError) throw saveError
      },
      async savePublishingJob(job) {
        const payload = { ...job, user_id: user?.id }
        setPublishingJobs((current) => [payload, ...current.filter((item) => item.id !== payload.id)])
        if (!user) return
        const { error: saveError } = await supabase.from('publishing_jobs').upsert(payload)
        if (saveError) throw saveError
      },
      async saveUploadLog(log) {
        const payload = { ...log, user_id: user?.id }
        setUploadLogs((current) => [payload, ...current])
        if (!user) return
        const { error: saveError } = await supabase.from('upload_logs').insert(payload)
        if (saveError) throw saveError
      },
      async saveTrendHistory(trend) {
        const payload = { ...trend, id: crypto.randomUUID(), created_at: new Date().toISOString(), user_id: user?.id }
        setTrendHistory((current) => [payload, ...current])
        if (!user) return
        const { error: saveError } = await supabase.from('trend_intelligence').insert(payload)
        if (saveError) throw saveError
      },
      async saveSettings(nextSettings) {
        setSettings(nextSettings)
        if (!user) return
        const payload = { ...nextSettings, user_id: user.id }
        const { error: saveError } = await supabase.from('user_settings').upsert(payload, { onConflict: 'user_id' })
        if (saveError) throw saveError
      },
    }),
    [error, events, links, loading, pins, pinterestAccounts, products, publishingJobs, queue, refresh, sessions, settings, trendHistory, uploadLogs, user],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const context = useContext(AppDataContext)
  if (!context) throw new Error('useAppData must be used inside AppDataProvider')
  return context
}
