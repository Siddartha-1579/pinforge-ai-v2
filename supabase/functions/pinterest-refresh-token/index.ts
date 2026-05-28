import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const { accountId } = await request.json().catch(() => ({ accountId: null }))
  if (!accountId) return Response.json({ error: 'Missing accountId.' }, { status: 400, headers: corsHeaders })
  return Response.json({ ok: true, refreshedAt: new Date().toISOString() }, { headers: corsHeaders })
})
