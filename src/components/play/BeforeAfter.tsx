import { useId, useState } from 'react'
import { ChevronsLeftRight } from 'lucide-react'

type Image = { src: string; alt: string; label: string }

export default function BeforeAfter({
  before,
  after,
}: {
  before: Image
  after: Image
}) {
  const [position, setPosition] = useState(50)
  const id = useId()

  return (
    <figure className="st-cut relative aspect-video overflow-hidden bg-black select-none">
      <img
        src={after.src}
        alt={after.alt}
        width={1600}
        height={900}
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
      />
      <img
        src={before.src}
        alt={before.alt}
        width={1600}
        height={900}
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      />
      <label htmlFor={id} className="sr-only">
        Drag to compare {before.label} and {after.label}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        className="peer absolute inset-0 size-full cursor-ew-resize opacity-0"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_12px_rgb(0_0_0/60%)] peer-focus-visible:bg-[#d9ff43]"
        style={{ left: `${position}%` }}
      >
        <span className="absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-inherit text-black">
          <ChevronsLeftRight size={20} />
        </span>
      </div>
      <span className="st-display pointer-events-none absolute bottom-4 left-4 bg-black/70 px-2 py-1 text-xs font-semibold tracking-widest text-white uppercase">
        {before.label}
      </span>
      <span className="st-display pointer-events-none absolute right-4 bottom-4 bg-black/70 px-2 py-1 text-xs font-semibold tracking-widest text-white uppercase">
        {after.label}
      </span>
    </figure>
  )
}
