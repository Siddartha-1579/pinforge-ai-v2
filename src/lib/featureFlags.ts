import { defaultFeatureFlags } from './constants'
import type { FeatureFlags, UserSettings } from '../types'

export function getFeatureFlags(settings?: UserSettings): FeatureFlags {
  return {
    AUTO_PUBLISH: defaultFeatureFlags.AUTO_PUBLISH && Boolean(settings?.auto_publish_enabled),
    TREND_INTELLIGENCE: defaultFeatureFlags.TREND_INTELLIGENCE,
    ADVANCED_ANALYTICS: defaultFeatureFlags.ADVANCED_ANALYTICS,
  }
}

export function automationBlockedReason(settings: UserSettings, connected: boolean) {
  if (!defaultFeatureFlags.AUTO_PUBLISH) return 'AUTO_PUBLISH feature flag is disabled.'
  if (!settings.auto_publish_enabled) return 'Auto publishing is disabled in settings.'
  if (settings.emergency_stop) return 'Emergency stop is active.'
  if (settings.automation_paused) return 'Automation is paused.'
  if (!connected) return 'Pinterest account is not connected.'
  return null
}
