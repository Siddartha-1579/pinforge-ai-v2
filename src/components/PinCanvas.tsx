import { useEffect, useRef, useState } from 'react'
import { drawPinAsync } from '../lib/pinImage'
import type { GeneratedPin, Product } from '../types'

export function PinCanvas({ pin, product }: { pin: GeneratedPin; product?: Product }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [renderWarning, setRenderWarning] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    setRenderWarning(null)
    void drawPinAsync(context, pin, product).then((result) => {
      if (!cancelled) setRenderWarning(result.error ?? null)
    })

    return () => {
      cancelled = true
    }
  }, [pin, product])

  return (
    <>
      <canvas
        ref={canvasRef}
        width="1000"
        height="1500"
        className="aspect-[2/3] w-full rounded-lg border border-slate-200 bg-white dark:border-white/10"
      />
      {renderWarning ? <p className="mt-2 text-sm text-amber-700 dark:text-amber-200">{renderWarning} Using generated fallback artwork.</p> : null}
    </>
  )
}
