/**
 * The background music of the world: five "vibes", all made with Web Audio
 * at run time (no files). Each vibe builds its nodes into one output, and
 * `stop()` ends them. Notes and beats are set a little ahead of time by a
 * scheduler, so they stay in time when the main thread is busy.
 */

export type Vibe = {
  /** The name in the HUD. */
  name: string
  /** The low-pass cutoff of the vibe far from every page, in Hz. */
  cutoff: number
  /** A gain, so the vibes play at about the same loudness (RMS). */
  level: number
  build: (kit: Kit) => () => void
}

export type Kit = {
  context: AudioContext
  /** The output of the vibe: it goes through the shared filter. */
  out: AudioNode
  /** A send to the shared reverb. */
  space: AudioNode
  /** Two seconds of white noise, shared by all hits. */
  noise: AudioBuffer
  /** False while sound is off: the scheduler skips its notes then. */
  audible: () => boolean
}

const hz = (note: number) => 440 * 2 ** ((note - 69) / 12)

/** Calls `fn` for each step of a grid, a little before each step is due. */
function schedule(
  kit: Kit,
  stepSeconds: number,
  fn: (time: number, step: number) => void,
) {
  const { context } = kit
  let next = context.currentTime + 0.1
  let step = 0
  const timer = window.setInterval(() => {
    const now = context.currentTime
    // After a pause (a hidden tab), start again from now: no burst of notes.
    if (next < now) next = now + 0.05
    while (next < now + 0.25) {
      if (kit.audible()) fn(next, step)
      next += stepSeconds
      step += 1
    }
  }, 60)
  return () => window.clearInterval(timer)
}

/** A short envelope on a new gain node, from `time`. */
function envelope(
  context: AudioContext,
  time: number,
  peak: number,
  attack: number,
  decay: number,
) {
  const gain = context.createGain()
  gain.gain.setValueAtTime(0, time)
  gain.gain.linearRampToValueAtTime(peak, time + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + attack + decay)
  return gain
}

/** A soft bell: a sine with a quiet octave above it. */
function bell(kit: Kit, time: number, note: number, volume: number) {
  const { context } = kit
  const decay = 2.6
  const gain = envelope(context, time, volume, 0.008, decay)
  gain.connect(kit.out)
  gain.connect(kit.space)
  for (const [ratio, level] of [
    [1, 1],
    [2, 0.18],
  ] as const) {
    const osc = context.createOscillator()
    osc.frequency.value = hz(note) * ratio
    const partial = context.createGain()
    partial.gain.value = level
    osc.connect(partial).connect(gain)
    osc.start(time)
    osc.stop(time + decay + 0.1)
  }
}

/** A soft electronic kick: a sine that falls in pitch. */
function kick(kit: Kit, time: number, volume: number) {
  const { context } = kit
  const osc = context.createOscillator()
  osc.frequency.setValueAtTime(110, time)
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.18)
  const gain = envelope(context, time, volume, 0.004, 0.32)
  osc.connect(gain).connect(kit.out)
  osc.start(time)
  osc.stop(time + 0.4)
}

/** A short burst of filtered noise: a hat, a click or a shaker. */
function tick(
  kit: Kit,
  time: number,
  {
    volume,
    frequency,
    q = 1,
    decay = 0.04,
    type = 'highpass',
  }: {
    volume: number
    frequency: number
    q?: number
    decay?: number
    type?: BiquadFilterType
  },
) {
  const { context } = kit
  const source = context.createBufferSource()
  source.buffer = kit.noise
  const filter = context.createBiquadFilter()
  filter.type = type
  filter.frequency.value = frequency
  filter.Q.value = q
  const gain = envelope(context, time, volume, 0.002, decay)
  source.connect(filter).connect(gain)
  gain.connect(kit.out)
  gain.connect(kit.space)
  // A random start in the noise, so no two hits sound the same.
  source.start(time, Math.random() * 1.5, decay + 0.05)
}

/** A plucked note through a closing filter. */
function pluck(
  kit: Kit,
  time: number,
  note: number,
  volume: number,
  type: OscillatorType = 'triangle',
) {
  const { context } = kit
  const osc = context.createOscillator()
  osc.type = type
  osc.frequency.value = hz(note)
  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(2400, time)
  filter.frequency.exponentialRampToValueAtTime(400, time + 0.5)
  const gain = envelope(context, time, volume, 0.005, 0.7)
  osc.connect(filter).connect(gain)
  gain.connect(kit.out)
  gain.connect(kit.space)
  osc.start(time)
  osc.stop(time + 0.8)
}

