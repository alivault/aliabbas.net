export type MissionPhase = 'idle' | 'hunt' | 'escape' | 'won' | 'failed'

export type GameInputMode = 'pointer' | 'touch'

export type TouchFlightInput = {
  forward: number
  strafe: number
  vertical: number
}

export type TouchGameSettings = {
  sensitivity: number
}

export type StackFrameStatus = 'pending' | 'active' | 'resolved'

export type StackFrame = {
  number: string
  label: string
  status: StackFrameStatus
}

export type GameHudState = {
  phase: MissionPhase
  objective: string
  targetDistance: number
  integrity: number
  faultsResolved: number
  totalFaults: number
  bugsPurged: number
  escapeTime: number
  frames: Array<StackFrame>
  hitPulse: number
  damagePulse: number
}

export type GameResult = {
  status: 'won' | 'failed'
  reason: string
  score: number
  elapsed: number
  integrity: number
  bugsPurged: number
  faultsResolved: number
  accuracy: number
}

export type StackTraceGameApi = {
  start: (mode: GameInputMode, settings?: TouchGameSettings) => void
  resume: () => void
  pause: () => void
  setTouchInput: (input: Partial<TouchFlightInput>) => void
  addTouchLook: (deltaX: number, deltaY: number) => void
  setTouchFiring: (firing: boolean) => void
  fireTouch: () => void
}

export const initialHudState: GameHudState = {
  phase: 'idle',
  objective: 'Follow the failure to its source',
  targetDistance: 0,
  integrity: 100,
  faultsResolved: 0,
  totalFaults: 3,
  bugsPurged: 0,
  escapeTime: 45,
  frames: [
    { number: '01', label: '/ui/interaction', status: 'active' },
    { number: '02', label: '/app/state', status: 'pending' },
    { number: '03', label: '/data/session', status: 'pending' },
    { number: '04', label: '/deploy/core', status: 'pending' },
  ],
  hitPulse: 0,
  damagePulse: 0,
}
