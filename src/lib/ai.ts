import { supabase } from '../integrations/supabase/client'
import { demoProducts, pinStyles } from './constants'
import type { PinCopy, Product, UserSettings } from '../types'

export async function discoverProducts(query: string, settings?: UserSettings): Promise<Product[]> {
  try {
    const { data, error } = await supabase.functions.invoke<Product[]>('discover-products', {
      body: { query, settings },
    })

    if (error) throw error
    if (Array.isArray(data) && data.length > 0) return data
  } catch (error) {
    console.info('Using local product discovery fallback.', error)
  }

  const topic = query.trim() || 'Pinterest affiliate products'
  return demoProducts.map((product, index) => ({
    ...product,
    id: crypto.randomUUID(),
    name: index === 0 ? `${topic} starter pick` : product.name,
    trend_reasoning: `${product.trend_reasoning} Search seed: ${topic}.`,
    short_description: product.short_description ?? `${product.name} is a Pinterest-friendly affiliate product idea.`,
    brand: product.brand ?? product.name.split(' ')[0] ?? null,
    features: product.features ?? ['Pinterest-ready product positioning', 'Clear visual shopping angle', 'Affiliate URL ready'],
    benefits: product.benefits ?? ['Practical recommendation', 'Clear shopping intent', 'Save-worthy content angle'],
    keywords: product.keywords ?? topic.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6),
    hashtags: product.hashtags ?? topic.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6).map((word) => `#${word.replace(/[^a-z0-9]/g, '')}`),
  }))
}

export async function generatePinCopy(
  product: Product,
  settings: UserSettings,
  count: 1 | 5,
): Promise<PinCopy[]> {
  try {
    const { data, error } = await supabase.functions.invoke<PinCopy[]>('generate-pin-copy', {
      body: { product, settings, count },
    })

    if (error) throw error
    if (Array.isArray(data) && data.length > 0) return data.slice(0, count)
  } catch (error) {
    console.info('Using local pin copy fallback.', error)
  }

  return pinStyles.slice(0, count).map((style) => ({
    style,
    title: titleForStyle(product.name, style),
    description: product.short_description ?? `${product.name} helps ${product.target_audience.toLowerCase()} solve a real daily problem with a practical, save-worthy upgrade.`,
    cta: settings.cta_preferences.split(',')[0]?.trim() || 'Save this idea',
    emotional_trigger: 'Make the next step feel simple, useful, and worth remembering.',
    marketing_angle: `Problem-solution angle for ${product.category.toLowerCase()} shoppers`,
    keywords: product.keywords ?? product.name.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6),
    hashtags: product.hashtags ?? product.name.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6).map((word) => `#${word.replace(/[^a-z0-9]/g, '')}`),
  }))
}

function titleForStyle(productName: string, style: string) {
  const titles: Record<string, string> = {
    'Scandinavian Minimal': `${productName}: simple upgrade, cleaner routine`,
    'Premium Lifestyle': `The polished way to use ${productName}`,
    'High Contrast Ad': `Stop scrolling: ${productName} solves this`,
    'Wellness Aesthetic': `A calmer routine starts with ${productName}`,
    'Productivity Style': `Get more done with ${productName}`,
  }

  return titles[style] ?? productName
}