/** Steady voices that swell on slow cycles. Returns their oscillators. */
function pad(
  kit: Kit,
  notes: Array<number>,
  level: number,
  type: OscillatorType = 'sine',
) {
  const { context } = kit
  const nodes: Array<AudioScheduledSourceNode> = []
  const voices = notes.map((note, index) => {
    const osc = context.createOscillator()
    osc.type = type
    osc.frequency.value = hz(note)
    osc.detune.value = (index % 2 ? 1 : -1) * 3
    const gain = context.createGain()
    gain.gain.value = level
    const lfo = context.createOscillator()
    lfo.frequency.value = 0.03 + Math.random() * 0.05
    const depth = context.createGain()
    depth.gain.value = level * 0.5
    lfo.connect(depth).connect(gain.gain)
    osc.connect(gain)
    gain.connect(kit.out)
    gain.connect(kit.space)
    osc.start()
    lfo.start()
    nodes.push(osc, lfo)
    return osc
  })
  return {
    voices,
    stop: () => {
      for (const node of nodes) node.stop()
    },
  }
}

/**
 * An echo: a delay with feedback. Returns a kit whose output plays the
 * sound dry and then its echoes.
 */
function echo(kit: Kit, seconds: number, feedback: number, level: number): Kit {
  const { context } = kit
  const input = context.createGain()
  const delay = context.createDelay(2)
  delay.delayTime.value = seconds
  const loop = context.createGain()
  loop.gain.value = feedback
  const tone = context.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = 2200
  const wet = context.createGain()
  wet.gain.value = level
  input.connect(kit.out)
  input.connect(delay)
  delay.connect(tone).connect(loop).connect(delay)
  tone.connect(wet).connect(kit.out)
  return { ...kit, out: input }
}

/** Wind or waves: noise through a filter that a slow LFO opens and closes. */
function air(
  kit: Kit,
  {
    frequency,
    sweep,
    rate,
    level,
    type = 'bandpass',
  }: {
    frequency: number
    sweep: number
    rate: number
    level: number
    type?: BiquadFilterType
  },
) {
  const { context } = kit
  const source = context.createBufferSource()
  source.buffer = kit.noise
  source.loop = true
  const filter = context.createBiquadFilter()
  filter.type = type
  filter.frequency.value = frequency
  filter.Q.value = 0.7
  const gain = context.createGain()
  gain.gain.value = level
  const lfo = context.createOscillator()
  lfo.frequency.value = rate
  const depth = context.createGain()
  depth.gain.value = sweep
  lfo.connect(depth).connect(filter.frequency)
  // The level swells with the filter: a wave comes in and goes out.
  const swell = context.createGain()
  swell.gain.value = level * 0.8
  lfo.connect(swell).connect(gain.gain)
  source.connect(filter).connect(gain)
  gain.connect(kit.out)
  gain.connect(kit.space)
  source.start()
  lfo.start()
  return () => {
    source.stop()
    lfo.stop()
  }
}

const pick = <T>(items: ReadonlyArray<T>) =>
  items[Math.floor(Math.random() * items.length)]

/** Warm chords with an added ninth that glide from one to the next. */
const dusk: Vibe = {
  name: 'Dusk',
  level: 0.8,
  cutoff: 900,
  build: (kit) => {
    // MIDI notes, low voice first: D add9, G maj9, D add9, E m9.
    const chords = [
      [38, 50, 57, 64, 66],
      [43, 50, 59, 66, 69],
      [38, 50, 57, 64, 66],
      [40, 50, 59, 66, 67],
    ]
    const { voices, stop } = pad(kit, chords[0], 0.08, 'triangle')
    let chord = 0
    const timer = window.setInterval(() => {
      chord = (chord + 1) % chords.length
      chords[chord].forEach((note, index) =>
        voices[index].frequency.setTargetAtTime(
          hz(note),
          kit.context.currentTime,
          3,
        ),
      )
    }, 24_000)
    const stopAir = air(kit, {
      frequency: 700,
      sweep: 260,
      rate: 0.07,
      level: 0.02,
    })
    return () => {
      window.clearInterval(timer)
      stop()
      stopAir()
    }
  },
}

