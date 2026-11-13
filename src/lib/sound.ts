/**
 * All sound of the site, made with Web Audio: no files to load.
 *
 * Music plays under the world: one of five vibes (vibes.ts), which the
 * visitor can change in the HUD. Each interactive element plays a short
 * sound. Browsers start audio only after a gesture, so `start()` must run in
 * a click or a key handler. The choice (on or off) is saved.
 */

import { VIBES } from './vibes'

export type SoundName =
  | 'hover'
  | 'click'
  | 'portal-in'
  | 'portal-out'
  | 'type'
  | 'send'
  | 'toggle'
  | 'step'
  | 'dash'

const ENABLED_KEY = 'sound:enabled'
const VIBE_KEY = 'sound:vibe'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let sfxBus: GainNode | null = null
let droneFilter: BiquadFilterNode | null = null
let droneGain: GainNode | null = null
let reverb: ConvolverNode | null = null
let enabled = false
const listeners = new Set<(on: boolean) => void>()

/** The saved choice: true, false, or null when the visitor has not chosen. */
export function savedChoice(): boolean | null {
  try {
    const value = localStorage.getItem(ENABLED_KEY)
    return value === null ? null : value === '1'
  } catch {
    return null
  }
}

export function isSoundOn() {
  return enabled
}

export function onSoundChange(listener: (on: boolean) => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** A reverb tail made from decaying noise. */
function makeImpulse(context: AudioContext, seconds: number) {
  const length = Math.floor(context.sampleRate * seconds)
  const impulse = context.createBuffer(2, length, context.sampleRate)
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.6)
    }
  }
  return impulse
}

function noiseBuffer(context: AudioContext, seconds: number) {
  const buffer = context.createBuffer(
    1,
    Math.floor(context.sampleRate * seconds),
    context.sampleRate,
  )
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

function setup() {
  if (ctx) return ctx
  const AudioCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext
  ctx = new AudioCtor()
  master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  reverb = ctx.createConvolver()
  // A room, not a cave: a short tail keeps the drone light.
  reverb.buffer = makeImpulse(ctx, 2.8)
  const wet = ctx.createGain()
  wet.gain.value = 0.4
  reverb.connect(wet).connect(master)

  sfxBus = ctx.createGain()
  sfxBus.gain.value = 0.5
  sfxBus.connect(master)
  sfxBus.connect(reverb)

  buildMusicBus(ctx)
  watchVisibility(ctx)
  return ctx
}

/** The level of the sound while it plays. */
const LEVEL = 0.9

let suspendTimer = 0

/**
 * When the visitor leaves the page (another tab, a minimized window, a
 * navigation away), the sound fades out over about a second, then the
 * audio stops to save power. It fades back in when the page shows again.
 */
function watchVisibility(context: AudioContext) {
  const leave = () => {
    if (!master) return
    master.gain.cancelScheduledValues(context.currentTime)
    master.gain.setTargetAtTime(0, context.currentTime, 0.3)
    window.clearTimeout(suspendTimer)
    suspendTimer = window.setTimeout(() => void context.suspend(), 1500)
  }
  const back = () => {
    window.clearTimeout(suspendTimer)
    if (!enabled || !master) return
    void context.resume()
    master.gain.cancelScheduledValues(context.currentTime)
    master.gain.setTargetAtTime(LEVEL, context.currentTime, 0.8)
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') leave()
    else back()
  })
  window.addEventListener('pagehide', leave)
  window.addEventListener('pageshow', back)
}

/** The vibe that plays, and the way to stop it. */
let vibeIndex = 0
let stopVibe: (() => void) | null = null
let vibeCutoff = VIBES[0].cutoff
let noise: AudioBuffer | null = null
const vibeListeners = new Set<(index: number) => void>()

/**
 * The shared output of the music: one low-pass filter that opens near a
 * page, then a level, to the master and the reverb.
 */
function buildMusicBus(context: AudioContext) {
  droneGain = context.createGain()
  droneGain.gain.value = 0.25
  droneFilter = context.createBiquadFilter()
  droneFilter.type = 'lowpass'
  droneFilter.Q.value = 0.5
  droneFilter.connect(droneGain)
  droneGain.connect(master!)
  droneGain.connect(reverb!)
  noise = noiseBuffer(context, 2)
  vibeIndex = savedVibe()
  stopVibe = startVibe(context, vibeIndex)
}

