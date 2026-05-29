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
    const keywords = Array.isArray(product?.keywords) && product.keywords.length > 0
      ? product.keywords.slice(0, 10)
      : String(product?.name ?? 'affiliate product').toLowerCase().split(/\s+/).filter(Boolean).slice(0, 8)
    const hashtags = Array.isArray(product?.hashtags) && product.hashtags.length > 0
      ? product.hashtags.slice(0, 8)
      : keywords.slice(0, 8).map((keyword) => `#${String(keyword).replace(/[^a-z0-9]/gi, '')}`).filter((tag) => tag.length > 1)

    return Response.json(
      styles.slice(0, limit).map((style) => ({
        style,
        title: `${product.name}: a save-worthy ${product.category} idea`,
        description:
          product.short_description || instructionHint || 'A clear, benefit-led Pinterest description that presents the product as a practical solution.',
        cta: primaryCta,
        emotional_trigger: 'Feel confident choosing a simple upgrade.',
        marketing_angle: `${settings?.brand_tone ?? 'Helpful'} problem-solution marketing angle`,
        keywords,
        hashtags,
      })),
      { headers: corsHeaders },
    )
  } catch {
    return Response.json({ error: 'Invalid pin generation request.' }, { status: 400, headers: corsHeaders })
  }
})
