import { isSupabaseConfigured, supabase, supabaseConfig } from '../integrations/supabase/client'

export interface AuthHealthStatus {
  supabaseUrlConfigured: boolean
  supabaseKeyConfigured: boolean
  authServiceReachable: boolean
  currentUserSession: boolean
  emailConfirmationEnabled: boolean
  checkedAt: string
  results: string[]
}

export async function runAuthHealthCheck(): Promise<AuthHealthStatus> {
  const results: string[] = []
  const status: AuthHealthStatus = {
    supabaseUrlConfigured: Boolean(supabaseConfig.url),
    supabaseKeyConfigured: Boolean(supabaseConfig.anonKey),
    authServiceReachable: false,
    currentUserSession: false,
    emailConfirmationEnabled: false,
    checkedAt: new Date().toISOString(),
    results,
  }

  if (!status.supabaseUrlConfigured) results.push('Supabase URL is not configured.')
  if (!status.supabaseKeyConfigured) results.push('Supabase anon key is not configured.')

  if (!isSupabaseConfigured || !supabaseConfig.url || !supabaseConfig.anonKey) {
    results.push('Auth test stopped because Supabase configuration is incomplete.')
    return status
  }

  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    status.currentUserSession = Boolean(data.session)
    results.push(status.currentUserSession ? 'Current user session found.' : 'No current user session found.')
    results.push('Supabase client session check completed.')
  } catch {
    results.push('Unable to complete the Supabase client session check.')
  }

  try {
    const response = await fetch(authEndpoint('/settings'), {
      headers: {
        apikey: supabaseConfig.anonKey,
        Authorization: `Bearer ${supabaseConfig.anonKey}`,
      },
    })

    status.authServiceReachable = response.ok

    if (!response.ok) {
      results.push('Auth endpoint responded, but did not pass the reachability check.')
      return status
    }

    results.push('Auth endpoint is reachable.')

    const settings = await response.json().catch(() => null)
    const autoconfirm = readAutoconfirmSetting(settings)
    if (typeof autoconfirm === 'boolean') {
      status.emailConfirmationEnabled = !autoconfirm
      results.push(status.emailConfirmationEnabled ? 'Email confirmation appears to be enabled.' : 'Email confirmation appears to be disabled.')
    } else {
      results.push('Email confirmation setting was not exposed by the auth settings endpoint.')
    }
  } catch {
    results.push('Unable to reach authentication service.')
  }

  return status
}

function authEndpoint(path: string) {
  return `${supabaseConfig.url?.replace(/\/$/, '')}/auth/v1${path}`
}

function readAutoconfirmSetting(value: unknown): boolean | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const directValue = record.mailer_autoconfirm ?? record.email_autoconfirm ?? record.autoconfirm
  if (typeof directValue === 'boolean') return directValue
  return null
}