/** Starts a vibe with a fade in. Returns a function that fades it out. */
function startVibe(context: AudioContext, index: number) {
  const vibe = VIBES[index]
  const fade = context.createGain()
  fade.gain.value = 0
  fade.connect(droneFilter!)
  const space = context.createGain()
  space.gain.value = 0
  space.connect(reverb!)
  const stop = vibe.build({
    context,
    out: fade,
    space,
    noise: noise!,
    audible: () => enabled,
  })
  const now = context.currentTime
  fade.gain.setTargetAtTime(vibe.level, now, 0.8)
  space.gain.setTargetAtTime(0.6, now, 0.8)
  vibeCutoff = vibe.cutoff
  droneFilter!.frequency.setTargetAtTime(vibe.cutoff, now, 0.5)
  return () => {
    const at = context.currentTime
    fade.gain.setTargetAtTime(0, at, 0.5)
    space.gain.setTargetAtTime(0, at, 0.5)
    window.setTimeout(() => {
      stop()
      fade.disconnect()
      space.disconnect()
    }, 3000)
  }
}

function savedVibe() {
  try {
    const value = Number(localStorage.getItem(VIBE_KEY))
    return Number.isInteger(value) && value >= 0 && value < VIBES.length
      ? value
      : 0
  } catch {
    return 0
  }
}

/** The names of the vibes, in order. */
export const VIBE_NAMES = VIBES.map((vibe) => vibe.name)

/** The vibe that plays, or the saved one before the audio starts. */
export function getVibe() {
  return ctx ? vibeIndex : savedVibe()
}

export function onVibeChange(listener: (index: number) => void) {
  vibeListeners.add(listener)
  return () => {
    vibeListeners.delete(listener)
  }
}

/** Moves to the next vibe (1) or the one before (-1), with a crossfade. */
export function stepVibe(direction: 1 | -1) {
  if (!ctx) vibeIndex = savedVibe()
  vibeIndex = (vibeIndex + direction + VIBES.length) % VIBES.length
  try {
    localStorage.setItem(VIBE_KEY, String(vibeIndex))
  } catch {
    // Private mode: the choice lasts for this visit only.
  }
  if (ctx && droneFilter) {
    stopVibe?.()
    stopVibe = startVibe(ctx, vibeIndex)
  }
  for (const listener of vibeListeners) listener(vibeIndex)
}

/** Turns sound on or off, and saves the choice. Call it in a gesture. */
export function setSound(on: boolean) {
  enabled = on
  try {
    localStorage.setItem(ENABLED_KEY, on ? '1' : '0')
  } catch {
    // Private mode: the choice lasts for this visit only.
  }
  if (on) {
    const context = setup()
    window.clearTimeout(suspendTimer)
    void context.resume()
    master!.gain.cancelScheduledValues(context.currentTime)
    master!.gain.setTargetAtTime(LEVEL, context.currentTime, 1.2)
  } else if (ctx && master) {
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.15)
  }
  for (const listener of listeners) listener(on)
}

/**
 * How close the visitor is to a sheet, 0 to 1. The drone opens up as a
 * sheet comes near, and most during a portal flight.
 */
export function setDroneOpen(amount: number) {
  if (!ctx || !droneFilter) return
  droneFilter.frequency.setTargetAtTime(
    vibeCutoff + amount * 1600,
    ctx.currentTime,
    0.4,
  )
}

