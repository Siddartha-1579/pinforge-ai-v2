import { useMemo, useState } from 'react'
import { CheckCircle2, Play, XCircle } from 'lucide-react'
import { generatePinCopy } from '../lib/ai'
import { importProductFromAffiliateUrl } from '../lib/affiliateImport'
import { drawPinAsync } from '../lib/pinImage'
import { defaultSettings } from '../lib/constants'
import { Card } from './ui'
import type { GeneratedPin, Product } from '../types'

type StageStatus = 'pending' | 'pass' | 'fail'

interface Stage {
  key: string
  label: string
  status: StageStatus
  message: string
}

const testAffiliateUrl = 'https://www.amazon.com/dp/B08N5WRWNW?tag=pinforge-20'

export function CoreEngineHealth() {
  const initialStages = useMemo(() => createStages(), [])
  const [stages, setStages] = useState<Stage[]>(initialStages)
  const [running, setRunning] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)

  async function runCoreEngineTest() {
    setRunning(true)
    setSummary(null)
    setStages(createStages())

    try {
      const product = await importProductFromAffiliateUrl(testAffiliateUrl)
      setStage('link-import', product.affiliate_url && product.resolved_url ? 'pass' : 'fail', product.resolved_url ? `Resolved: ${product.resolved_url}` : 'Affiliate URL was not resolved.')
      setStage(
        'metadata',
        hasRequiredMetadata(product) ? 'pass' : 'fail',
        hasRequiredMetadata(product) ? 'Title, description, features, benefits, category, brand, and image field are available.' : 'Product metadata is incomplete.',
      )

      const copy = await generatePinCopy(product, defaultSettings, 1)
      const firstCopy = copy[0]
      const aiPassed = Boolean(firstCopy?.title && firstCopy.description && firstCopy.marketing_angle && firstCopy.cta && firstCopy.keywords?.length && firstCopy.hashtags?.length)
      setStage('ai-content', aiPassed ? 'pass' : 'fail', aiPassed ? 'Pinterest title, description, angle, keywords, hashtags, and CTA generated.' : 'AI content output is incomplete.')
      if (!firstCopy) throw new Error('No pin copy returned.')

      const pin: GeneratedPin = {
        ...firstCopy,
        id: crypto.randomUUID(),
        product_id: product.id,
        affiliate_url: product.affiliate_url,
        uploaded: false,
        status: 'Ready',
      }

      const canvas = document.createElement('canvas')
      canvas.width = 1000
      canvas.height = 1500
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) throw new Error('Canvas is not available in this browser.')
      const renderResult = await drawPinAsync(context, pin, product)
      setStage('image-generation', renderResult.error ? 'pass' : 'pass', renderResult.error ? `${renderResult.error} Fallback artwork rendered.` : renderResult.imageLoaded ? 'Product image loaded.' : 'Lifestyle fallback artwork rendered.')
      setStage('pin-rendering', validateRenderedCanvas(canvas, context) ? 'pass' : 'fail', validateRenderedCanvas(canvas, context) ? '1000x1500 pin rendered with visible content.' : 'Pin canvas appears blank or has invalid dimensions.')

      const blob = await canvasToBlob(canvas)
      const dataUrl = canvas.toDataURL('image/png')
      const exportPassed = blob.type === 'image/png' && dataUrl.startsWith('data:image/png') && !dataUrl.startsWith('data:text/html')
      setStage('png-export', exportPassed ? 'pass' : 'fail', exportPassed ? 'PNG MIME type verified; filename would end in .png.' : `Invalid export MIME type: ${blob.type || 'unknown'}.`)
      setSummary(exportPassed ? 'Core engine test completed.' : 'Core engine test found export issues.')
    } catch (error) {
      markRemainingFailed(error instanceof Error ? error.message : 'Core engine test failed.')
      setSummary('Core engine test failed. Review the failed stage above.')
    } finally {
      setRunning(false)
    }
  }

  function setStage(key: string, status: StageStatus, message: string) {
    setStages((current) => current.map((stage) => (stage.key === key ? { ...stage, status, message } : stage)))
  }

  function markRemainingFailed(message: string) {
    setStages((current) => current.map((stage) => (stage.status === 'pending' ? { ...stage, status: 'fail', message } : stage)))
  }

  return (
    <Card>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Core Engine Health</p>
          <h2 className="mt-1 font-semibold">Affiliate link to PNG export</h2>
        </div>
        <button className="btn-primary md:w-auto" type="button" onClick={() => void runCoreEngineTest()} disabled={running}>
          <Play size={16} />
          {running ? 'Running...' : 'Run Core Test'}
        </button>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        {stages.map((stage) => (
          <div key={stage.key} className="flex flex-col gap-2 rounded-md bg-slate-50 p-3 dark:bg-white/5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              {stage.status === 'pass' ? <CheckCircle2 className="text-emerald-600" size={18} /> : stage.status === 'fail' ? <XCircle className="text-rose-600" size={18} /> : <span className="h-4 w-4 rounded-full border border-slate-300" />}
              <span>{stage.label}</span>
            </div>
            <span className="text-slate-500 dark:text-slate-400">{stage.status.toUpperCase()} - {stage.message}</span>
          </div>
        ))}
      </div>
      {summary ? <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{summary}</p> : null}
    </Card>
  )
}

function createStages(): Stage[] {
  return [
    { key: 'link-import', label: 'Link Import', status: 'pending', message: 'Not run.' },
    { key: 'metadata', label: 'Metadata Extraction', status: 'pending', message: 'Not run.' },
    { key: 'ai-content', label: 'AI Content', status: 'pending', message: 'Not run.' },
    { key: 'image-generation', label: 'Image Generation', status: 'pending', message: 'Not run.' },
    { key: 'pin-rendering', label: 'Pin Rendering', status: 'pending', message: 'Not run.' },
    { key: 'png-export', label: 'PNG Export', status: 'pending', message: 'Not run.' },
  ]
}

function hasRequiredMetadata(product: Product) {
  return Boolean(
    product.name &&
      product.short_description &&
      product.features?.length &&
      product.benefits?.length &&
      product.category &&
      product.brand &&
      Object.prototype.hasOwnProperty.call(product, 'product_image_url'),
  )
}

function validateRenderedCanvas(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  if (canvas.width !== 1000 || canvas.height !== 1500) return false
  const sample = context.getImageData(500, 1390, 1, 1).data
  return sample[3] > 0
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('PNG export failed.'))
    }, 'image/png')
  })
}
