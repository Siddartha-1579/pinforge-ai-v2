import { supabase } from '../integrations/supabase/client'
import type { AffiliateNetwork, Product } from '../types'

export interface AffiliateImportMetadata {
  source_url: string
  resolved_url: string
  affiliate_url: string
  affiliate_network: AffiliateNetwork
  host: string
  title: string
  description: string
  features: string[]
  benefits: string[]
  category: string
  brand: string
  product_image_url: string | null
  keywords: string[]
  hashtags: string[]
  extraction_warning?: string | null
}

const networkMatchers: Array<{ network: AffiliateNetwork; patterns: string[] }> = [
  { network: 'Amazon', patterns: ['amazon.', 'amzn.to'] },
  { network: 'ClickBank', patterns: ['clickbank.net', 'clickbank.com'] },
  { network: 'Impact', patterns: ['impact.com', 'impactradius.com'] },
  { network: 'CJ', patterns: ['cj.com', 'anrdoezrs.net', 'jdoqocy.com', 'tkqlhce.com'] },
  { network: 'ShareASale', patterns: ['shareasale.com'] },
  { network: 'Digistore24', patterns: ['digistore24.com'] },
]

export async function importProductFromAffiliateUrl(url: string): Promise<Product> {
  const metadata = await extractAffiliateMetadata(url)
  return productFromMetadata(metadata)
}

export async function extractAffiliateMetadata(url: string): Promise<AffiliateImportMetadata> {
  const localMetadata = buildLocalMetadata(url)

  try {
    const { data, error } = await supabase.functions.invoke<AffiliateImportMetadata>('import-affiliate-product', {
      body: { url: localMetadata.source_url },
    })

    if (error) throw error
    if (data?.title && data.resolved_url) return normalizeMetadata(data)
  } catch (error) {
    console.info('Using local affiliate import fallback.', error)
  }

  return localMetadata
}

export function productFromMetadata(metadata: AffiliateImportMetadata): Product {
  return {
    id: crypto.randomUUID(),
    name: metadata.title,
    category: metadata.category,
    price_range: 'Verify price on merchant page',
    virality_score: scoreFromKeywords(metadata.keywords, 72),
    competition_level: metadata.affiliate_network === 'Amazon' ? 'Medium' : 'Low',
    affiliate_potential: scoreFromKeywords(metadata.keywords, 78),
    trend_reasoning: metadata.extraction_warning
      ? `${metadata.affiliate_network} affiliate link imported from ${metadata.host}. ${metadata.extraction_warning}`
      : `${metadata.affiliate_network} affiliate link imported from ${metadata.host}. Metadata was extracted from the resolved destination URL.`,
    target_audience: audienceFromKeywords(metadata.keywords),
    affiliate_url: metadata.affiliate_url,
    affiliate_network: metadata.affiliate_network,
    import_source_url: metadata.source_url,
    resolved_url: metadata.resolved_url,
    short_description: metadata.description,
    brand: metadata.brand,
    features: metadata.features,
    benefits: metadata.benefits,
    keywords: metadata.keywords,
    hashtags: metadata.hashtags,
    product_image_url: metadata.product_image_url,
  }
}

export function buildLocalMetadata(value: string): AffiliateImportMetadata {
  const parsed = parseAffiliateUrl(value)
  const keywords = extractKeywords(parsed)
  const title = titleFromKeywords(keywords, parsed.network)
  const category = categoryFromNetwork(parsed.network)
  const description = `${title} is positioned as a practical ${category.toLowerCase()} recommendation for Pinterest shoppers.`

  return normalizeMetadata({
    source_url: parsed.href,
    resolved_url: parsed.href,
    affiliate_url: parsed.href,
    affiliate_network: parsed.network,
    host: parsed.host,
    title,
    description,
    features: featuresFromKeywords(keywords),
    benefits: benefitsFromKeywords(keywords),
    category,
    brand: brandFromHost(parsed.host),
    product_image_url: null,
    keywords,
    hashtags: hashtagsFromKeywords(keywords),
    extraction_warning: parsed.host.includes('amzn.to')
      ? 'Short-link expansion was unavailable locally; the original affiliate URL was preserved.'
      : null,
  })
}

export function parseAffiliateUrl(value: string) {
  const href = normalizeUrl(value)
  const url = new URL(href)
  const host = url.host.toLowerCase()
  const network = networkMatchers.find((matcher) => matcher.patterns.some((pattern) => host.includes(pattern)))?.network ?? 'Other'

  return {
    href,
    host,
    network,
    path: url.pathname,
    search: url.search,
  }
}

