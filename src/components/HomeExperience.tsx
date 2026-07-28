import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  ArrowDown,
  ArrowUpRight,
  Braces,
  Cloud,
  Database,
  Layers3,
  MoveRight,
} from 'lucide-react'
import { motion, useScroll, useTransform } from 'motion/react'
import * as THREE from 'three'
import Footer from './Footer'
import Logo from './Logo'
import SiteHeader from './SiteHeader'
import { clientWork, personalProjects } from '~/data/work'
import type { WorkItem } from '~/data/work'
import getFormattedDate from '~/lib/getFormattedDate'
import { getRecentArticles, getRecentExperiences } from '~/lib/sanity'
import { cn } from '~/lib/utils'

const visualStyles = {
  blackhole: 'bg-[#7867ff] text-[#faff00]',
  superverse: 'bg-[#d8ff52] text-[#10100f]',
  impostors: 'bg-[#ff694a] text-[#10100f]',
  pico: 'bg-[#d8d5cd] text-[#10100f]',
  chromagine: 'bg-[#335cff] text-white',
} satisfies Record<WorkItem['visual'], string>

export const capabilities = [
  {
    number: '01',
    title: 'Product thinking',
    description:
      'I turn fuzzy requirements into focused user flows, clear priorities, and interfaces people understand quickly.',
  },
  {
    number: '02',
    title: 'Frontend systems',
    description:
      'Responsive React interfaces, design systems, accessible interactions, motion, and performance built for production.',
  },
  {
    number: '03',
    title: 'Application engineering',
    description:
      'Typed APIs, authentication, realtime data, forms, content workflows, and the unglamorous details that make software reliable.',
  },
  {
    number: '04',
    title: 'Creative direction',
    description:
      'A strong visual point of view, translated into art direction and interaction—not lost between a mockup and the browser.',
  },
] as const

const stack = [
  { name: 'React', icon: '/icons/stack/react.svg' },
  { name: 'TypeScript', icon: '/icons/stack/typescript.svg' },
  { name: 'TanStack', icon: '/icons/stack/tanstack.svg' },
  { name: 'Motion', icon: '/icons/stack/motion.svg' },
  { name: 'Convex', icon: '/icons/stack/convex.svg' },
  { name: 'Sanity', icon: '/icons/stack/sanity.svg' },
  { name: 'Cloudflare', icon: '/icons/stack/cloudflare.svg' },
  { name: 'Better Auth', icon: '/icons/stack/better-auth.svg' },
] as const

const chromaginePetals = [
  '#ff375f',
  '#ff9f0a',
  '#ffd60a',
  '#30d158',
  '#64d2ff',
  '#0a84ff',
  '#bf5af2',
  '#ff2d95',
] as const

