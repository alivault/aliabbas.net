import { sfxr } from 'jsfxr'

type ToneOptions = {
  frequency: number
  endFrequency: number
  duration: number
  volume: number
  type?: OscillatorType
  delay?: number
}

type NoiseOptions = {
  duration: number
  volume: number
  frequency: number
  type?: BiquadFilterType
  delay?: number
}

const PLAYER_BLASTER =
  '34T6Pm1AmwsNVRTxq6XQWSCpp6MoDYRJhNpQFzVfvFgvoGjYiT4nDLLJBtsNwV4Pew2drxDP6Tr9661DSRUV81mRwpmxH5TdyFJPqEchAK8KQ2yQdJRKx7jzF'

const ENEMY_BLASTER =
  '111112bKEyuPvsr8vRgLJzenZ1Ynun6ESqG139P59nrKvffKssrq1STHcVxWa8cgWTWStTUpr9S4AbsBrSgLhhBv6qPZgm2jcADWmAQkNirQMZHVdBCN3ooV'

const ENEMY_EXPLOSION =
  '7BMHBGLnKwSusLGPmSg4ukmbEdntnhChkUyaQQZesktFjfDgKDzZRu6JrDPneSEMueDq8ithFZ5S5z48JHaS74HFqwGN9MRwEgmoFHNEyRbGogvR4qHUqrWsH'

const PLAYER_DAMAGE =
  '11111CybJTSaLy3Bouzj5CmE9BpWRpZhTHT3e1FPbThDpNxF4zyFud7vgd7pTaQ4vzVjR4DRX6qbEP8DjQ8WZbZmHMH7LG1WcHHBZEeuHiBCLH11GvKKFhEX'

export default class StackTraceAudio {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private noiseBuffer: AudioBuffer | null = null
  private playerShotBuffer: AudioBuffer | null = null
  private enemyShotBuffer: AudioBuffer | null = null
  private enemyExplosionBuffer: AudioBuffer | null = null
  private playerDamageBuffer: AudioBuffer | null = null
  private ambientGain: GainNode | null = null
  private ambientNoiseBuffer: AudioBuffer | null = null
  private readonly ambientSources: Array<AudioScheduledSourceNode> = []

  private ready() {
    if (typeof AudioContext === 'undefined') return null
    if (!this.context || !this.master) {
      try {
        const context = new AudioContext()
        const master = context.createGain()
        const compressor = context.createDynamicsCompressor()
        master.gain.value = 0.3
        compressor.threshold.value = -18
        compressor.knee.value = 16
        compressor.ratio.value = 5
        compressor.attack.value = 0.003
        compressor.release.value = 0.18
        master.connect(compressor).connect(context.destination)
        this.context = context
        this.master = master
      } catch {
        return null
      }
    }
    if (this.context.state === 'suspended') {
      void this.context.resume().catch(() => undefined)
    }
    return { context: this.context, master: this.master }
  }

  private ensureAmbient(context: AudioContext, master: GainNode) {
    if (this.ambientGain) return this.ambientGain

    const highPass = context.createBiquadFilter()
    const filter = context.createBiquadFilter()
    const output = context.createGain()
    highPass.type = 'highpass'
    highPass.frequency.value = 120
    highPass.Q.value = 0.5
    filter.type = 'lowpass'
    filter.frequency.value = 210
    filter.Q.value = 1.1
    output.gain.value = 0.0001
    highPass.connect(filter)
    filter.connect(output).connect(master)

    ;[
      { frequency: 52, volume: 0.08, type: 'sine' as const, detune: -3 },
      { frequency: 78, volume: 0.13, type: 'triangle' as const, detune: 4 },
      { frequency: 104, volume: 0.045, type: 'sine' as const, detune: 7 },
    ].forEach(({ frequency, volume, type, detune }) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = type
      oscillator.frequency.value = frequency
      oscillator.detune.value = detune
      gain.gain.value = volume
      oscillator.connect(gain).connect(highPass)
      oscillator.start()
      this.ambientSources.push(oscillator)
    })

