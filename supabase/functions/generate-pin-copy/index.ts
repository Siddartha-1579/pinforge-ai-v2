import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const styles = [
  'Scandinavian Minimal',
  'Premium Lifestyle',
  'High Contrast Ad',
  'Wellness Aesthetic',
  'Productivity Style',
]

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { product, count, settings } = await request.json()
    const limit = count === 1 ? 1 : 5
    const primaryCta = String(settings?.cta_preferences ?? 'Save this idea').split(',')[0]?.trim() || 'Save this idea'
    const instructionHint = String(settings?.global_pin_instructions ?? '').slice(0, 120)

    return Response.json(
      styles.slice(0, limit).map((style) => ({
        style,
        title: `${product.name}: a save-worthy ${product.category} idea`,
        description:
          instructionHint || 'A clear, benefit-led Pinterest description that presents the product as a practical solution.',
        cta: primaryCta,
        emotional_trigger: 'Feel confident choosing a simple upgrade.',
        marketing_angle: `${settings?.brand_tone ?? 'Helpful'} problem-solution marketing angle`,
      })),
      { headers: corsHeaders },
    )
  } catch {
    return Response.json({ error: 'Invalid pin generation request.' }, { status: 400, headers: corsHeaders })
  }
})