function ProjectVisual({
  project,
  index,
  linked = true,
}: {
  project: WorkItem
  index: number
  linked?: boolean
}) {
  return (
    <div
      className={cn(
        'site-noise relative aspect-[4/3] overflow-hidden rounded-[2px]',
        visualStyles[project.visual],
      )}
    >
      <div className="project-lines absolute inset-0 opacity-40" />
      <span className="absolute top-5 left-5 z-10 font-mono text-[10px] font-medium tracking-[0.18em] uppercase opacity-55 sm:top-7 sm:left-7">
        Case study / 0{index + 1}
      </span>
      <span className="font-display absolute right-5 bottom-0 text-[clamp(7rem,20vw,17rem)] leading-[0.65] opacity-[0.08] sm:right-8">
        {index + 1}
      </span>

      {project.visual === 'blackhole' && (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/2 left-1/2 size-[65%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#faff00]/35"
          />
          <div className="absolute top-1/2 left-1/2 flex size-[44%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#10100f] shadow-[0_40px_100px_rgba(0,0,0,0.35)]">
            <img
              src={project.image}
              alt=""
              className="size-[68%] object-contain"
            />
          </div>
        </>
      )}

      {project.visual === 'superverse' && (
        <>
          <div className="absolute -right-[15%] -bottom-[38%] size-[90%] rounded-full border-[clamp(35px,7vw,90px)] border-[#10100f]" />
          <motion.img
            src={project.image}
            alt=""
            initial={{ rotate: -8, scale: 0.9 }}
            whileInView={{ rotate: 3, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-1/2 left-1/2 w-[42%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_30px_35px_rgba(0,0,0,0.22)]"
          />
        </>
      )}

      {project.visual === 'impostors' && (
        <>
          <div className="absolute top-[15%] right-[10%] size-20 rounded-full bg-[#20c9ed] sm:size-32" />
          <div className="absolute bottom-[12%] left-[8%] size-16 rounded-full bg-[#ffe66d] sm:size-24" />
          <motion.img
            src={project.image}
            alt=""
            initial={{ y: 35, rotate: -4 }}
            whileInView={{ y: 0, rotate: 2 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            className="absolute right-[12%] bottom-[3%] w-[70%] drop-shadow-[0_35px_35px_rgba(71,18,8,0.25)]"
          />
        </>
      )}

      {project.visual === 'pico' && (
        <>
          <div className="absolute inset-[12%] border border-black/20" />
          <div className="absolute top-[12%] bottom-[12%] left-1/2 w-px bg-black/20" />
          <motion.img
            src={project.image}
            alt=""
            whileHover={{ scale: 1.08, rotate: -4 }}
            className="absolute top-1/2 left-1/2 w-[29%] -translate-x-1/2 -translate-y-1/2 rounded-[18%] shadow-[0_30px_60px_rgba(0,0,0,0.25)]"
          />
        </>
      )}

      {project.visual === 'chromagine' && (
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 size-[58%] -translate-x-1/2 -translate-y-1/2"
        >
          {chromaginePetals.map((color, petalIndex) => (
            <span
              key={color}
              className="pointer-events-none absolute inset-0"
              style={{ transform: `rotate(${petalIndex * 45}deg)` }}
            >
              <motion.span
                initial={{ scale: 0.65, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  delay: petalIndex * 0.05,
                  type: 'spring',
                  stiffness: 220,
                  damping: 18,
                }}
                className="pointer-events-none absolute inset-0"
              >
                <motion.span
                  whileHover={{ scale: 1.14, y: -10, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 320,
                    damping: 18,
                  }}
                  className="pointer-events-auto absolute top-[2%] left-1/2 h-[43%] w-[29%] origin-bottom -translate-x-1/2 cursor-pointer rounded-[999px] border border-white/35 opacity-90 mix-blend-screen shadow-[0_12px_30px_rgba(16,16,15,0.14)] backdrop-blur-[2px]"
                  style={{ backgroundColor: color }}
                />
              </motion.span>
            </span>
          ))}
        </div>
      )}

      {linked ? (
        <a
          href={project.href}
          target="_blank"
          rel="noreferrer"
          className="absolute right-5 bottom-5 z-30 flex size-12 items-center justify-center rounded-full bg-[#10100f] text-white transition-transform hover:scale-105 hover:rotate-6 sm:right-7 sm:bottom-7 sm:size-14"
          aria-label={`Open ${project.title}`}
        >
          <ArrowUpRight className="size-5" />
        </a>
      ) : (
        <span
          aria-hidden="true"
          className="absolute right-5 bottom-5 z-30 flex size-12 items-center justify-center rounded-full bg-[#10100f] text-white transition-transform group-hover:scale-105 group-hover:rotate-6 sm:right-7 sm:bottom-7 sm:size-14"
        >
          <ArrowUpRight className="size-5" />
        </span>
      )}
    </div>
  )
}

export function FeaturedProject({
  project,
  index,
}: {
  project: WorkItem
  index: number
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className="grid gap-7 border-t border-black/20 py-10 first:border-t-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:gap-12 lg:py-16"
    >
      <ProjectVisual project={project} index={index} />
      <div className="flex flex-col lg:py-3">
        <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.16em] text-black/45 uppercase">
          <span>{project.category}</span>
          <span>{project.year}</span>
        </div>
        <h3 className="font-display mt-7 text-[clamp(3.8rem,7vw,7rem)] leading-[0.8] tracking-[-0.05em]">
          {project.title}
        </h3>
        <p className="mt-7 max-w-md text-base leading-7 text-black/60">
          {project.description}
        </p>
        <div className="mt-7 border-l border-black/25 pl-4">
          <p className="font-mono text-[9px] tracking-[0.16em] text-black/40 uppercase">
            Contribution
          </p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-black/55">
            {project.contribution}
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          {project.tools.map((tool) => (
            <span
              key={tool}
              className="rounded-full border border-black/20 px-3 py-1.5 text-[10px] font-semibold"
            >
              {tool}
            </span>
          ))}
        </div>
        <a
          href={project.href}
          target="_blank"
          rel="noreferrer"
          className="group mt-auto flex items-center justify-between border-b border-black/25 pt-10 pb-3 text-xs font-bold uppercase"
        >
          Visit live project
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
        </a>
      </div>
    </motion.article>
  )
}

export function IndependentProject({
  project,
  index,
}: {
  project: WorkItem
  index: number
}) {
  return (
    <motion.a
      href={project.href}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group block rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
    >
      <ProjectVisual
        project={project}
        index={index + clientWork.length}
        linked={false}
      />
      <div className="py-5">
        <div>
          <p className="font-mono text-[9px] tracking-[0.16em] text-black/40 uppercase">
            {project.category}
          </p>
          <h3 className="font-display mt-2 text-4xl tracking-[-0.04em] sm:text-5xl">
            {project.title}
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-black/55">
            {project.description}
          </p>
        </div>
      </div>
    </motion.a>
  )
}

function ProductModel() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
    camera.position.z = 7.5

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const particlePositions: number[] = []
    const particleColors: number[] = []
    const gridSize = 15
    const cubeSize = 2.6
    const step = cubeSize / (gridSize - 1)
    const color = new THREE.Color('#d9ff43')
    const accent = new THREE.Color('#8da4ff')

    for (let x = 0; x < gridSize; x += 1) {
      for (let y = 0; y < gridSize; y += 1) {
        for (let z = 0; z < gridSize; z += 1) {
          const isOnSurface =
            x === 0 ||
            x === gridSize - 1 ||
            y === 0 ||
            y === gridSize - 1 ||
            z === 0 ||
            z === gridSize - 1

          if (!isOnSurface) continue

          particlePositions.push(
            x * step - cubeSize / 2,
            y * step - cubeSize / 2,
            z * step - cubeSize / 2,
          )

          const particleColor = color
            .clone()
            .lerp(accent, (z / gridSize) * 0.35)
          particleColors.push(particleColor.r, particleColor.g, particleColor.b)
        }
      }
    }

    const cubePositions = new Float32Array(particlePositions)
    const particleCount = cubePositions.length / 3
    const spherePositions = new Float32Array(particleCount * 3)
    const goldenAngle = Math.PI * (3 - Math.sqrt(5))
    const sphereRadius = 1.45

    for (let index = 0; index < particleCount; index += 1) {
      const normalizedY = 1 - (index / (particleCount - 1)) * 2
      const horizontalRadius = Math.sqrt(1 - normalizedY * normalizedY)
      const angle = goldenAngle * index
      const offset = index * 3
      spherePositions[offset] =
        Math.cos(angle) * horizontalRadius * sphereRadius
      spherePositions[offset + 1] = normalizedY * sphereRadius
      spherePositions[offset + 2] =
        Math.sin(angle) * horizontalRadius * sphereRadius
    }

    const geometry = new THREE.BufferGeometry()
    const positionAttribute = new THREE.Float32BufferAttribute(
      cubePositions.slice(),
      3,
    )
    geometry.setAttribute('position', positionAttribute)
    geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(particleColors, 3),
    )

    const material = new THREE.PointsMaterial({
      size: 0.045,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
    })
    const cube = new THREE.Points(geometry, material)
    cube.rotation.set(-0.35, 0.55, 0.08)
    scene.add(cube)

    const clock = new THREE.Clock()
    let isDragging = false
    let morphProgress = 0
    let morphTarget = 0
    let lastPointerX = 0
    let lastPointerY = 0
    let isVisible = true
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect()
      if (width === 0 || height === 0) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry?.isIntersecting ?? true
    })
    intersectionObserver.observe(canvas)

    const handlePointerDown = (event: PointerEvent) => {
      isDragging = true
      lastPointerX = event.clientX
      lastPointerY = event.clientY
      canvas.setPointerCapture(event.pointerId)
    }

    const handlePointerEnter = () => {
      morphTarget = 1
    }

    const handlePointerLeave = () => {
      morphTarget = 0
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging) return
      cube.rotation.y += (event.clientX - lastPointerX) * 0.008
      cube.rotation.x += (event.clientY - lastPointerY) * 0.008
      lastPointerX = event.clientX
      lastPointerY = event.clientY
    }

    const handlePointerUp = (event: PointerEvent) => {
      isDragging = false
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId)
      }
    }

    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointerenter', handlePointerEnter)
    canvas.addEventListener('pointerleave', handlePointerLeave)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointercancel', handlePointerUp)

    renderer.setAnimationLoop(() => {
      const delta = Math.min(clock.getDelta(), 0.05)
      if (!isVisible) return

      if (Math.abs(morphProgress - morphTarget) > 0.001) {
        const morphDamping = 1 - Math.exp(-4.03 * delta)
        morphProgress = THREE.MathUtils.lerp(
          morphProgress,
          morphTarget,
          morphDamping,
        )
        const easedMorph = THREE.MathUtils.smoothstep(morphProgress, 0, 1)

        for (let index = 0; index < positionAttribute.count; index += 1) {
          const offset = index * 3
          positionAttribute.array[offset] = THREE.MathUtils.lerp(
            cubePositions[offset] ?? 0,
            spherePositions[offset] ?? 0,
            easedMorph,
          )
          positionAttribute.array[offset + 1] = THREE.MathUtils.lerp(
            cubePositions[offset + 1] ?? 0,
            spherePositions[offset + 1] ?? 0,
            easedMorph,
          )
          positionAttribute.array[offset + 2] = THREE.MathUtils.lerp(
            cubePositions[offset + 2] ?? 0,
            spherePositions[offset + 2] ?? 0,
            easedMorph,
          )
        }
        positionAttribute.needsUpdate = true
      }

      if (!isDragging && !reduceMotion) {
        cube.rotation.y += 0.132 * delta
        cube.rotation.x += 0.036 * delta
      }
      renderer.render(scene, camera)
    })

    return () => {
      renderer.setAnimationLoop(null)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointerenter', handlePointerEnter)
      canvas.removeEventListener('pointerleave', handlePointerLeave)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointercancel', handlePointerUp)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div className="product-model hidden lg:block">
      <canvas
        ref={canvasRef}
        className="product-model-canvas"
        aria-label="A rotating particle cube that becomes a sphere on hover. Drag to rotate it."
        role="img"
      />
    </div>
  )
}

