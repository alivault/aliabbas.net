type Place = { id: string; x: number; z: number }

/** Closer than this, a sheet is in front of the visitor: not worth a flight. */
const NEAR = 7

/**
 * The sheet that Next flies to. Next is a tour: each press shows a sheet
 * that it has not shown yet and that the visitor has not opened, the
 * nearest one that is not right in front. When none is left, the tour
 * starts again with all of them. `shown` keeps the tour, in order; this
 * adds the sheet it picks.
 */
export function nextOnTour<T extends Place>(
  sheets: ReadonlyArray<T>,
  here: { x: number; z: number },
  visited: ReadonlyArray<string>,
  shown: Set<string>,
): T {
  let pool = sheets.filter((s) => !shown.has(s.id) && !visited.includes(s.id))
  if (!pool.length) pool = sheets.filter((s) => !shown.has(s.id))
  if (!pool.length) {
    // A new tour does not start with the sheet the last one ended on.
    const last = [...shown].at(-1)
    shown.clear()
    pool = sheets.filter((s) => s.id !== last)
  }
  const near = pool
    .map((s) => ({ s, d: Math.hypot(s.x - here.x, s.z - here.z) }))
    .sort((a, b) => a.d - b.d)
  const sheet = (near.find(({ d }) => d > NEAR) ?? near[0]).s
  shown.add(sheet.id)
  return sheet
}
