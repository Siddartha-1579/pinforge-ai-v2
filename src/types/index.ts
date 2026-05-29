export type CompetitionLevel = 'Low' | 'Medium' | 'High'

export type PinStyle =
  | 'Scandinavian Minimal'
  | 'Premium Lifestyle'
  | 'High Contrast Ad'
  | 'Wellness Aesthetic'
  | 'Productivity Style'

export type BrandTone = 'Helpful' | 'Premium' | 'Warm' | 'Bold' | 'Minimal'
export type PinStatus = 'Draft' | 'Ready' | 'Scheduled' | 'Published' | 'Failed'
export type SessionStatus = 'Active' | 'Completed' | 'Archived'
export type PublishingStatus = 'Pending' | 'Processing' | 'Published' | 'Failed' | 'Retrying'
export type QueuePriority = 'Oldest First' | 'Newest First' | 'Highest Affiliate Potential'
export type AffiliateNetwork = 'Amazon' | 'ClickBank' | 'Impact' | 'CJ' | 'ShareASale' | 'Digistore24' | 'Other'

export interface Product {
  id: string
  user_id?: string
  name: string
  category: string
  price_range: string
  virality_score: number
  competition_level: CompetitionLevel
  affiliate_potential: number
  trend_reasoning: string
  target_audience: string
  affiliate_url?: string | null
  affiliate_network?: AffiliateNetwork | null
  import_source_url?: string | null
  resolved_url?: string | null
  short_description?: string | null
  brand?: string | null
  features?: string[] | null
  benefits?: string[] | null
  keywords?: string[] | null
  hashtags?: string[] | null
  product_image_url?: string | null
  created_at?: string
}

export interface AffiliateLink {
  id: string
  user_id?: string
  product_id?: string | null
  product_name: string
  network: AffiliateNetwork
  url: string
  notes?: string | null
  created_at?: string
}

export interface GeneratedPin {
  id: string
  user_id?: string
  product_id?: string | null
  affiliate_link_id?: string | null
  affiliate_url?: string | null
  style: PinStyle
  title: string
  description: string
  cta: string
  emotional_trigger: string
  marketing_angle: string
  keywords?: string[] | null
  hashtags?: string[] | null
  image_data_url?: string | null
  uploaded: boolean
  status?: PinStatus
  notes?: string | null
  pinterest_url?: string | null
  published_at?: string | null
  created_at?: string
}

export interface UserSettings {
  id?: string
  user_id?: string
  global_pin_instructions: string
  brand_tone: BrandTone
  cta_preferences: string
  visual_style_preferences: string
  content_guidelines: string
  auto_publish_enabled?: boolean
  max_pins_per_day?: number
  upload_time_windows?: string
  retry_limits?: number
  publishing_delay_minutes?: number
  queue_priority?: QueuePriority
  automation_paused?: boolean
  emergency_stop?: boolean
}

export interface PinCopy {
  style: PinStyle
  title: string
  description: string
  cta: string
  emotional_trigger: string
  marketing_angle: string
  keywords?: string[]
  hashtags?: string[]
}

export interface PinQueueItem {
  id: string
  user_id?: string
  pin_id: string
  product_id?: string | null
  affiliate_link_id?: string | null
  affiliate_url?: string | null
  scheduled_at?: string | null
  status: PinStatus
  notes?: string | null
  created_at?: string
}

export interface UploadSession {
  id: string
  user_id?: string
  name: string
  status: SessionStatus
  pin_ids: string[]
  uploaded_count: number
  pending_count: number
  created_at?: string
  completed_at?: string | null
}

export interface AnalyticsEvent {
  id: string
  user_id?: string
  event_type: string
  pin_id?: string | null
  product_id?: string | null
  metadata?: Record<string, unknown>
  created_at?: string
}

export interface FeatureFlags {
  AUTO_PUBLISH: boolean
  TREND_INTELLIGENCE: boolean
  ADVANCED_ANALYTICS: boolean
}

export interface PinterestAccount {
  id: string
  user_id?: string
  pinterest_user_id?: string | null
  username?: string | null
  display_name?: string | null
  connected: boolean
  token_expires_at?: string | null
  last_refreshed_at?: string | null
  created_at?: string
}

export interface OAuthTokenStatus {
  id: string
  user_id?: string
  provider: 'pinterest'
  account_id?: string | null
  expires_at?: string | null
  revoked: boolean
  created_at?: string
}

export interface PublishingJob {
  id: string
  user_id?: string
  queue_item_id: string
  pin_id: string
  status: PublishingStatus
  retry_count: number
  max_retries: number
  last_error?: string | null
  started_at?: string | null
  completed_at?: string | null
  created_at?: string
}

export interface UploadLog {
  id: string
  user_id?: string
  job_id?: string | null
  pin_id?: string | null
  level: 'info' | 'warn' | 'error'
  message: string
  metadata?: Record<string, unknown>
  created_at?: string
}

export interface TrendIntelligence {
  id: string
  user_id?: string
  query: string
  product_name: string
  opportunity_score: number
  competition_estimate: CompetitionLevel
  evergreen: boolean
  reasoning: string
  created_at?: string
}