    if (!this.ambientNoiseBuffer) {
      const length = context.sampleRate * 2
      const buffer = context.createBuffer(1, length, context.sampleRate)
      const data = buffer.getChannelData(0)
      let previous = 0
      for (let index = 0; index < length; index += 1) {
        const white = Math.random() * 2 - 1
        previous = (previous + white * 0.02) / 1.02
        data[index] = previous * 3.2
      }
      this.ambientNoiseBuffer = buffer
    }

    const noise = context.createBufferSource()
    const noiseFilter = context.createBiquadFilter()
    const noiseGain = context.createGain()
    noise.buffer = this.ambientNoiseBuffer
    noise.loop = true
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 145
    noiseFilter.Q.value = 0.55
    noiseGain.gain.value = 0.035
    noise.connect(noiseFilter).connect(noiseGain).connect(highPass)
    noise.start()
    this.ambientSources.push(noise)

    const lfo = context.createOscillator()
    const lfoDepth = context.createGain()
    lfo.type = 'sine'
    lfo.frequency.value = 0.075
    lfoDepth.gain.value = 28
    lfo.connect(lfoDepth).connect(filter.frequency)
    lfo.start()
    this.ambientSources.push(lfo)

    this.ambientGain = output
    return output
  }

  private setAmbient(active: boolean) {
    const audio = this.ready()
    if (!audio) return
    const { context, master } = audio
    const output = this.ensureAmbient(context, master)
    const now = context.currentTime
    const current = Math.max(output.gain.value, 0.0001)
    output.gain.cancelScheduledValues(now)
    output.gain.setValueAtTime(current, now)
    output.gain.exponentialRampToValueAtTime(
      active ? 0.7 : 0.0001,
      now + (active ? 1.2 : 0.28),
    )
  }

  private tone({
    frequency,
    endFrequency,
    duration,
    volume,
    type = 'sine',
    delay = 0,
  }: ToneOptions) {
    const audio = this.ready()
    if (!audio) return
    const { context, master } = audio
    const start = context.currentTime + delay
    const end = start + duration
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(Math.max(frequency, 1), start)
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(endFrequency, 1),
      end,
    )
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)
    oscillator.connect(gain).connect(master)
    oscillator.start(start)
    oscillator.stop(end + 0.02)
  }

  private noise({
    duration,
    volume,
    frequency,
    type = 'bandpass',
    delay = 0,
  }: NoiseOptions) {
    const audio = this.ready()
    if (!audio) return
    const { context, master } = audio
    if (!this.noiseBuffer) {
      const length = Math.ceil(context.sampleRate * 0.5)
      const buffer = context.createBuffer(1, length, context.sampleRate)
      const data = buffer.getChannelData(0)
      for (let index = 0; index < length; index += 1) {
        data[index] = Math.random() * 2 - 1
      }
      this.noiseBuffer = buffer
    }
    const start = context.currentTime + delay
    const end = start + duration
    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const gain = context.createGain()
    source.buffer = this.noiseBuffer
    filter.type = type
    filter.frequency.setValueAtTime(frequency, start)
    filter.Q.value = 0.8
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.004)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)
    source.connect(filter).connect(gain).connect(master)
    source.start(start)
    source.stop(end + 0.01)
  }

  playMissionStart() {
    this.setAmbient(true)
    this.tone({
      frequency: 170,
      endFrequency: 340,
      duration: 0.16,
      volume: 0.22,
      type: 'triangle',
    })
    this.tone({
      frequency: 340,
      endFrequency: 680,
      duration: 0.2,
      volume: 0.17,
      type: 'triangle',
      delay: 0.12,
    })
  }

  playPlayerShot() {
    const audio = this.ready()
    if (!audio) return
    const { context } = audio
    if (!this.playerShotBuffer) {
      this.playerShotBuffer =
        sfxr.toWebAudio(PLAYER_BLASTER, context)?.buffer ?? null
    }
    if (!this.playerShotBuffer) return
    const source = context.createBufferSource()
    const gain = context.createGain()
    source.buffer = this.playerShotBuffer
    gain.gain.value = 0.09
    source.connect(gain).connect(context.destination)
    source.start()
  }

  playEnemyShot(proximity: number) {
    const audio = this.ready()
    if (!audio) return
    const { context } = audio
    if (!this.enemyShotBuffer) {
      this.enemyShotBuffer =
        sfxr.toWebAudio(ENEMY_BLASTER, context)?.buffer ?? null
    }
    if (!this.enemyShotBuffer) return
    const intensity = Math.max(0, Math.min(proximity, 1))
    const source = context.createBufferSource()
    const gain = context.createGain()
    source.buffer = this.enemyShotBuffer
    gain.gain.value = 0.055 + intensity * 0.05
    source.connect(gain).connect(context.destination)
    source.start()
  }

  playImpact() {
    this.tone({
      frequency: 210,
      endFrequency: 85,
      duration: 0.09,
      volume: 0.04,
      type: 'square',
    })
    this.noise({ duration: 0.07, volume: 0.023, frequency: 850 })
  }

  playDestroy(large = false) {
    const audio = this.ready()
    if (!audio) return
    const { context } = audio
    if (!this.enemyExplosionBuffer) {
      this.enemyExplosionBuffer =
        sfxr.toWebAudio(ENEMY_EXPLOSION, context)?.buffer ?? null
    }
    if (!this.enemyExplosionBuffer) return
    const source = context.createBufferSource()
    const gain = context.createGain()
    source.buffer = this.enemyExplosionBuffer
    source.playbackRate.value = large ? 0.82 : 1
    gain.gain.value = large ? 0.11 : 0.09
    source.connect(gain).connect(context.destination)
    source.start()
  }

  playDamage() {
    const audio = this.ready()
    if (!audio) return
    const { context } = audio
    if (!this.playerDamageBuffer) {
      this.playerDamageBuffer =
        sfxr.toWebAudio(PLAYER_DAMAGE, context)?.buffer ?? null
    }
    if (!this.playerDamageBuffer) return
    const source = context.createBufferSource()
    const gain = context.createGain()
    source.buffer = this.playerDamageBuffer
    gain.gain.value = 0.38
    source.connect(gain).connect(context.destination)
    source.start()
  }

  playObjectiveResolved() {
    ;[330, 440, 660].forEach((frequency, index) => {
      this.tone({
        frequency,
        endFrequency: frequency * 1.04,
        duration: 0.16,
        volume: 0.13,
        type: 'triangle',
        delay: index * 0.09,
      })
    })
  }

  playEscape() {
    this.tone({
      frequency: 440,
      endFrequency: 880,
      duration: 0.42,
      volume: 0.2,
      type: 'triangle',
    })
    this.noise({
      duration: 0.28,
      volume: 0.08,
      frequency: 1400,
      delay: 0.08,
    })
  }

  playMap(open: boolean) {
    this.setAmbient(!open)
    this.tone({
      frequency: open ? 240 : 520,
      endFrequency: open ? 520 : 240,
      duration: 0.13,
      volume: 0.11,
      type: 'sine',
    })
  }

  playPause() {
    this.setAmbient(false)
    this.tone({
      frequency: 310,
      endFrequency: 155,
      duration: 0.16,
      volume: 0.12,
      type: 'triangle',
    })
  }

  playResume() {
    this.setAmbient(true)
    this.tone({
      frequency: 155,
      endFrequency: 390,
      duration: 0.16,
      volume: 0.12,
      type: 'triangle',
    })
  }

  playMissionEnd(status: 'won' | 'failed') {
    this.setAmbient(false)
    const frequencies =
      status === 'won' ? [330, 495, 660, 990] : [260, 195, 130, 65]
    frequencies.forEach((frequency, index) => {
      this.tone({
        frequency,
        endFrequency: frequency,
        duration: status === 'won' ? 0.28 : 0.34,
        volume: 0.15,
        type: status === 'won' ? 'triangle' : 'sawtooth',
        delay: index * 0.11,
      })
    })
  }

  dispose() {
    const context = this.context
    this.ambientSources.forEach((source) => source.stop())
    this.ambientSources.length = 0
    this.context = null
    this.master = null
    this.noiseBuffer = null
    this.playerShotBuffer = null
    this.enemyShotBuffer = null
    this.enemyExplosionBuffer = null
    this.playerDamageBuffer = null
    this.ambientGain = null
    this.ambientNoiseBuffer = null
    if (context && context.state !== 'closed') {
      void context.close().catch(() => undefined)
    }
  }
}
