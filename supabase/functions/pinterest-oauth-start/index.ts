import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const clientId = Deno.env.get('PINTEREST_CLIENT_ID')
  const redirectUri = Deno.env.get('PINTEREST_REDIRECT_URI')
  if (!clientId || !redirectUri) {
    return Response.json({ error: 'Pinterest OAuth is not configured.' }, { status: 503, headers: corsHeaders })
  }

  const state = crypto.randomUUID()
  const url = new URL('https://www.pinterest.com/oauth/')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'pins:read,pins:write,boards:read')
  url.searchParams.set('state', state)

  return Response.json({ url: url.toString(), state }, { headers: corsHeaders })
})
