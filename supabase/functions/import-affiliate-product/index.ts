import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

type AffiliateNetwork = 'Amazon' | 'ClickBank' | 'Impact' | 'CJ' | 'ShareASale' | 'Digistore24' | 'Other'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const networkMatchers: Array<{ network: AffiliateNetwork; patterns: string[] }> = [
  { network: 'Amazon', patterns: ['amazon.', 'amzn.to'] },
  { network: 'ClickBank', patterns: ['clickbank.net', 'clickbank.com'] },
  { network: 'Impact', patterns: ['impact.com', 'impactradius.com'] },
  { network: 'CJ', patterns: ['cj.com', 'anrdoezrs.net', 'jdoqocy.com', 'tkqlhce.com'] },
  { network: 'ShareASale', patterns: ['shareasale.com'] },
  { network: 'Digistore24', patterns: ['digistore24.com'] },
]

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { url } = await request.json()
    const sourceUrl = normalizeUrl(String(url ?? ''))
    const source = new URL(sourceUrl)
    let resolvedUrl = sourceUrl
    let html = ''
    let warning: string | null = null

    try {
      const response = await fetch(sourceUrl, {
        redirect: 'follow',
        headers: {
          'user-agent': 'PinForgeBot/2.0 (+https://pinforge.ai)',
          accept: 'text/html,application/xhtml+xml',
        },
      })
      resolvedUrl = response.url || sourceUrl
      const contentType = response.headers.get('content-type') ?? ''
      if (contentType.includes('text/html')) html = await response.text()
      if (!response.ok) warning = `Merchant page returned HTTP ${response.status}; fallback metadata was generated.`
    } catch (error) {
      warning = error instanceof Error ? error.message : 'Merchant page could not be reached; fallback metadata was generated.'
    }

    const resolved = new URL(resolvedUrl)
    const network = detectNetwork(source.host, resolved.host)
    const keywords = uniqueWords([
      ...wordsFromUrl(resolved),
      ...wordsFromText(metaValue(html, ['keywords'])),
      ...wordsFromText(metaValue(html, ['og:title', 'twitter:title']) || titleTag(html)),
    ]).slice(0, 10)
    const title = cleanText(metaValue(html, ['og:title', 'twitter:title']) || titleTag(html) || titleFromKeywords(keywords, network))
    const description = cleanText(metaValue(html, ['og:description', 'twitter:description', 'description']) || `${title} is a Pinterest-ready affiliate product recommendation.`)
    const brand = cleanText(metaValue(html, ['product:brand', 'og:site_name', 'application-name']) || brandFromHost(resolved.host))
    const image = absolutizeUrl(metaValue(html, ['og:image', 'twitter:image', 'image']), resolved)

    return Response.json(
      {
        source_url: sourceUrl,
        resolved_url: resolvedUrl,
        affiliate_url: sourceUrl,
        affiliate_network: network,
        host: resolved.host,
        title,
        description,
        features: featuresFromKeywords(keywords),
        benefits: benefitsFromKeywords(keywords),
        category: categoryFromNetwork(network),
        brand,
        product_image_url: image,
        keywords,
        hashtags: hashtagsFromKeywords(keywords),
        extraction_warning: warning,
      },
      { headers: corsHeaders },
    )
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Invalid affiliate import request.' },
      { status: 400, headers: corsHeaders },
    )
  }
})

function normalizeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) throw new Error('Affiliate URL is required.')
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function detectNetwork(...hosts: string[]): AffiliateNetwork {
  const normalized = hosts.join(' ').toLowerCase()
  return networkMatchers.find((matcher) => matcher.patterns.some((pattern) => normalized.includes(pattern)))?.network ?? 'Other'
}

function metaValue(html: string, names: string[]) {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const propertyFirst = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i')
    const contentFirst = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i')
    const match = html.match(propertyFirst) ?? html.match(contentFirst)
    if (match?.[1]) return decodeHtml(match[1])
  }

  return ''
}

function titleTag(html: string) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match?.[1] ? decodeHtml(match[1]) : ''
}

function wordsFromUrl(url: URL) {
  return decodeURIComponent(`${url.host} ${url.pathname} ${url.search}`)
    .replace(/\b(www|com|dp|gp|product|products|offer|hop|link|ref|tag|asin|utm|campaign|affiliate)\b/gi, ' ')
    .split(/[^a-z0-9]+/i)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 2 && !/^\d+$/.test(part))
}

function wordsFromText(value: string) {
  return value
    .split(/[^a-z0-9]+/i)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 2 && !/^\d+$/.test(part))
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
  return capitalize((host.replace(/^www\./, '').split('.')[0] || 'Merchant').replace(/[-_]+/g, ' '))
}

function cleanText(value: string) {
  return decodeHtml(value).replace(/\s+/g, ' ').trim().slice(0, 240)
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function absolutizeUrl(value: string, base: URL) {
  if (!value) return null
  try {
    return new URL(value, base).toString()
  } catch {
    return null
  }
}

function uniqueWords(words: string[]) {
  return Array.from(new Set(words.map((word) => word.trim().toLowerCase()).filter(Boolean)))
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
