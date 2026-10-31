import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Cloudflare Turnstile, the human check of the contact form. The widget
 * runs in the background and shows a checkbox only when Cloudflare is not
 * sure. The server verifies the token (see src/lib/email.ts).
 */

const SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string
      appearance?: 'always' | 'execute' | 'interaction-only'
      theme?: 'auto' | 'light' | 'dark'
      size?: 'normal' | 'flexible' | 'compact'
      callback?: (token: string) => void
      'expired-callback'?: () => void
      'error-callback'?: () => void
    },
  ) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null

function loadScript() {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () =>
      window.turnstile
        ? resolve(window.turnstile)
        : reject(new Error('Turnstile did not load'))
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Turnstile did not load'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

export type TurnstileStatus = 'loading' | 'ready' | 'verified' | 'error'

/**
 * Renders the widget into the returned ref. `getToken` gives the token when
 * the check passes. Call `reset` after a send: a token works only once.
 */
export function useTurnstile(siteKey: string | undefined) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<string | null>(null)
  const apiRef = useRef<TurnstileApi | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [status, setStatus] = useState<TurnstileStatus>('loading')
  // The latest token and the sends that wait for one, for getToken.
  const tokenRef = useRef<string | null>(null)
  const waitersRef = useRef<Array<(value: string | null) => void>>([])

  const settle = useCallback((value: string | null) => {
    tokenRef.current = value
    setToken(value)
    if (value === null) return
    for (const resolve of waitersRef.current.splice(0)) resolve(value)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (!siteKey) {
      setStatus('error')
      return
    }
    let cancelled = false
    loadScript()
      .then((api) => {
        if (cancelled) return
        apiRef.current = api
        widgetRef.current = api.render(container, {
          sitekey: siteKey,
          appearance: 'interaction-only',
          theme: 'auto',
          size: 'flexible',
          callback: (value) => {
            settle(value)
            setStatus('verified')
          },
          'expired-callback': () => {
            settle(null)
            setStatus('ready')
          },
          'error-callback': () => {
            settle(null)
            setStatus('error')
            for (const resolve of waitersRef.current.splice(0)) resolve(null)
          },
        })
        setStatus((current) => (current === 'loading' ? 'ready' : current))
      })
      .catch(() => {
        if (cancelled) return
        setStatus('error')
        for (const resolve of waitersRef.current.splice(0)) resolve(null)
      })
    return () => {
      cancelled = true
      if (widgetRef.current && apiRef.current) {
        apiRef.current.remove(widgetRef.current)
      }
      widgetRef.current = null
    }
  }, [siteKey, settle])

  const reset = useCallback(() => {
    settle(null)
    setStatus('ready')
    if (widgetRef.current && apiRef.current) {
      apiRef.current.reset(widgetRef.current)
    }
  }, [settle])

  /**
   * The token, or null when the check fails. When the check still runs,
   * this waits for it, up to `timeout` ms.
   */
  const getToken = useCallback((timeout = 15_000) => {
    if (tokenRef.current) return Promise.resolve(tokenRef.current)
    return new Promise<string | null>((resolve) => {
      const timer = window.setTimeout(() => {
        waitersRef.current = waitersRef.current.filter((w) => w !== waiter)
        resolve(null)
      }, timeout)
      const waiter = (value: string | null) => {
        window.clearTimeout(timer)
        resolve(value)
      }
      waitersRef.current.push(waiter)
    })
  }, [])

  return { containerRef, token, status, reset, getToken }
}
