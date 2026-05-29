import type { GeneratedPin, Product } from '../types'

const palettes = {
  'Scandinavian Minimal': ['#f8fafc', '#111827', '#e11d48', '#e2e8f0'],
  'Premium Lifestyle': ['#0f172a', '#ffffff', '#d4af37', '#334155'],
  'High Contrast Ad': ['#ffffff', '#020617', '#dc2626', '#fde047'],
  'Wellness Aesthetic': ['#f0fdf4', '#14532d', '#16a34a', '#bbf7d0'],
  'Productivity Style': ['#eff6ff', '#1e3a8a', '#2563eb', '#bfdbfe'],
} as const

export interface PinRenderResult {
  imageLoaded: boolean
  fallbackUsed: boolean
  error?: string
}

export async function downloadPinPng(pin: GeneratedPin, product?: Product) {
  const canvas = document.createElement('canvas')
  canvas.width = 1000
  canvas.height = 1500
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not available in this browser.')

  await drawPinAsync(context, pin, product)
  const dataUrl = canvas.toDataURL('image/png')
  if (!dataUrl.startsWith('data:image/png')) throw new Error('PNG export failed.')
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `${safeFilename(pin.title)}.png`
  link.click()
}

export function drawPin(context: CanvasRenderingContext2D, pin: GeneratedPin, product?: Product) {
  const [background, text, accent, soft] = palettes[pin.style]
  drawBasePin(context, pin, product, { background, text, accent, soft })
  drawProductFallback(context, product, text, accent)
}

export async function drawPinAsync(context: CanvasRenderingContext2D, pin: GeneratedPin, product?: Product): Promise<PinRenderResult> {
  const [background, text, accent, soft] = palettes[pin.style]
  drawBasePin(context, pin, product, { background, text, accent, soft })

  if (!product?.product_image_url) {
    drawProductFallback(context, product, text, accent)
    return { imageLoaded: false, fallbackUsed: true }
  }

  try {
    const image = await loadImage(product.product_image_url)
    drawProductImage(context, image)
    return { imageLoaded: true, fallbackUsed: false }
  } catch (error) {
    drawProductFallback(context, product, text, accent)
    return {
      imageLoaded: false,
      fallbackUsed: true,
      error: error instanceof Error ? error.message : 'Product image could not be loaded.',
    }
  }
}

function drawBasePin(
  context: CanvasRenderingContext2D,
  pin: GeneratedPin,
  product: Product | undefined,
  palette: { background: string; text: string; accent: string; soft: string },
) {
  const { background, text, accent, soft } = palette
  context.clearRect(0, 0, 1000, 1500)
  context.fillStyle = background
  context.fillRect(0, 0, 1000, 1500)

  context.fillStyle = soft
  roundedRect(context, 90, 110, 820, 520, 40)
  context.fill()

  context.fillStyle = '#ffffff'
  roundedRect(context, 190, 205, 620, 330, 34)
  context.fill()

  context.strokeStyle = accent
  context.lineWidth = 10
  roundedRect(context, 220, 240, 560, 260, 28)
  context.stroke()

  context.fillStyle = text
  context.font = '700 54px Arial'
  wrapText(context, product?.name ?? 'Affiliate product', 260, 340, 480, 62, 3)

  context.fillStyle = accent
  roundedRect(context, 90, 700, 260, 58, 29)
  context.fill()
  context.fillStyle = '#ffffff'
  context.font = '700 28px Arial'
  fitText(context, product?.category ?? pin.style, 125, 739, 205)

  context.fillStyle = text
  context.font = '800 76px Arial'
  wrapText(context, pin.title, 90, 850, 820, 86, 3)

  context.fillStyle = text
  context.globalAlpha = 0.78
  context.font = '400 38px Arial'
  wrapText(context, pin.description, 90, 1130, 820, 48, 4)
  context.globalAlpha = 1

  context.fillStyle = accent
  roundedRect(context, 90, 1330, 820, 96, 48)
  context.fill()
  context.fillStyle = '#ffffff'
  context.font = '800 40px Arial'
  centerText(context, pin.cta, 500, 1392, 760)
}

function drawProductImage(context: CanvasRenderingContext2D, image: HTMLImageElement) {
  const frame = { x: 220, y: 240, width: 560, height: 260 }
  const scale = Math.max(frame.width / image.naturalWidth, frame.height / image.naturalHeight)
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  const x = frame.x + (frame.width - width) / 2
  const y = frame.y + (frame.height - height) / 2

  context.save()
  roundedRect(context, frame.x, frame.y, frame.width, frame.height, 28)
  context.clip()
  context.drawImage(image, x, y, width, height)
  context.restore()
}

function drawProductFallback(context: CanvasRenderingContext2D, product: Product | undefined, text: string, accent: string) {
  context.save()
  context.fillStyle = '#ffffff'
  roundedRect(context, 245, 265, 510, 210, 30)
  context.fill()
  context.fillStyle = accent
  roundedRect(context, 300, 305, 400, 92, 26)
  context.fill()
  context.fillStyle = text
  context.globalAlpha = 0.18
  context.beginPath()
  context.arc(330, 415, 50, 0, Math.PI * 2)
  context.fill()
  context.beginPath()
  context.arc(675, 300, 42, 0, Math.PI * 2)
  context.fill()
  context.globalAlpha = 1
  context.fillStyle = '#ffffff'
  context.font = '800 30px Arial'
  centerText(context, product?.brand ?? 'Product Pick', 500, 363, 340)
  context.fillStyle = text
  context.font = '700 32px Arial'
  wrapText(context, product?.name ?? 'Affiliate product', 310, 445, 380, 38, 2)
  context.restore()
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Product image could not be loaded.'))
    image.src = source
  })
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 6,
) {
  const words = text.split(' ')
  let line = ''
  let currentY = y
  let lines = 1

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(lines === maxLines ? truncateToWidth(context, `${line}...`, maxWidth) : line, x, currentY)
      if (lines === maxLines) return
      line = word
      currentY += lineHeight
      lines += 1
    } else {
      line = testLine
    }
  }

  context.fillText(truncateToWidth(context, line, maxWidth), x, currentY)
}

function centerText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number) {
  const output = truncateToWidth(context, text, maxWidth)
  context.fillText(output, x - context.measureText(output).width / 2, y)
}

function fitText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number) {
  context.fillText(truncateToWidth(context, text, maxWidth), x, y)
}

function truncateToWidth(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  let output = text
  while (context.measureText(output).width > maxWidth && output.length > 8) {
    output = `${output.slice(0, -4)}...`
  }
  return output
}

function safeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) || 'pinforge-pin'
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.arcTo(x + width, y, x + width, y + height, radius)
  context.arcTo(x + width, y + height, x, y + height, radius)
  context.arcTo(x, y + height, x, y, radius)
  context.arcTo(x, y, x + width, y, radius)
  context.closePath()
}
