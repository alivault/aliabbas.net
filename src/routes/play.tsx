import { createFileRoute, Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, Code, Gamepad2, Layers, Move3d } from 'lucide-react'
import Main from '~/components/Main'
import ScrollReveal from '~/components/ScrollReveal'
import BeforeAfter from '~/components/play/BeforeAfter'
import ControlsTabs from '~/components/play/ControlsTabs'
import TrailerVideo from '~/components/play/TrailerVideo'
import '@fontsource/chakra-petch/latin-600.css'
import '@fontsource/chakra-petch/latin-700-italic.css'

const GAME_URL = 'https://averno.aliabbas.net'
const VERSION = '0.1'
const UPDATED = '9 October 2026'

const TITLE = 'Averno — a free 3D shooter you play in your browser'
const DESCRIPTION =
  'Fly a mining ship in any direction through a dead colony, destroy its three reactors, and escape before each one blows. Free, with nothing to install.'
const OG_IMAGE = 'https://aliabbas.net/play/averno-og.jpg'
const OG_ALT =
  'Averno: the Overseer robot above a reactor in a hall of cracked lava rock'

const facts = [
  'Free',
  'Nothing to install',
  'Three levels',
  'Keyboard, gamepad or touch',
]

const features: Array<{ icon: LucideIcon; title: string; text: string }> = [
  {
    icon: Move3d,
    title: 'Six degrees of freedom',
    text: 'There is no up. Fly, strafe, slide and roll through tunnels in any direction.',
  },
  {
    icon: Layers,
    title: 'Three levels',
    text: 'Access keys, locked doors, survivors to rescue and a timed escape after each reactor.',
  },
  {
    icon: Code,
    title: 'Made from code',
    text: 'Procedural textures, baked light, synthesized sound and robots built in Blender.',
  },
  {
    icon: Gamepad2,
    title: 'Plays anywhere',
    text: 'Keyboard and mouse, a gamepad, or touch controls on a phone.',
  },
]

const levels = [
  {
    name: 'The Intake',
    place: 'Upper works',
    text: 'Rock shafts and ore halls lit by sodium lamps. Learn to fly, find the blue access key, then destroy the first reactor and climb out through the gallery.',
    image: '/play/averno-intake-hall.webp',
    imageAlt: 'An empty ore hall in The Intake with robots in the distance',
    action: '/play/averno-intake-action.webp',
    actionAlt: 'A robot explodes in an ore hall of The Intake',
  },
  {
    name: 'The Refinery',
    place: 'Ore processing',
    text: 'The refinery still runs, and its acid tanks light the dark green. Find a blue key in the settling pool and a gold key in the pump station to reach the core.',
    image: '/play/averno-refinery.webp',
    imageAlt: 'Pump machinery in The Refinery',
    action: '/play/averno-refinery-action.webp',
    actionAlt: 'Robots guard the reactor of The Refinery',
  },
  {
    name: 'The Crucible',
    place: 'The magma halls',
    text: 'At the bottom of the mine, the miners hit magma. The Overseer AI took the core for itself and shields the last reactor. Destroy it, then make the long climb out.',
    image: '/play/averno-crucible-core.webp',
    imageAlt: 'The last reactor on a floor of cracked lava rock',
    action: '/play/averno-crucible-action.webp',
    actionAlt: 'Plasma fire around the last reactor in The Crucible',
  },
]

const stack = [
  'Three.js',
  'React',
  'WebGL 2',
  'three-mesh-bvh',
  'postprocessing',
  'Web Audio',
  'Blender and Python',
  'Cloudflare',
]

export const Route = createFileRoute('/play')({
  head: () => ({
    meta: [
      { title: 'Averno — Ali Abbas' },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:url', content: 'https://aliabbas.net/play' },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: OG_IMAGE },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:type', content: 'image/jpeg' },
      { property: 'og:image:alt', content: OG_ALT },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: TITLE },
      { name: 'twitter:description', content: DESCRIPTION },
      { name: 'twitter:image', content: OG_IMAGE },
      { name: 'twitter:image:alt', content: OG_ALT },
    ],
  }),
  component: PlayPage,
})

