import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { DURATIONS, EASE_IN, EASE_OUT } from '~/lib/design/motion'
import { cn } from '~/lib/utils'

/** A picture or a video of a reader, as the zoom view shows it. */
export type LightboxItem = {
  src: string
  alt: string
  width: number
  height: number
  caption?: ReactNode
  video?: string
}

type Entry = { item: LightboxItem; element: HTMLElement | null }

type LightboxApi = {
  register: (id: string, entry: Entry) => () => void
  open: (id: string) => void
  openId: string | null
}

const LightboxContext = createContext<LightboxApi | null>(null)

export function useLightbox() {
  return useContext(LightboxContext)
}

/** The box of the media in the zoom view: as large as fits, centered. */
function targetBox(item: LightboxItem) {
  // On a phone, the media takes almost the full width.
  const maxWidth = window.innerWidth * (window.innerWidth < 640 ? 0.94 : 0.86)
  const maxHeight = window.innerHeight * 0.72
  const scale = Math.min(maxWidth / item.width, maxHeight / item.height)
  const width = item.width * scale
  const height = item.height * scale
  return {
    width,
    height,
    centerX: window.innerWidth / 2,
    centerY: window.innerHeight * 0.46,
  }
}

/** The transform that puts the zoom view's media over a figure on the page. */
function fromFigure(element: HTMLElement | null, item: LightboxItem) {
  const box = targetBox(item)
  const rect = element?.getBoundingClientRect()
  const visible =
    rect && rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0
  if (!rect || !visible) return { opacity: 0, scale: 0.92, x: 0, y: 0 }
  return {
    opacity: 1,
    scale: rect.width / box.width,
    x: rect.left + rect.width / 2 - box.centerX,
    y: rect.top + rect.height / 2 - box.centerY,
  }
}

/**
 * The zoom view of a reader. A click on a figure zooms it from its place to
 * the middle of the screen. The arrows (keys or buttons) go to the next or
 * the previous picture or video of the page. Esc, Close or a click on the
 * backdrop zooms it back.
 */
export function LightboxProvider({ children }: { children: ReactNode }) {
  const entries = useRef(new Map<string, Entry>())
  const [openId, setOpenId] = useState<string | null>(null)
  // How the media leaves: back to its figure. It is set one frame before
  // the view closes, so the exit reads it.
  const [exitTo, setExitTo] = useState<ReturnType<typeof fromFigure>>({
    opacity: 0,
    scale: 0.92,
    x: 0,
    y: 0,
  })
  const opener = useRef<HTMLElement | null>(null)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [closing, setClosing] = useState(false)
  const [first, setFirst] = useState(true)
  // The portal needs the body: only after hydration.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const register = useCallback((id: string, entry: Entry) => {
    entries.current.set(id, entry)
    return () => {
      entries.current.delete(id)
    }
  }, [])

  /** The figures in the order of the page. */
  const ordered = useCallback(
    () =>
      [...entries.current.entries()].sort(([, a], [, b]) =>
        a.element && b.element
          ? a.element.compareDocumentPosition(b.element) &
            Node.DOCUMENT_POSITION_FOLLOWING
            ? -1
            : 1
          : 0,
      ),
    [],
  )

  const open = useCallback((id: string) => {
    opener.current = document.activeElement as HTMLElement | null
    setFirst(true)
    setClosing(false)
    setOpenId(id)
  }, [])

  const close = useCallback(() => {
    if (!openId) return
    const entry = entries.current.get(openId)
    if (entry) setExitTo(fromFigure(entry.element, entry.item))
    setClosing(true)
    requestAnimationFrame(() => {
      setOpenId(null)
      opener.current?.focus({ preventScroll: true })
    })
  }, [openId])

  const step = useCallback(
    (by: 1 | -1) => {
      const list = ordered()
      const index = list.findIndex(([id]) => id === openId)
      if (index === -1 || list.length < 2) return
      const next = list[(index + by + list.length) % list.length]
      setDirection(by)
      setFirst(false)
      setOpenId(next[0])
    },
    [openId, ordered],
  )

  // Keys, and no page scroll behind the view.
  useEffect(() => {
    if (!openId) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        step(1)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        step(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    const root = document.documentElement
    const overflow = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      root.style.overflow = overflow
    }
  }, [openId, close, step])

  const api = useMemo(
    () => ({ register, open, openId }),
    [register, open, openId],
  )

  const list = openId ? ordered() : []
  const index = list.findIndex(([id]) => id === openId)
  const current = index === -1 ? null : list[index][1]

  return (
    <LightboxContext.Provider value={api}>
      {children}
      {/* On the body, above the HUD: the reader is in a lower layer. */}
      {!mounted
        ? null
        : createPortal(
            <AnimatePresence>
              {current ? (
                <View
                  key="lightbox"
                  entry={current}
                  entryKey={openId!}
                  position={index + 1}
                  count={list.length}
                  first={first}
                  direction={direction}
                  exitTo={exitTo}
                  closing={closing}
                  onClose={close}
                  onStep={step}
                />
              ) : null}
            </AnimatePresence>,
            document.body,
          )}
    </LightboxContext.Provider>
  )
}

