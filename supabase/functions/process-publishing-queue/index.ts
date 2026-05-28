import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const autoPublish = Deno.env.get('AUTO_PUBLISH') === 'true'
  if (!autoPublish) return Response.json({ processed: 0, reason: 'AUTO_PUBLISH disabled.' }, { headers: corsHeaders })
  return Response.json({ processed: 0, reason: 'Queue processor scaffolded. No cron or autonomous posting is enabled.' }, { headers: corsHeaders })
})
