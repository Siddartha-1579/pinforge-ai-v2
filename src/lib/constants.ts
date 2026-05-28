import type { AffiliateLink, AnalyticsEvent, FeatureFlags, GeneratedPin, PinQueueItem, PinStyle, PinterestAccount, Product, PublishingJob, TrendIntelligence, UploadLog, UploadSession, UserSettings } from '../types'

export const pinStyles: PinStyle[] = [
  'Scandinavian Minimal',
  'Premium Lifestyle',
  'High Contrast Ad',
  'Wellness Aesthetic',
  'Productivity Style',
]

export const defaultSettings: UserSettings = {
  global_pin_instructions:
    'Keep pins useful, honest, and focused on clear benefits. Avoid unsupported claims.',
  brand_tone: 'Helpful',
  cta_preferences: 'Save this idea, Shop the product, Try it this week',
  visual_style_preferences: 'Bright product-first layouts with readable typography',
  content_guidelines: 'Use affiliate disclosures where appropriate and avoid misleading urgency.',
  auto_publish_enabled: false,
  max_pins_per_day: 5,
  upload_time_windows: '09:00-11:00, 16:00-18:00',
  retry_limits: 2,
  publishing_delay_minutes: 15,
  queue_priority: 'Oldest First',
  automation_paused: false,
  emergency_stop: false,
}

export const defaultFeatureFlags: FeatureFlags = {
  AUTO_PUBLISH: import.meta.env.VITE_FEATURE_AUTO_PUBLISH === 'true',
  TREND_INTELLIGENCE: import.meta.env.VITE_FEATURE_TREND_INTELLIGENCE === 'true',
  ADVANCED_ANALYTICS: import.meta.env.VITE_FEATURE_ADVANCED_ANALYTICS === 'true',
}

export const demoProducts: Product[] = [
  {
    id: 'demo-1',
    name: 'Foldable under-desk walking pad',
    category: 'Home Office Fitness',
    price_range: '$180-$320',
    virality_score: 91,
    competition_level: 'Medium',
    affiliate_potential: 88,
    trend_reasoning:
      'Work-from-home buyers are saving compact wellness upgrades that solve sedentary routines.',
    target_audience: 'Remote workers, productivity creators, apartment dwellers',
  },
  {
    id: 'demo-2',
    name: 'Cordless electric milk frother set',
    category: 'Kitchen',
    price_range: '$25-$55',
    virality_score: 83,
    competition_level: 'Low',
    affiliate_potential: 76,
    trend_reasoning:
      'Cafe-at-home content performs well because it is visual, affordable, and easy to recreate.',
    target_audience: 'Coffee lovers, college students, budget lifestyle shoppers',
  },
  {
    id: 'demo-3',
    name: 'Clear acrylic drawer organizers',
    category: 'Home Organization',
    price_range: '$18-$45',
    virality_score: 79,
    competition_level: 'High',
    affiliate_potential: 72,
    trend_reasoning:
      'Before-and-after organization pins keep strong save intent despite crowded competition.',
    target_audience: 'Renters, beauty enthusiasts, pantry organization audiences',
  },
]

export const demoLinks: AffiliateLink[] = [
  {
    id: 'link-demo-1',
    product_id: 'demo-1',
    product_name: 'Foldable under-desk walking pad',
    network: 'Amazon',
    url: 'https://amazon.com/example-walking-pad?tag=yourtag-20',
    notes: 'Replace with approved affiliate URL.',
  },
]

export const demoPins: GeneratedPin[] = [
  {
    id: 'pin-demo-1',
    product_id: 'demo-1',
    affiliate_link_id: 'link-demo-1',
    style: 'Scandinavian Minimal',
    title: 'A small-space way to move more at your desk',
    description:
      'Turn long work blocks into gentle movement with a foldable walking pad made for compact home offices.',
    cta: 'Save this desk setup',
    emotional_trigger: 'Feel energized without leaving your workflow.',
    marketing_angle: 'Problem-solution for sedentary workdays',
    uploaded: false,
    status: 'Ready',
  },
]

export const demoQueue: PinQueueItem[] = [
  {
    id: 'queue-demo-1',
    pin_id: 'pin-demo-1',
    product_id: 'demo-1',
    affiliate_link_id: 'link-demo-1',
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    status: 'Scheduled',
  },
]

export const demoSessions: UploadSession[] = [
  {
    id: 'session-demo-1',
    name: 'Launch batch',
    status: 'Active',
    pin_ids: ['pin-demo-1'],
    uploaded_count: 0,
    pending_count: 1,
    created_at: new Date().toISOString(),
  },
]

export const demoEvents: AnalyticsEvent[] = [
  {
    id: 'event-demo-1',
    event_type: 'pin_generated',
    pin_id: 'pin-demo-1',
    product_id: 'demo-1',
    created_at: new Date().toISOString(),
  },
]

export const demoPinterestAccounts: PinterestAccount[] = []
export const demoPublishingJobs: PublishingJob[] = []
export const demoUploadLogs: UploadLog[] = [
  {
    id: 'log-demo-1',
    level: 'info',
    message: 'Automation is disabled by default. Manual workflows remain active.',
    created_at: new Date().toISOString(),
  },
]

export const demoTrendHistory: TrendIntelligence[] = [
  {
    id: 'trend-demo-1',
    query: 'home office upgrades',
    product_name: 'Foldable under-desk walking pad',
    opportunity_score: 88,
    competition_estimate: 'Medium',
    evergreen: true,
    reasoning: 'Evergreen wellness and remote-work content with seasonal refresh potential.',
    created_at: new Date().toISOString(),
  },
]