function PlayLink({ className = '' }: { className?: string }) {
  return (
    <a
      href={GAME_URL}
      className={`st-cut st-btn-primary st-display inline-flex h-14 items-center gap-3 px-7 text-lg font-semibold uppercase ${className}`}
    >
      Play Averno
      <ArrowUpRight size={20} />
    </a>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="st-display text-4xl leading-none font-bold uppercase italic sm:text-5xl">
      {children}
    </h2>
  )
}

function PlayPage() {
  return (
    <Main>
      <section className="relative isolate overflow-hidden bg-black bg-clip-padding text-white">
        <TrailerVideo className="absolute inset-0 -z-10 size-full object-cover" />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-t from-black via-black/50 to-black/10"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-r from-black/70 to-transparent"
        />
        <ScrollReveal
          trigger="mount"
          className="mx-auto flex min-h-[min(82svh,880px)] max-w-[1600px] flex-col justify-end px-5 pt-40 pb-14 sm:px-8 lg:px-12 lg:pb-20"
        >
          <h1 className="st-display text-7xl leading-none font-bold italic sm:text-8xl lg:text-9xl">
            Averno
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/80 lg:text-lg lg:leading-8">
            A free 3D shooter that you play in your browser. Fly a mining ship
            in any direction through the tunnels of a dead colony, destroy its
            three reactors, and escape before each one blows.
          </p>
          <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
            <PlayLink className="self-start" />
            <ul className="st-display flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold tracking-wider text-white/60 uppercase">
              {facts.map((fact) => (
                <li
                  key={fact}
                  className="flex items-center gap-4 first:[&>span]:hidden"
                >
                  <span
                    aria-hidden="true"
                    className="hidden size-1 bg-white/40 sm:block"
                  />
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </section>

      <div className="py-section mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <ScrollReveal
          as="section"
          className="grid gap-10 lg:grid-cols-[2fr_3fr] lg:items-center lg:gap-16"
        >
          <div>
            <SectionTitle>Forty days of silence</SectionTitle>
            <div className="text-foreground/70 mt-6 space-y-4 text-base leading-7 lg:text-lg lg:leading-8">
              <p>
                Averno stopped answering forty days ago. Its mining robots
                turned on the crew, and the reactors that power the colony still
                run.
              </p>
              <p>
                You fly a small mining ship down through the colony. Find the
                access keys, rescue the survivors you can, and destroy each
                reactor. Then race the countdown back to the exit.
              </p>
            </div>
          </div>
          <figure>
            <img
              src="/play/averno-intake-escape.webp"
              alt="The game HUD during an escape: a self-destruct countdown of 49 seconds, a survivor rescued and a robot close ahead"
              width={1600}
              height={900}
              loading="lazy"
              className="st-cut aspect-video w-full bg-black object-cover"
            />
            <figcaption className="text-foreground/50 mt-3 text-sm">
              When a reactor goes, the exit opens and the countdown starts.
            </figcaption>
          </figure>
        </ScrollReveal>

        <ScrollReveal className="border-foreground/15 mt-20 grid gap-10 border-t pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <Icon size={28} strokeWidth={1.5} aria-hidden="true" />
              <h3 className="st-display mt-4 text-lg font-semibold uppercase">
                {title}
              </h3>
              <p className="text-foreground/60 mt-2 leading-7">{text}</p>
            </div>
          ))}
        </ScrollReveal>

        <section className="mt-28" aria-labelledby="levels">
          <ScrollReveal>
            <h2
              id="levels"
              className="st-display text-4xl leading-none font-bold uppercase italic sm:text-5xl"
            >
              Three levels down
            </h2>
          </ScrollReveal>
          <ol className="mt-12 space-y-20 lg:space-y-28">
            {levels.map((level, index) => (
              <ScrollReveal
                as="li"
                key={level.name}
                className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-12"
              >
                <div
                  className={`group st-cut relative aspect-video overflow-hidden bg-black lg:col-span-7 ${
                    index % 2 ? 'lg:order-2 lg:col-start-6' : ''
                  }`}
                >
                  <img
                    src={level.image}
                    alt={level.imageAlt}
                    width={1600}
                    height={900}
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover"
                  />
                  <img
                    src={level.action}
                    alt={level.actionAlt}
                    width={1600}
                    height={900}
                    loading="lazy"
                    className="absolute inset-0 size-full scale-105 object-cover opacity-0 transition-[opacity,scale] duration-500 group-hover:scale-100 group-hover:opacity-100"
                  />
                </div>
                <div
                  className={`lg:col-span-5 ${index % 2 ? 'lg:order-1' : ''}`}
                >
                  <p className="st-display text-foreground/45 text-sm font-semibold tracking-widest uppercase">
                    Level {index + 1} · {level.place}
                  </p>
                  <h3 className="st-display mt-2 text-4xl leading-none font-bold uppercase italic sm:text-5xl">
                    {level.name}
                  </h3>
                  <p className="text-foreground/65 mt-5 max-w-lg text-base leading-7 lg:text-lg lg:leading-8">
                    {level.text}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </ol>
        </section>

        <ScrollReveal as="section" className="mt-28">
          <SectionTitle>Controls</SectionTitle>
          <p className="text-foreground/65 mt-5 max-w-2xl text-base leading-7 lg:text-lg lg:leading-8">
            Six degrees of freedom takes a few minutes to learn. Turn with the
            mouse, then use roll and slide to dodge. In the game settings, you
            can change the look speed and turn on auto-level.
          </p>
          <div className="mt-8">
            <ControlsTabs />
          </div>
        </ScrollReveal>

        <ScrollReveal
          as="section"
          className="mt-28 grid gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16"
        >
          <div>
            <SectionTitle>How it’s made</SectionTitle>
            <div className="text-foreground/70 mt-6 space-y-4 leading-7">
              <p>
                Averno runs on WebGL 2 with Three.js, and the menus and HUD are
                React. Each level is a set of connected cube segments, like the
                mines in the six-degrees-of-freedom shooters of the 1990s.
              </p>
              <p>
                When a level loads, a web worker bakes the light into every
                vertex: direct light with shadows, one bounce and ambient
                occlusion. It also bakes light probes, so robots and pickups
                match the room around them.
              </p>
              <p>
                A build script makes every texture from noise. A Python script
                builds the robots in Blender and exports them as glTF. The sound
                effects are synthesized in code, and the music plays live
                through the Web Audio API.
              </p>
            </div>
            <ul className="mt-8 flex flex-wrap gap-2">
              {stack.map((item) => (
                <li
                  key={item}
                  className="st-display border-foreground/15 text-foreground/70 border px-3 py-1 text-sm font-semibold uppercase"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <figure className="lg:pt-2">
            <BeforeAfter
              before={{
                src: '/play/averno-made-lit.webp',
                alt: 'The Crucible as you see it in the game',
                label: 'In game',
              }}
              after={{
                src: '/play/averno-made-wireframe.webp',
                alt: 'The same view of The Crucible as a wireframe',
                label: 'Wireframe',
              }}
            />
            <figcaption className="text-foreground/50 mt-3 text-sm">
              The Overseer above the last reactor. Drag to see the geometry.
            </figcaption>
          </figure>
        </ScrollReveal>

        <ScrollReveal className="border-foreground/15 mt-28 border-t pt-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="st-display text-4xl leading-none font-bold uppercase italic sm:text-5xl">
                Nothing to install
              </p>
              <p className="text-foreground/65 mt-4 max-w-xl leading-7">
                Averno opens in your browser on a computer or a phone. Your
                progress saves on your device.
              </p>
            </div>
            <PlayLink className="self-start lg:self-auto" />
          </div>
          <p className="text-foreground/45 mt-10 text-sm">
            Version {VERSION} · Updated {UPDATED} · Found a bug?{' '}
            <Link
              to="/contact"
              className="text-foreground/70 hover:text-foreground underline underline-offset-4"
            >
              Tell me about it
            </Link>
          </p>
        </ScrollReveal>
      </div>
    </Main>
  )
}
