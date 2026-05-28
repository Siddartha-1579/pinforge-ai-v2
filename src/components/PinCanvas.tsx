import { useEffect, useRef } from 'react'
import { drawPin } from '../lib/pinImage'
import type { GeneratedPin, Product } from '../types'

export function PinCanvas({ pin, product }: { pin: GeneratedPin; product?: Product }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    drawPin(context, pin, product)
  }, [pin, product])

  return (
    <canvas
      ref={canvasRef}
      width="1000"
      height="1500"
      className="aspect-[2/3] w-full rounded-lg border border-slate-200 bg-white dark:border-white/10"
    />
  )
}
