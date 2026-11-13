import { cn } from '~/lib/utils'
import { spinnerOf } from './cubeSpin'

/**
 * An empty square over the cube of a page that the page covers (the lab).
 * A drag on it spins the cube, as a drag on the cube itself does.
 */
export default function CubeHandle({
  sheetId,
  className,
}: {
  sheetId: string
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={cn('cursor-grab touch-none active:cursor-grabbing', className)}
      onPointerDown={(event) => {
        if (event.button !== 0) return
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
        } catch {
          // A pointer that is not active (a synthetic event) has no capture.
        }
        spinnerOf(sheetId)?.grab(event.clientX, event.clientY)
      }}
      onPointerMove={(event) =>
        spinnerOf(sheetId)?.drag(event.clientX, event.clientY)
      }
      onPointerUp={() => spinnerOf(sheetId)?.release()}
      onPointerCancel={() => spinnerOf(sheetId)?.release()}
    />
  )
}
