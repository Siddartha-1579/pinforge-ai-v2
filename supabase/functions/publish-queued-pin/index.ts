import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const autoPublish = Deno.env.get('AUTO_PUBLISH') === 'true'
  if (!autoPublish) return Response.json({ error: 'AUTO_PUBLISH is disabled.' }, { status: 403, headers: corsHeaders })
  const { queueItemId, pinId, affiliateUrl } = await request.json().catch(() => ({ queueItemId: null, pinId: null, affiliateUrl: null }))
  if (!queueItemId || !pinId) return Response.json({ error: 'Missing queueItemId or pinId.' }, { status: 400, headers: corsHeaders })
  return Response.json({ pinterestUrl: `https://www.pinterest.com/pin/${pinId}`, affiliateUrl: affiliateUrl ?? null }, { headers: corsHeaders })
})
