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
          short_description: `${topic} can be framed as a useful shopping idea with a clear problem-solution angle.`,
          brand: 'Research seed',
          features: ['Pinterest-friendly positioning', 'Clear shopping intent', 'Benefit-led copy angle'],
          benefits: ['Easy to turn into pin content', 'Useful for affiliate testing', 'Works with readable CTA placement'],
          keywords: topic.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 8),
          hashtags: topic.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 8).map((word) => `#${word.replace(/[^a-z0-9]/g, '')}`),
        },
      ],
      { headers: corsHeaders },
    )
  } catch {
    return Response.json({ error: 'Invalid discovery request.' }, { status: 400, headers: corsHeaders })
  }
})
