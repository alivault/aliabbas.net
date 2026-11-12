import { useSyncExternalStore } from 'react'

/**
 * The state of the world that the DOM also needs: the HUD, the page overlay
 * and the router bridge. The camera itself lives in refs in the canvas.
 *
 * roam: the visitor walks.
 * entering: the camera flies into a sheet.
 * inside: a page shows over the world.
 * leaving: the camera flies back out.
 */
export type Phase = 'roam' | 'entering' | 'inside' | 'leaving'

export type WorldState = {
  phase: Phase
  /** The sheet that the camera flies to, or is in. */
  target: string | null
  /** The sheet under the pointer. */
  hover: string | null
  /** The sheets that the visitor has opened. */
  visited: Array<string>
  /** True after the visitor has gone in through the enter gate. */
  entered: boolean
  /** True when the 3D scene runs and takes commands. */
  ready: boolean
  /** True while the index of the site is open over the world. */
  indexOpen: boolean
}

const VISITED_KEY = 'world:visited'

let state: WorldState = {
  phase: 'roam',
  target: null,
  hover: null,
  visited: [],
  entered: false,
  ready: false,
  indexOpen: false,
}

const listeners = new Set<() => void>()

export function getWorld() {
  return state
}

export function setWorld(patch: Partial<WorldState>) {
  state = { ...state, ...patch }
  for (const listener of listeners) listener()
}

export function markVisited(id: string) {
  if (state.visited.includes(id)) return
  const visited = [...state.visited, id]
  setWorld({ visited })
  try {
    localStorage.setItem(VISITED_KEY, JSON.stringify(visited))
  } catch {
    // Private mode: the count lasts for this visit only.
  }
}

export function loadVisited() {
  try {
    const saved = JSON.parse(localStorage.getItem(VISITED_KEY) ?? '[]')
    if (Array.isArray(saved)) setWorld({ visited: saved.map(String) })
  } catch {
    // A broken value: start again.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const serverState = state

export function useWorld<T>(select: (s: WorldState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(serverState),
  )
}

/**
 * Commands from the DOM to the canvas. The canvas sets these when it
 * mounts. Before that, they do nothing.
 */
export const worldCommands = {
  /** Fly into a sheet. */
  enter: (_id: string) => {},
  /** Fly back out to where the visitor stood. */
  leave: () => {},
  /** Put the camera in a sheet at once, for a deep link. */
  snapInto: (_id: string) => {},
  /** Walk to the next sheet that the visitor has not opened. */
  next: () => {},
}
