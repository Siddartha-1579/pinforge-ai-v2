import type { AffiliateLink, GeneratedPin, Product } from '../types'

export interface PinValidationResult {
  ok: boolean
  messages: string[]
}

export function validatePinForUpload(pin: GeneratedPin, product?: Product, link?: AffiliateLink): PinValidationResult {
  const messages: string[] = []

  if (!product?.name) messages.push('Product is missing.')
  if (!link?.url) messages.push('Affiliate URL is missing.')
  if (!pin.title || pin.title.length < 12) messages.push('Title is too short.')
  if (!pin.description || pin.description.length < 40) messages.push('Description is too short.')
  if (!pin.cta || pin.cta.length < 4) messages.push('CTA is missing.')
  if (pin.title.length > 90) messages.push('Title may be too long for the pin layout.')
  if (pin.description.length > 220) messages.push('Description may overflow the pin layout.')
  if (pin.cta.length > 42) messages.push('CTA may be too long for the button.')

  return {
    ok: messages.length === 0,
    messages,
  }
}
