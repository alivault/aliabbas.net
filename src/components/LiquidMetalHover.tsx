import { useEffect } from 'react'
import { startLiquidMetal } from '~/lib/liquid-metal'

/** Starts the liquid metal hover of primary buttons. Renders nothing. */
export default function LiquidMetalHover() {
  useEffect(() => startLiquidMetal(), [])
  return null
}