type Leave = {
  closing: boolean
  direction: 1 | -1
  exitTo: ReturnType<typeof fromFigure>
}

/** On close, the media zooms back to its figure; on a step, it slides away. */
const mediaVariants = {
  exit: ({ closing, direction, exitTo }: Leave) =>
    closing
      ? { ...exitTo, transition: { duration: DURATIONS.page, ease: EASE_IN } }
      : {
          opacity: 0,
          x: direction * -80,
          transition: { duration: DURATIONS.exit, ease: EASE_IN },
        },
}

const control = 'hud-fill font-hud text-hud text-xs tracking-[0.42em] uppercase'

function View({
  entry,
  entryKey,
  position,
  count,
  first,
  direction,
  exitTo,
  closing,
  onClose,
  onStep,
}: {
  entry: Entry
  entryKey: string
  position: number
  count: number
  first: boolean
  direction: 1 | -1
  exitTo: ReturnType<typeof fromFigure>
  /** True when the view closes, false when the arrows change the media. */
  closing: boolean
  onClose: () => void
  onStep: (by: 1 | -1) => void
}) {
  const { item } = entry
  const box = targetBox(item)
  const leave: Leave = { closing, direction, exitTo }
  const closeRef = useRef<HTMLButtonElement>(null)
  const swipe = useRef<{ x: number; y: number } | null>(null)
  // Where this media starts: its figure on the first open, the side when
  // the arrows change it.
  const [from] = useState(() => fromFigure(entry.element, item))

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Zoomed media"
      data-hud
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: DURATIONS.page, ease: EASE_IN },
      }}
      transition={{ duration: DURATIONS.enter, ease: EASE_OUT }}
      className="bg-background/85 fixed inset-0 z-40 backdrop-blur-[20px]"
      onClick={onClose}
    >
      <div
        className="pointer-events-none fixed inset-x-0 top-5 flex items-start justify-between px-6"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="font-hud text-hud text-xs tracking-[0.42em]">
          {position}/{count}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          data-sound="click"
          className={cn(control, 'pointer-events-auto')}
        >
          Close
        </button>
      </div>

      <AnimatePresence
        initial={false}
        custom={leave}
        mode="popLayout"
        propagate
      >
        <motion.div
          key={entryKey}
          custom={leave}
          variants={mediaVariants}
          initial={
            first
              ? { ...from }
              : { opacity: 0, x: direction * 80, scale: 1, y: 0 }
          }
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit="exit"
          transition={{ duration: DURATIONS.page, ease: EASE_OUT }}
          style={{
            width: box.width,
            height: box.height,
            left: box.centerX - box.width / 2,
            top: box.centerY - box.height / 2,
          }}
          className="fixed touch-pan-y"
          onClick={(event) => event.stopPropagation()}
          // A swipe to the side goes to the next or the previous media.
          onPointerDown={(event) => {
            swipe.current = { x: event.clientX, y: event.clientY }
          }}
          onPointerUp={(event) => {
            const from = swipe.current
            swipe.current = null
            if (!from || count < 2) return
            const dx = event.clientX - from.x
            const dy = event.clientY - from.y
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
              onStep(dx < 0 ? 1 : -1)
            }
          }}
          onPointerCancel={() => {
            swipe.current = null
          }}
        >
          {item.video ? (
            <video
              src={item.video}
              poster={item.src}
              autoPlay
              muted
              loop
              playsInline
              controls
              aria-label={item.alt}
              className="border-hud/25 size-full border object-contain"
            />
          ) : (
            <img
              src={item.src}
              alt={item.alt}
              draggable={false}
              className="border-hud/25 size-full border object-contain"
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div
        className="fixed inset-x-0 flex justify-center px-6"
        style={{ top: box.centerY + box.height / 2 + 20 }}
        onClick={(event) => event.stopPropagation()}
      >
        {item.caption ? (
          <p className="text-fg-secondary max-w-[70ch] text-center text-sm leading-6">
            {item.caption}
          </p>
        ) : null}
      </div>

      {count > 1 ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-6 flex items-center justify-between px-6"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onStep(-1)}
            aria-keyshortcuts="ArrowLeft"
            className={cn(
              control,
              'pointer-events-auto flex items-center gap-2',
            )}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            Previous
          </button>
          <button
            type="button"
            onClick={() => onStep(1)}
            aria-keyshortcuts="ArrowRight"
            className={cn(
              control,
              'pointer-events-auto flex items-center gap-2',
            )}
          >
            Next
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      ) : null}
    </motion.div>
  )
}