function HomeHero() {
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const orbY = useTransform(scrollYProgress, [0, 1], [0, 240])

  return (
    <section
      ref={heroRef}
      className="site-noise relative flex flex-1 overflow-hidden bg-[#10100f] pt-[72px] text-[#f1efe8]"
    >
      <div className="hero-grid absolute inset-0" />
      <motion.div
        style={{ y: orbY }}
        className="absolute top-[12%] right-[-20%] size-[70vw] rounded-full bg-[#335cff] opacity-35 blur-[100px] sm:right-[-30%] sm:size-[60vw]"
      />
      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col px-5 pt-9 pb-7 sm:px-8 sm:pt-14 lg:px-12 lg:pt-16">
        <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.2em] text-white/45 uppercase sm:text-[10px]">
          <span>Full-stack product engineer</span>
          <span className="hidden sm:block">
            Design-led · Production-minded
          </span>
          <span>US / Remote</span>
        </div>

        <motion.div className="mt-auto lg:grid lg:grid-cols-[minmax(0,1fr)_clamp(260px,25vw,410px)] lg:items-center lg:gap-8">
          <h1 className="max-w-[960px] text-[clamp(2.75rem,5vw,5.5rem)] leading-[0.8] font-extrabold tracking-[-0.02em] uppercase">
            <motion.span
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="block"
            >
              I design and build
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.08,
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="font-display block pl-[9vw] font-normal text-[#d9ff43] normal-case italic"
            >
              full-stack
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.16,
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="block"
            >
              digital products.
            </motion.span>
          </h1>
          <ProductModel />
        </motion.div>

        <div className="mt-auto grid gap-8 border-t border-white/15 pt-5 sm:grid-cols-[1fr_auto] sm:items-end lg:grid-cols-[1fr_1fr_auto]">
          <p className="hidden max-w-xs font-mono text-[9px] leading-5 tracking-[0.14em] text-white/35 uppercase lg:block">
            Strategy / UX / Visual systems / Frontend / APIs / Data / Delivery
          </p>
          <p className="max-w-lg text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
            I turn ambitious ideas into polished, production-ready
            software—shaping the UX, building the interface, connecting the
            systems, and carrying it through delivery.
          </p>
          <a
            href="#work"
            className="flex size-14 items-center justify-center rounded-full border border-white/25 transition-colors hover:bg-[#d9ff43] hover:text-[#10100f]"
            aria-label="See selected work"
          >
            <ArrowDown className="size-5" />
          </a>
        </div>
      </div>
    </section>
  )
}