function tone(
  context: AudioContext,
  {
    type = 'sine',
    from,
    to = from,
    at = 0,
    duration,
    volume,
  }: {
    type?: OscillatorType
    from: number
    to?: number
    at?: number
    duration: number
    volume: number
  },
) {
  const start = context.currentTime + at
  const osc = context.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(from, start)
  osc.frequency.exponentialRampToValueAtTime(to, start + duration)
  const gain = context.createGain()
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(sfxBus!)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

function noiseHit(
  context: AudioContext,
  {
    from,
    to = from,
    duration,
    volume,
    q = 1,
  }: {
    from: number
    to?: number
    duration: number
    volume: number
    q?: number
  },
) {
  const start = context.currentTime
  const source = context.createBufferSource()
  source.buffer = noiseBuffer(context, duration + 0.1)
  const filter = context.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = q
  filter.frequency.setValueAtTime(from, start)
  filter.frequency.exponentialRampToValueAtTime(to, start + duration)
  const gain = context.createGain()
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(volume, start + duration * 0.4)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  source.connect(filter).connect(gain).connect(sfxBus!)
  source.start(start)
}

let lastHover = 0

/** Plays one interaction sound. Does nothing while sound is off. */
export function play(name: SoundName) {
  if (!enabled || !ctx || ctx.state !== 'running') return
  const context = ctx
  switch (name) {
    case 'hover': {
      // Many hovers in a row would buzz.
      const now = performance.now()
      if (now - lastHover < 60) return
      lastHover = now
      tone(context, { from: 1320, to: 1250, duration: 0.07, volume: 0.05 })
      break
    }
    case 'click':
      tone(context, { from: 180, to: 70, duration: 0.14, volume: 0.35 })
      tone(context, {
        from: 2200,
        duration: 0.03,
        volume: 0.06,
        type: 'square',
      })
      break
    case 'toggle':
      tone(context, {
        from: 660,
        duration: 0.06,
        volume: 0.1,
        type: 'triangle',
      })
      tone(context, {
        from: 990,
        at: 0.07,
        duration: 0.08,
        volume: 0.1,
        type: 'triangle',
      })
      break
    case 'type':
      tone(context, {
        from: 2400 + Math.random() * 600,
        duration: 0.02,
        volume: 0.035,
        type: 'square',
      })
      break
    case 'send':
      tone(context, { from: 440, to: 880, duration: 0.18, volume: 0.15 })
      noiseHit(context, { from: 900, to: 4000, duration: 0.25, volume: 0.08 })
      break
    case 'step':
      noiseHit(context, {
        from: 300,
        to: 150,
        duration: 0.12,
        volume: 0.06,
        q: 2,
      })
      break
    case 'dash':
      // A rush of air: noise that rises and falls, over a low thump.
      noiseHit(context, {
        from: 300,
        to: 2600,
        duration: 0.6,
        volume: 0.16,
        q: 1.4,
      })
      tone(context, { from: 95, to: 55, duration: 0.45, volume: 0.14 })
      break
    case 'portal-in':
      noiseHit(context, {
        from: 200,
        to: 5000,
        duration: 1.3,
        volume: 0.22,
        q: 3,
      })
      tone(context, {
        from: 110,
        to: 440,
        duration: 1.4,
        volume: 0.18,
        type: 'triangle',
      })
      tone(context, { from: 55, to: 55, at: 1.2, duration: 1.6, volume: 0.3 })
      break
    case 'portal-out':
      noiseHit(context, {
        from: 5000,
        to: 200,
        duration: 1.1,
        volume: 0.2,
        q: 3,
      })
      tone(context, {
        from: 440,
        to: 110,
        duration: 1.2,
        volume: 0.15,
        type: 'triangle',
      })
      break
  }
}

const INTERACTIVE =
  'a[href], button, [role="button"], [role="tab"], [role="menuitem"], [role="switch"], input[type="checkbox"], input[type="radio"], select, summary, label[for]'

/**
 * Gives every interactive element of the page a hover and a click sound.
 * An element with `data-sound="none"` (or inside one) stays silent; one
 * with its own sound sets `data-sound` to that sound.
 */
export function installInteractionSounds() {
  let hovered: Element | null = null
  const soundOf = (element: Element): SoundName | null => {
    const owner = element.closest('[data-sound]')
    const value = owner?.getAttribute('data-sound')
    if (value === 'none') return null
    return (value as SoundName | null) ?? 'click'
  }
  const onOver = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    const element = (event.target as Element | null)?.closest(INTERACTIVE)
    if (!element || element === hovered) return
    hovered = element
    if (soundOf(element)) play('hover')
  }
  const onOut = (event: PointerEvent) => {
    const element = (event.target as Element | null)?.closest(INTERACTIVE)
    if (element === hovered) hovered = null
  }
  const onClick = (event: MouseEvent) => {
    const element = (event.target as Element | null)?.closest(INTERACTIVE)
    if (!element) return
    const sound = soundOf(element)
    if (sound) play(sound)
  }
  const onKey = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null
    if (
      target?.matches(
        'input:not([type="checkbox"], [type="radio"]), textarea',
      ) &&
      event.key.length === 1
    ) {
      play('type')
    }
  }
  document.addEventListener('pointerover', onOver)
  document.addEventListener('pointerout', onOut)
  document.addEventListener('click', onClick, true)
  document.addEventListener('keydown', onKey, true)
  return () => {
    document.removeEventListener('pointerover', onOver)
    document.removeEventListener('pointerout', onOut)
    document.removeEventListener('click', onClick, true)
    document.removeEventListener('keydown', onKey, true)
  }
}