/** Single bells in a pentatonic scale, far apart, with a long echo. */
const drift: Vibe = {
  name: 'Drift',
  level: 1.6,
  cutoff: 2600,
  build: (kit) => {
    const { stop } = pad(kit, [38, 45], 0.05)
    const wet = echo(kit, 0.48, 0.42, 0.5)
    // D major pentatonic, two octaves.
    const scale = [62, 64, 66, 69, 71, 74, 76, 78]
    let wait = 0
    const stopNotes = schedule(kit, 0.25, (time) => {
      if (wait-- > 0) return
      bell(wet, time, pick(scale), 0.09)
      // The next bell comes after 1.5 to 4.5 s.
      wait = 6 + Math.floor(Math.random() * 12)
    })
    return () => {
      stopNotes()
      stop()
    }
  },
}

/** A slow, soft beat at 80 BPM under a quiet chord: kick, hats, a sub. */
const pulse: Vibe = {
  name: 'Pulse',
  level: 1.7,
  cutoff: 1800,
  build: (kit) => {
    const { stop } = pad(kit, [50, 57, 64, 66], 0.03, 'triangle')
    const sixteenth = 60 / 80 / 4
    const stopBeat = schedule(kit, sixteenth, (time, step) => {
      const at = step % 16
      if (at === 0 || (at === 10 && Math.random() < 0.35)) {
        kick(kit, time, 0.32)
      }
      if (at % 4 === 2 && Math.random() < 0.8) {
        tick(kit, time, { volume: 0.05, frequency: 7500 })
      }
      if (at === 12 && Math.random() < 0.4) {
        tick(kit, time, {
          volume: 0.06,
          frequency: 1800,
          q: 6,
          decay: 0.05,
          type: 'bandpass',
        })
      }
      // A sub note at the start of each bar: D, then A.
      if (at === 0) {
        const bar = Math.floor(step / 16)
        const osc = kit.context.createOscillator()
        osc.frequency.value = hz(bar % 2 ? 33 : 26)
        const gain = envelope(kit.context, time, 0.12, 0.05, sixteenth * 14)
        osc.connect(gain).connect(kit.out)
        osc.start(time)
        osc.stop(time + sixteenth * 15)
      }
    })
    return () => {
      stopBeat()
      stop()
    }
  },
}

/** Waves of noise that come in and go out, over a deep, warm chord. */
const tide: Vibe = {
  name: 'Tide',
  level: 1.5,
  cutoff: 1400,
  build: (kit) => {
    const { stop } = pad(kit, [38, 54, 57], 0.05)
    const stopWaves = air(kit, {
      frequency: 500,
      sweep: 380,
      rate: 0.09,
      level: 0.05,
      type: 'lowpass',
    })
    // Now and then, a high bell, like light on the water.
    let wait = 16
    const stopNotes = schedule(kit, 0.5, (time) => {
      if (wait-- > 0) return
      bell(kit, time, pick([74, 78, 81, 83]), 0.035)
      wait = 12 + Math.floor(Math.random() * 16)
    })
    return () => {
      stopNotes()
      stopWaves()
      stop()
    }
  },
}

/** A minimal electronic loop at 96 BPM: clicks, a soft kick, an arpeggio. */
const signal: Vibe = {
  name: 'Signal',
  level: 2.3,
  cutoff: 2200,
  build: (kit) => {
    const { stop } = pad(kit, [40, 47], 0.035)
    const wet = echo(kit, (60 / 96) * 0.75, 0.38, 0.45)
    const sixteenth = 60 / 96 / 4
    // E minor 9, up and down.
    const arp = [52, 55, 59, 62, 66, 62, 59, 55]
    // Five clicks spread over sixteen steps.
    const clicks = new Set([0, 3, 6, 10, 13])
    const stopLoop = schedule(kit, sixteenth, (time, step) => {
      const at = step % 16
      if (at % 8 === 0) kick(kit, time, 0.18)
      if (clicks.has(at)) {
        tick(kit, time, {
          volume: 0.035,
          frequency: 3200,
          q: 9,
          decay: 0.025,
          type: 'bandpass',
        })
      }
      if (at % 2 === 0 && Math.random() < 0.7) {
        pluck(wet, time, arp[(step / 2) % 8], 0.05)
      }
    })
    return () => {
      stopLoop()
      stop()
    }
  },
}

export const VIBES: ReadonlyArray<Vibe> = [dusk, drift, pulse, tide, signal]