function StackMarquee() {
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
      className="overflow-hidden border-y border-black/15 bg-[#d9ff43] py-4 text-[#10100f] sm:py-5"
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
                    className="block max-h-4 max-w-5 object-contain"
                  />
                </span>
                <span className="px-5 text-sm font-extrabold tracking-[-0.02em] uppercase sm:px-8 sm:text-base">
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

export default function HomeExperience() {
  const { data: articles = [] } = useQuery({
    queryKey: ['recentArticles'],
    queryFn: () => getRecentArticles(3),
  })
  const { data: experiences = [] } = useQuery({
    queryKey: ['recentExperiences'],
    queryFn: () => getRecentExperiences(1),
  })
  const currentRole = experiences[0]

  return (
    <div className="home-page overflow-x-hidden bg-[#f1efe8] text-[#151513]">
      <SiteHeader />
      <main>
        <div className="flex min-h-svh flex-col">
          <HomeHero />
          <StackMarquee />
        </div>

        <section
          id="work"
          className="mx-auto max-w-[1600px] scroll-mt-[71px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36"
        >
          <header className="grid gap-7 border-b border-black/20 pb-12 lg:grid-cols-[1fr_1fr] lg:items-end lg:pb-20">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-black/45 uppercase">
                Selected work / 2023—2026
              </p>
              <h2 className="font-display mt-5 text-[clamp(4rem,9vw,8rem)] leading-[0.78] tracking-[-0.06em]">
                Built for the
                <br />
                <em className="text-[#335cff]">real world.</em>
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-black/55 lg:justify-self-end lg:text-lg lg:leading-8">
              Product experiences where visual ambition and engineering rigor
              have to coexist. I care about the concept, the system, and the
              final 2px in production.
            </p>
          </header>

          <div>
            {clientWork.map((project, index) => (
              <FeaturedProject
                key={project.title}
                project={project}
                index={index}
              />
            ))}
          </div>

          <div className="mt-16 border-t border-black/20 pt-8 lg:mt-24 lg:pt-12">
            <div className="mb-10 flex items-end justify-between gap-6">
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] text-black/40 uppercase">
                  Self-directed
                </p>
                <h2 className="font-display mt-2 text-5xl tracking-[-0.045em] sm:text-7xl">
                  Independent builds
                </h2>
              </div>
              <a
                href="https://github.com/alivault"
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-2 text-xs font-bold sm:flex"
              >
                More on GitHub <ArrowUpRight className="size-4" />
              </a>
            </div>
            <div className="grid gap-10 lg:grid-cols-2">
              {personalProjects.map((project, index) => (
                <IndependentProject
                  key={project.title}
                  project={project}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#10100f] text-[#f1efe8]">
          <div className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
            <header className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] text-[#d9ff43] uppercase">
                  One brain, both sides of the build
                </p>
                <h2 className="mt-5 text-[clamp(3.1rem,9vw,8.5rem)] leading-[0.76] font-extrabold tracking-[-0.07em] uppercase">
                  Beautiful
                  <br />
                  <span className="font-display font-normal text-[#d9ff43] normal-case italic">
                    on the surface.
                  </span>
                  <br />
                  Serious
                  <br />
                  underneath.
                </h2>
              </div>
              <p className="max-w-lg text-base leading-7 text-white/55 lg:justify-self-end lg:text-lg lg:leading-8">
                I bridge product design and full-stack engineering, so the idea
                survives implementation—and the implementation holds up after
                launch.
              </p>
            </header>

            <div className="mt-20 border-t border-white/15 lg:mt-28">
              {capabilities.map((capability) => (
                <motion.article
                  key={capability.number}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="group grid gap-4 border-b border-white/15 py-7 transition-colors hover:text-[#d9ff43] sm:grid-cols-[80px_1fr_1fr] sm:items-center sm:py-9"
                >
                  <span className="font-mono text-[10px] text-white/30">
                    {capability.number}
                  </span>
                  <h3 className="font-display text-4xl tracking-[-0.035em] sm:text-5xl">
                    {capability.title}
                  </h3>
                  <p className="max-w-xl text-sm leading-6 text-white/45 transition-colors group-hover:text-[#d9ff43]/60 sm:justify-self-end">
                    {capability.description}
                  </p>
                </motion.article>
              ))}
            </div>

            <div className="mt-20 rounded-[2px] border border-white/15 bg-white/[0.03] p-5 sm:p-8 lg:mt-28 lg:p-10">
              <div className="flex flex-col justify-between gap-5 border-b border-white/15 pb-7 sm:flex-row sm:items-center">
                <div>
                  <p className="flex items-center gap-2 text-xs font-bold">
                    <span className="size-2 rounded-full bg-[#d9ff43] shadow-[0_0_12px_#d9ff43]" />
                    This portfolio is a live full-stack system
                  </p>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/40">
                    Not a static mockup: server rendering, managed content,
                    authentication, realtime comments, transactional email, and
                    edge deployment.
                  </p>
                </div>
                <span className="font-mono text-[9px] tracking-[0.18em] text-white/25 uppercase">
                  Production architecture
                </span>
              </div>
              <div className="grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                {[
                  {
                    icon: Layers3,
                    label: 'Interface',
                    value: 'React · TanStack · Motion',
                  },
                  {
                    icon: Braces,
                    label: 'Application',
                    value: 'TypeScript · Query · Forms',
                  },
                  {
                    icon: Database,
                    label: 'Data & identity',
                    value: 'Convex · Sanity · Better Auth',
                  },
                  {
                    icon: Cloud,
                    label: 'Delivery',
                    value: 'Cloudflare · Vite+',
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="py-7 sm:px-7 lg:py-8">
                    <Icon className="size-5 text-[#d9ff43]" strokeWidth={1.5} />
                    <p className="mt-8 text-xs font-bold">{label}</p>
                    <p className="mt-2 text-[11px] text-white/35">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <StackMarquee />

        <section className="overflow-hidden bg-[#335cff] text-white">
          <div className="mx-auto grid max-w-[1600px] lg:grid-cols-2">
            <div className="relative min-h-[520px] overflow-hidden border-white/20 p-5 sm:p-8 lg:min-h-[760px] lg:border-r lg:p-12">
              <div className="absolute -right-[25%] -bottom-[15%] size-[80%] rounded-full border-[60px] border-[#d9ff43] opacity-90 sm:border-[90px]" />
              <div className="absolute top-[18%] left-[16%] size-40 rounded-full bg-[#ff694a] blur-[1px] sm:size-64" />
              <motion.div
                whileInView={{ rotate: 8, y: -12 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-[20%] flex items-center justify-center border border-white/30 bg-white/10 backdrop-blur-xl"
              >
                <Logo className="h-auto w-[58%] text-[#d9ff43]" />
              </motion.div>
              <p className="relative font-mono text-[9px] tracking-[0.18em] text-white/55 uppercase">
                Design engineer · Builder · Collaborator
              </p>
            </div>
            <div className="flex flex-col justify-between px-5 py-16 sm:px-8 sm:py-20 lg:p-12 lg:py-16">
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] text-[#d9ff43] uppercase">
                  About Ali
                </p>
                <h2 className="font-display mt-7 text-[clamp(3.5rem,7vw,7rem)] leading-[0.79] tracking-[-0.055em]">
                  I don’t hand designs over to engineering.
                  <em className="block text-[#d9ff43]">
                    I am the engineering.
                  </em>
                </h2>
                <p className="mt-9 max-w-xl text-base leading-8 text-white/65">
                  That overlap means fewer gaps between intent and
                  implementation, faster iteration, and products that keep their
                  character all the way to production. I’m equally at home
                  refining a visual system, shaping component architecture, or
                  connecting the services behind it.
                </p>
              </div>
              <div className="mt-16 border-t border-white/25">
                <div className="grid grid-cols-[120px_1fr] border-b border-white/25 py-5 text-sm">
                  <span className="text-white/40">Currently</span>
                  <span className="font-semibold">
                    {currentRole
                      ? `${currentRole.title} · ${currentRole.company}`
                      : 'Front-end Developer · Super Studios'}
                  </span>
                </div>
                <div className="grid grid-cols-[120px_1fr] border-b border-white/25 py-5 text-sm">
                  <span className="text-white/40">Focus</span>
                  <span className="font-semibold">
                    Product engineering · Creative frontend
                  </span>
                </div>
                <Link
                  to="/experience"
                  className="group flex items-center justify-between pt-7 text-xs font-bold uppercase"
                >
                  View full experience
                  <MoveRight className="size-5 transition-transform group-hover:translate-x-2" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
          <div className="flex items-end justify-between gap-6 border-b border-black/20 pb-10">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-black/40 uppercase">
                Field notes
              </p>
              <h2 className="font-display mt-3 text-[clamp(4rem,9vw,8rem)] leading-[0.8] tracking-[-0.055em]">
                Thinking in public.
              </h2>
            </div>
            <Link
              to="/notes"
              className="hidden items-center gap-2 text-xs font-bold sm:flex"
            >
              All notes <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div>
            {articles.length === 0 ? (
              <p className="py-12 text-sm text-black/45">
                New notes are in progress. Check back soon.
              </p>
            ) : (
              articles.map((article, index) => (
                <Link
                  key={article._id}
                  to="/notes/$slug"
                  params={{ slug: article.slug.current }}
                  className="group grid gap-4 border-b border-black/20 py-7 sm:grid-cols-[60px_1fr_auto] sm:items-center sm:py-9"
                >
                  <span className="font-mono text-[9px] text-black/35">
                    0{index + 1}
                  </span>
                  <span>
                    <span className="font-display block text-3xl tracking-[-0.025em] transition-transform duration-500 group-hover:translate-x-2 sm:text-5xl">
                      {article.title}
                    </span>
                    <span className="mt-2 block text-xs text-black/40">
                      {getFormattedDate(article.date)}
                    </span>
                  </span>
                  <ArrowUpRight className="hidden size-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 sm:block" />
                </Link>
              ))
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
