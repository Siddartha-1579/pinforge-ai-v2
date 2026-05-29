import type { AffiliateNetwork, Product } from '../types'

const networkMatchers: Array<{ network: AffiliateNetwork; patterns: string[] }> = [
  { network: 'Amazon', patterns: ['amazon.', 'amzn.to'] },
  { network: 'ClickBank', patterns: ['clickbank.net', 'clickbank.com'] },
  { network: 'Impact', patterns: ['impact.com', 'impactradius.com'] },
  { network: 'CJ', patterns: ['cj.com', 'anrdoezrs.net', 'jdoqocy.com', 'tkqlhce.com'] },
  { network: 'ShareASale', patterns: ['shareasale.com'] },
  { network: 'Digistore24', patterns: ['digistore24.com'] },
]

export function importProductFromAffiliateUrl(url: string): Product {
  const parsed = parseAffiliateUrl(url)
  const keywords = extractKeywords(parsed)
  const title = titleFromKeywords(keywords, parsed.network)
  const category = categoryFromNetwork(parsed.network)

  return {
    id: crypto.randomUUID(),
    name: title,
    category,
    price_range: 'Verify price on merchant page',
    virality_score: scoreFromKeywords(keywords, 72),
    competition_level: parsed.network === 'Amazon' ? 'Medium' : 'Low',
    affiliate_potential: scoreFromKeywords(keywords, 78),
    trend_reasoning: `${parsed.network} affiliate link imported from ${parsed.host}. Product details were extracted from the link and should be reviewed before publishing.`,
    target_audience: audienceFromKeywords(keywords),
    affiliate_url: parsed.href,
    affiliate_network: parsed.network,
    short_description: `${title} is positioned as a practical ${category.toLowerCase()} recommendation for Pinterest shoppers.`,
    benefits: benefitsFromKeywords(keywords),
    keywords,
    hashtags: keywords.slice(0, 6).map((keyword) => `#${keyword.replace(/[^a-z0-9]/gi, '')}`).filter((tag) => tag.length > 1),
  }
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

function normalizeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) throw new Error('Affiliate URL is required.')
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function extractKeywords(parsed: ReturnType<typeof parseAffiliateUrl>) {
  const rawParts = decodeURIComponent(`${parsed.host} ${parsed.path}`)
    .replace(/\b(dp|gp|product|products|offer|hop|link|ref|tag|asin)\b/gi, ' ')
    .split(/[^a-z0-9]+/i)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 2 && !/^\d+$/.test(part))

  return Array.from(new Set(rawParts)).slice(0, 10)
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

function benefitsFromKeywords(keywords: string[]) {
  const topic = keywords[0] ? capitalize(keywords[0]) : 'Product'
  return [
    `${topic} recommendation with direct purchase intent`,
    'Useful for comparison and save-worthy shopping content',
    'Ready to pair with a clear Pinterest call to action',
  ]
}

function scoreFromKeywords(keywords: string[], baseline: number) {
  return Math.min(95, baseline + Math.min(keywords.length, 10))
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