function normalizeMetadata(metadata: AffiliateImportMetadata): AffiliateImportMetadata {
  const parsed = parseAffiliateUrl(metadata.source_url || metadata.affiliate_url || metadata.resolved_url)
  const resolved = metadata.resolved_url || parsed.href
  const resolvedHost = safeHost(resolved) || parsed.host
  const keywords = uniqueWords(metadata.keywords.length ? metadata.keywords : extractKeywords({ ...parsed, href: resolved, host: resolvedHost, path: safePath(resolved), search: '' }))
  const title = truncateText(metadata.title || titleFromKeywords(keywords, parsed.network), 90)
  const description = truncateText(metadata.description || `${title} is a Pinterest-ready affiliate product recommendation.`, 220)

  return {
    ...metadata,
    source_url: metadata.source_url || parsed.href,
    resolved_url: resolved,
    affiliate_url: metadata.affiliate_url || parsed.href,
    affiliate_network: metadata.affiliate_network || parsed.network,
    host: resolvedHost,
    title,
    description,
    brand: metadata.brand || brandFromHost(resolvedHost),
    category: metadata.category || categoryFromNetwork(metadata.affiliate_network || parsed.network),
    features: (metadata.features?.length ? metadata.features : featuresFromKeywords(keywords)).slice(0, 5),
    benefits: (metadata.benefits?.length ? metadata.benefits : benefitsFromKeywords(keywords)).slice(0, 5),
    keywords: keywords.slice(0, 10),
    hashtags: (metadata.hashtags?.length ? metadata.hashtags : hashtagsFromKeywords(keywords)).slice(0, 8),
    product_image_url: metadata.product_image_url || null,
    extraction_warning: metadata.extraction_warning ?? null,
  }
}

function normalizeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) throw new Error('Affiliate URL is required.')
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function extractKeywords(parsed: ReturnType<typeof parseAffiliateUrl>) {
  const rawParts = decodeURIComponent(`${parsed.host} ${parsed.path} ${parsed.search}`)
    .replace(/\b(www|com|dp|gp|product|products|offer|hop|link|ref|tag|asin|utm|campaign|affiliate)\b/gi, ' ')
    .split(/[^a-z0-9]+/i)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 2 && !/^\d+$/.test(part))

  return uniqueWords(rawParts).slice(0, 10)
}

function titleFromKeywords(keywords: string[], network: AffiliateNetwork) {
  const title = keywords.slice(0, 5).map(capitalize).join(' ')
  return title || `${network} affiliate product`
}

function categoryFromNetwork(network: AffiliateNetwork) {
  if (network === 'Amazon') return 'Amazon Product'
  if (network === 'ClickBank' || network === 'Digistore24') return 'Digital Product'
  return 'Affiliate Product'
}

function audienceFromKeywords(keywords: string[]) {
  const topic = keywords.slice(0, 3).join(', ')
  return topic ? `Pinterest shoppers interested in ${topic}` : 'Pinterest shoppers looking for useful product recommendations'
}

function featuresFromKeywords(keywords: string[]) {
  const topic = keywords[0] ? capitalize(keywords[0]) : 'Product'
  return [
    `${topic}-focused product positioning`,
    'Affiliate URL preserved on the product record',
    'Pinterest-ready metadata for generator use',
  ]
}

function benefitsFromKeywords(keywords: string[]) {
  const topic = keywords[0] ? capitalize(keywords[0]) : 'Product'
  return [
    `${topic} recommendation with direct purchase intent`,
    'Useful for comparison and save-worthy shopping content',
    'Ready to pair with a clear Pinterest call to action',
  ]
}

function hashtagsFromKeywords(keywords: string[]) {
  return keywords
    .slice(0, 8)
    .map((keyword) => `#${keyword.replace(/[^a-z0-9]/gi, '')}`)
    .filter((tag) => tag.length > 1)
}

function brandFromHost(host: string) {
  const root = host.replace(/^www\./, '').split('.')[0] || 'Merchant'
  return capitalize(root.replace(/[-_]+/g, ' '))
}

function scoreFromKeywords(keywords: string[], baseline: number) {
  return Math.min(95, baseline + Math.min(keywords.length, 10))
}

function uniqueWords(words: string[]) {
  return Array.from(new Set(words.map((word) => word.trim().toLowerCase()).filter(Boolean)))
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3).trim()}...` : value
}

function safeHost(value: string) {
  try {
    return new URL(value).host.toLowerCase()
  } catch {
    return ''
  }
}

function safePath(value: string) {
  try {
    return new URL(value).pathname
  } catch {
    return ''
  }
}
