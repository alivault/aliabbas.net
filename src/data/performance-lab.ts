/**
 * Lab measurements, taken by hand. Each set says how and when it was
 * measured. Do not edit a number without measuring it again.
 */

export type LighthouseResult = {
  label: string
  url: string
  score: number
  lcpMs: number
  fcpMs: number
  cls: number
  /** Null where the test machine makes the number meaningless. */
  tbtMs: number | null
  note?: string
}

/**
 * Lighthouse 12.8.2, mobile preset (Moto G Power, simulated slow 4G, 4×
 * CPU slowdown), headless Chromium, against the live sites. Median of three
 * runs per URL. The aliabbas.net rows marked "before" ran before the LCP fix
 * below shipped; the "after" rows ran on the same day, after it shipped.
 * The after runs blocked /api/vitals, so lab loads are not counted as real
 * visits.
 */
export const liveLighthouse = {
  measuredOn: '2026-10-28',
  tool: 'Lighthouse 12.8.2, mobile preset, median of 3 runs',
  results: [
    {
      label: 'aliabbas.net — home, before',
      url: 'https://aliabbas.net/',
      score: 30,
      lcpMs: 6451,
      fcpMs: 4060,
      cls: 0.004,
      tbtMs: null,
      note: 'The test machine has no GPU, so the WebGL globe draws in software and blocks the main thread. That blocking time describes the test machine, not a phone, and it also slows the simulated LCP.',
    },
    {
      label: 'aliabbas.net — home, after',
      url: 'https://aliabbas.net/',
      score: 31,
      lcpMs: 5881,
      fcpMs: 3725,
      cls: 0.003,
      tbtMs: null,
      note: 'The same note about the globe applies.',
    },
    {
      label: 'aliabbas.net — chat, before',
      url: 'https://aliabbas.net/chat',
      score: 72,
      lcpMs: 4425,
      fcpMs: 4350,
      cls: 0,
      tbtMs: 0,
    },
    {
      label: 'aliabbas.net — chat, after',
      url: 'https://aliabbas.net/chat',
      score: 85,
      lcpMs: 3494,
      fcpMs: 3125,
      cls: 0,
      tbtMs: 44,
    },
    {
      label: 'aliabbas.net — work, after',
      url: 'https://aliabbas.net/work',
      score: 87,
      lcpMs: 3240,
      fcpMs: 2940,
      cls: 0.017,
      tbtMs: 12,
    },
    {
      label: 'aliabbas.net — skills, after',
      url: 'https://aliabbas.net/skills',
      score: 86,
      lcpMs: 3252,
      fcpMs: 3102,
      cls: 0,
      tbtMs: 16,
    },
    {
      label: 'Pico',
      url: 'https://pico.aliabbas.net/',
      score: 94,
      lcpMs: 2900,
      fcpMs: 1748,
      cls: 0,
      tbtMs: 0,
    },
    {
      label: 'Whimcall',
      url: 'https://whimcall.com/',
      score: 87,
      lcpMs: 3235,
      fcpMs: 2635,
      cls: 0,
      tbtMs: 0,
    },
  ] satisfies Array<LighthouseResult>,
}

export type FixResult = {
  path: string
  beforeLcpMs: number
  afterLcpMs: number
  beforeFcpMs: number
  afterFcpMs: number
}

/**
 * The LCP fix, before and after, in the same conditions: both production
 * builds served by the local Workers runtime (no compression, so slower than
 * live), headless Chromium with real throttling through the DevTools
 * protocol (150 ms latency, 1.6 Mbps down, 4× CPU slowdown, 412 × 823
 * mobile viewport, cache off). LCP and FCP from the browser's own
 * PerformanceObserver. Median of three loads per page.
 */
export const lcpFix = {
  measuredOn: '2026-10-28',
  results: [
    {
      path: '/',
      beforeLcpMs: 10356,
      afterLcpMs: 5520,
      beforeFcpMs: 4620,
      afterFcpMs: 4700,
    },
    {
      path: '/chat',
      beforeLcpMs: 7968,
      afterLcpMs: 5292,
      beforeFcpMs: 4504,
      afterFcpMs: 4572,
    },
    {
      path: '/work',
      beforeLcpMs: 6864,
      afterLcpMs: 4096,
      beforeFcpMs: 3628,
      afterFcpMs: 3620,
    },
    {
      path: '/skills',
      beforeLcpMs: 5432,
      afterLcpMs: 3976,
      beforeFcpMs: 3480,
      afterFcpMs: 3504,
    },
  ] satisfies Array<FixResult>,
}

export type DownloadRow = {
  label: string
  before: string
  after: string
  /** Signed change, for example "−64%". Absent when a percent says nothing. */
  change?: string
}

/**
 * Averno asset fix, before and after (averno-game commit 37473c6).
 * Download sizes: the live game at averno.aliabbas.net, headless Chromium on
 * an M1 Max, empty cache, bytes over the network from the DevTools protocol,
 * 3 runs per profile (all 3 the same to within 1 KB). "Before" ran on the
 * same day, before the deploy. Desktop is the high quality profile; the
 * phone is an emulated touch device, which starts on medium quality.
 * Repeat visit: the same browser loads the page again. "Before" ran the old
 * commit in the local Workers runtime, which sends Cloudflare's default
 * asset headers (max-age=0, must-revalidate, ETag); "after" is live.
 * Requests do not include Cloudflare's analytics beacon.
 */
export const avernoFix = {
  measuredOn: '2026-10-27',
  results: [
    { label: 'Models', before: '1,405 KB', after: '507 KB', change: '−64%' },
    {
      label: 'JavaScript',
      before: '393 KB',
      after: '409 KB',
      change: '+4%',
    },
    {
      label: 'First visit, desktop',
      before: '2,762 KB',
      after: '1,877 KB',
      change: '−32%',
    },
    {
      label: 'First visit, phone',
      before: '2,318 KB',
      after: '1,429 KB',
      change: '−38%',
    },
    {
      label: 'Repeat visit, requests to the server',
      before: '40',
      after: '2',
    },
  ] satisfies Array<DownloadRow>,
}
