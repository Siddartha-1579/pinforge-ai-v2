import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { query } = await request.json()
    const topic = String(query || 'Pinterest affiliate products')

    return Response.json(
      [
        {
          id: crypto.randomUUID(),
          name: `${topic} high-intent product`,
          category: 'Affiliate Research',
          price_range: '$25-$150',
          virality_score: 86,
          competition_level: 'Medium',
          affiliate_potential: 82,
          trend_reasoning:
            'This seed has strong Pinterest save potential when framed as a useful visual solution.',
          target_audience: 'Pinterest shoppers looking for practical, attractive recommendations',
        },
      ],
      { headers: corsHeaders },
    )
  } catch {
    return Response.json({ error: 'Invalid discovery request.' }, { status: 400, headers: corsHeaders })
  }
})
