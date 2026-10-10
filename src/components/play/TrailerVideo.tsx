import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { useReducedMotion } from 'motion/react'

// A muted gameplay loop. It does not play when the user prefers reduced
// motion, and a button lets anyone pause it.
export default function TrailerVideo({
  className = '',
}: {
  className?: string
}) {
  const video = useRef<HTMLVideoElement>(null)
  const reduceMotion = useReducedMotion()
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const element = video.current
    if (!element) return
    if (reduceMotion) {
      element.pause()
      return
    }
    element.play().catch(() => setPlaying(false))
  }, [reduceMotion])

  function toggle() {
    const element = video.current
    if (!element) return
    if (element.paused) void element.play()
    else element.pause()
  }

  return (
    <>
      <video
        ref={video}
        className={className}
        poster="/play/averno-trailer-poster.webp"
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <source src="/play/averno-trailer.webm" type="video/webm" />
        <source src="/play/averno-trailer.mp4" type="video/mp4" />
      </video>
      <button
        type="button"
        onClick={toggle}
        aria-label={
          playing ? 'Pause the gameplay video' : 'Play the gameplay video'
        }
        className="absolute right-4 bottom-4 z-10 flex size-11 items-center justify-center bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/75 sm:right-6 sm:bottom-6"
      >
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </button>
    </>
  )
}
