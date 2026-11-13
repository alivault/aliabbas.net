/**
 * Spins the cube of the open page from the DOM. On the lab page, the page
 * covers its small cube, so an empty square over the cube takes the drag
 * and hands it to the cube here.
 */
export type Spinner = {
  /** A press at this point of the screen, in CSS pixels. */
  grab: (x: number, y: number) => void
  drag: (x: number, y: number) => void
  release: () => void
}

const spinners = new Map<string, Spinner>()

export function registerSpinner(id: string, spinner: Spinner) {
  spinners.set(id, spinner)
  return () => {
    if (spinners.get(id) === spinner) spinners.delete(id)
  }
}

export function spinnerOf(id: string) {
  return spinners.get(id)
}

/**
 * True while a drag spins a cube in the world. The drag that turns the
 * camera waits then, so the drag moves the cube, not the view.
 */
export const spinGrab = { active: false }
