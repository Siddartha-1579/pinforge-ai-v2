import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
export const supabaseDiagnostics = {
  urlPresent: Boolean(supabaseUrl),
  keyPresent: Boolean(supabaseAnonKey),
  clientInitialized: isSupabaseConfigured,
  urlHost: safeHost(supabaseUrl),
  keyPreview: supabaseAnonKey ? `${supabaseAnonKey.slice(0, 8)}...${supabaseAnonKey.slice(-4)}` : null,
}

if (!isSupabaseConfigured) {
  console.error('Supabase environment variables are missing. Authentication is disabled until Vercel env vars are configured.')
} else {
  console.info('Supabase diagnostics', {
    urlPresent: supabaseDiagnostics.urlPresent,
    keyPresent: supabaseDiagnostics.keyPresent,
    clientInitialized: supabaseDiagnostics.clientInitialized,
    urlHost: supabaseDiagnostics.urlHost,
    keyPreview: supabaseDiagnostics.keyPreview,
  })
}

export const supabase = createClient(
  supabaseUrl ?? 'https://supabase-not-configured.invalid',
  supabaseAnonKey ?? 'supabase-not-configured',
  {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  },
)

function safeHost(value: string | undefined) {
  if (!value) return null
  try {
    return new URL(value).host
  } catch {
    return 'invalid-url'
  }
}
