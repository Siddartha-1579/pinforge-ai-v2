import { supabase } from '../integrations/supabase/client'
import { automationBlockedReason } from './featureFlags'
import type { PinterestAccount, PinQueueItem, PublishingJob, UploadLog, UserSettings } from '../types'

export interface PublishAttemptResult {
  job: PublishingJob
  log: UploadLog
}

export async function requestPinterestConnect() {
  const { data, error } = await supabase.functions.invoke<{ url?: string }>('pinterest-oauth-start')
  if (error) throw error
  if (data?.url) window.location.href = data.url
  return data
}

export async function requestPinterestDisconnect(accountId: string) {
  const { error } = await supabase.functions.invoke('pinterest-disconnect', { body: { accountId } })
  if (error) throw error
}

export async function requestTokenRefresh(accountId: string) {
  const { error } = await supabase.functions.invoke('pinterest-refresh-token', { body: { accountId } })
  if (error) throw error
}

export function createBlockedPublishLog(reason: string): UploadLog {
  return {
    id: crypto.randomUUID(),
    level: 'warn',
    message: `Publishing skipped: ${reason}`,
    created_at: new Date().toISOString(),
  }
}

export async function publishQueueItem({
  item,
  settings,
  account,
}: {
  item: PinQueueItem
  settings: UserSettings
  account?: PinterestAccount
}): Promise<PublishAttemptResult> {
  const blockedReason = automationBlockedReason(settings, Boolean(account?.connected))
  const maxRetries = settings.retry_limits ?? 2

  if (blockedReason) {
    const job: PublishingJob = {
      id: crypto.randomUUID(),
      queue_item_id: item.id,
      pin_id: item.pin_id,
      status: 'Failed',
      retry_count: 0,
      max_retries: maxRetries,
      last_error: blockedReason,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }
    return { job, log: createBlockedPublishLog(blockedReason) }
  }

  try {
    const { data, error } = await supabase.functions.invoke<{ pinterestUrl?: string }>('publish-queued-pin', {
      body: { queueItemId: item.id, pinId: item.pin_id, affiliateUrl: item.affiliate_url },
    })
    if (error) throw error

    return {
      job: {
        id: crypto.randomUUID(),
        queue_item_id: item.id,
        pin_id: item.pin_id,
        status: 'Published',
        retry_count: 0,
        max_retries: maxRetries,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
      log: {
        id: crypto.randomUUID(),
        level: 'info',
        message: `Published pin${data?.pinterestUrl ? ` to ${data.pinterestUrl}` : ''}.`,
        pin_id: item.pin_id,
        created_at: new Date().toISOString(),
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pinterest publishing request failed.'
    return {
      job: {
        id: crypto.randomUUID(),
        queue_item_id: item.id,
        pin_id: item.pin_id,
        status: item.status === 'Failed' ? 'Failed' : 'Retrying',
        retry_count: 1,
        max_retries: maxRetries,
        last_error: message,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
      log: {
        id: crypto.randomUUID(),
        level: 'error',
        message,
        pin_id: item.pin_id,
        created_at: new Date().toISOString(),
      },
    }
  }
}
