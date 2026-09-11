import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

const stack = [
  { name: 'React', icon: '/icons/stack/react.svg' },
  { name: 'TypeScript', icon: '/icons/stack/typescript.svg' },
  { name: 'Next.js', icon: '/icons/stack/nextjs.svg' },
  { name: 'TanStack', icon: '/icons/stack/tanstack.svg' },
  { name: 'Swift', icon: '/icons/stack/swift.svg' },
  { name: 'Tailwind CSS', icon: '/icons/stack/tailwindcss.svg' },
  { name: 'Motion', icon: '/icons/stack/motion.svg' },
  { name: 'GSAP', icon: '/icons/stack/gsap.svg' },
  { name: 'Figma', icon: '/icons/stack/figma.svg' },
  { name: 'Three.js', icon: '/icons/stack/threejs.svg' },
  { name: 'Convex', icon: '/icons/stack/convex.svg' },
  { name: 'Sanity', icon: '/icons/stack/sanity.svg' },
  { name: 'Zod', icon: '/icons/stack/zod.svg' },
  { name: 'RainbowKit', icon: '/icons/stack/rainbowkit.svg' },
  { name: 'Cloudflare', icon: '/icons/stack/cloudflare.svg' },
  { name: 'Vite+', icon: '/icons/stack/vite-plus.svg' },
  { name: 'Better Auth', icon: '/icons/stack/better-auth.svg' },
] as const

export default function StackMarquee() {
  const containerRef = useRef<HTMLDivElement>(null)
  const groupRef = useRef<HTMLDivElement>(null)
  const [copyCount, setCopyCount] = useState(4)
  const [groupWidth, setGroupWidth] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    const group = groupRef.current
    if (!container || !group) return

    const measure = () => {
      const nextGroupWidth = group.getBoundingClientRect().width
      if (nextGroupWidth === 0) return

      setGroupWidth(nextGroupWidth)
      setCopyCount(
        Math.max(2, Math.ceil(container.clientWidth / nextGroupWidth) + 2),
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    observer.observe(group)

    return () => observer.disconnect()
  }, [])

  const marqueeStyle = {
    '--marquee-distance': groupWidth ? `-${groupWidth}px` : '-50%',
    '--marquee-duration': groupWidth
      ? `${Math.max(22, groupWidth / 35)}s`
      : '28s',
  } as CSSProperties

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={`Technology stack: ${stack.map(({ name }) => name).join(', ')}`}
      className="text-foreground overflow-hidden py-4 sm:py-5"
    >
      <div
        className="marquee-track flex w-max items-center"
        style={marqueeStyle}
        aria-hidden="true"
      >
        {Array.from({ length: copyCount }, (_, copyIndex) => (
          <div
            key={copyIndex}
            ref={copyIndex === 0 ? groupRef : undefined}
            className="flex shrink-0 items-center"
          >
            {stack.map((item) => (
              <div key={item.name} className="flex items-center">
                <span className="flex size-5 shrink-0 items-center justify-center">
                  <img
                    src={item.icon}
                    alt=""
                    className="block max-h-4 max-w-5 object-contain brightness-0 dark:invert"
                  />
                </span>
                <span className="px-5 text-sm font-extrabold uppercase sm:px-8 sm:text-base">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
