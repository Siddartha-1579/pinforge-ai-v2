import type { GeneratedPin, Product } from '../types'

const palettes = {
  'Scandinavian Minimal': ['#f8fafc', '#111827', '#e11d48', '#e2e8f0'],
  'Premium Lifestyle': ['#0f172a', '#ffffff', '#d4af37', '#334155'],
  'High Contrast Ad': ['#ffffff', '#020617', '#dc2626', '#fde047'],
  'Wellness Aesthetic': ['#f0fdf4', '#14532d', '#16a34a', '#bbf7d0'],
  'Productivity Style': ['#eff6ff', '#1e3a8a', '#2563eb', '#bfdbfe'],
} as const

export function downloadPinPng(pin: GeneratedPin, product?: Product) {
  const canvas = document.createElement('canvas')
  canvas.width = 1000
  canvas.height = 1500
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not available in this browser.')

  drawPin(context, pin, product)
  const dataUrl = canvas.toDataURL('image/png')
  if (!dataUrl.startsWith('data:image/png')) throw new Error('PNG export failed.')
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `${safeFilename(pin.title)}.png`
  link.click()
}

export function drawPin(context: CanvasRenderingContext2D, pin: GeneratedPin, product?: Product) {
  const [background, text, accent, soft] = palettes[pin.style]
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
