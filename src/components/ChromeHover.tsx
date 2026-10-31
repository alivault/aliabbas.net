import { useEffect } from 'react'
import { startChromeHover } from '~/lib/chrome-shader'

/** Starts the thin-film chrome hover of primary buttons. Renders nothing. */
export default function ChromeHover() {
  useEffect(() => startChromeHover(), [])
  return null
}
