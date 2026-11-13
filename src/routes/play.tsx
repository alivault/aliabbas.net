import { createFileRoute } from '@tanstack/react-router'
import {
  Line,
  Reader,
  ReaderExternal,
  ReaderFigure,
  ReaderLink,
  ReaderLinks,
  ReaderList,
  ReaderMeta,
  ReaderSection,
  ReaderText,
  ReaderTitle,
  hudText,
} from '~/components/reader/Reader'

const GAME_URL = 'https://averno.aliabbas.net'
const VERSION = '0.1'
const UPDATED = '9 October 2026'
const NOTE_SLUG = 'averno-engineering-a-3d-shooter-for-the-browser'

const TITLE = 'Averno — a free 3D shooter you play in your browser'
const DESCRIPTION =
  'Fly a mining ship in all directions through a dead colony. Destroy its three reactors, and escape before each one explodes. It is free, and you do not install anything.'
const OG_IMAGE = 'https://aliabbas.net/play/averno-og.jpg'
const OG_ALT =
  'Averno: the Overseer robot above a reactor in a hall of cracked lava rock'

const facts = [
  'Free',
  'Nothing to install',
  'Three levels',
  'Keyboard, gamepad or touch',
]

const features: Array<{ title: string; text: string }> = [
  {
    title: 'Six degrees of freedom',
    text: 'There is no up. Fly, strafe, slide and roll through tunnels in any direction.',
  },
  {
    title: 'Three levels',
    text: 'Access keys, locked doors, survivors to rescue and a timed escape after each reactor.',
  },
  {
    title: 'Made from code',
    text: 'Procedural textures, baked light, synthesized sound and robots built in Blender.',
  },
  {
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

function PlayPage() {
  return (
    <Reader>
      <ReaderTitle>Averno</ReaderTitle>
      <ReaderMeta>
        (2026) · Version {VERSION} · {UPDATED}
      </ReaderMeta>
      <ReaderList items={facts} />
      <ReaderText>{DESCRIPTION}</ReaderText>
      <ReaderLinks>
        <ReaderExternal href={GAME_URL}>Play</ReaderExternal>
        <ReaderLink to="/notes/$slug" params={{ slug: NOTE_SLUG }}>
          How it is built
        </ReaderLink>
      </ReaderLinks>
      <ReaderFigure
        src="/play/averno-trailer-poster.webp"
        video="/play/averno-trailer.mp4"
        alt="The trailer of Averno. The video has no sound."
        width={1920}
        height={1080}
      />

      <ReaderSection title="The game">
        {features.map((feature) => (
          <Line key={feature.title} className="mt-6">
            <p className={hudText}>{feature.title}</p>
            <p className="text-fg-secondary mt-1 max-w-[60ch] text-base leading-7">
              {feature.text}
            </p>
          </Line>
        ))}
      </ReaderSection>

      {levels.map((level, index) => (
        <ReaderSection
          key={level.name}
          title={`${String.fromCharCode(65 + index)}. ${level.name} — ${level.place}`}
        >
          <ReaderText>{level.text}</ReaderText>
          <ReaderFigure
            src={level.image}
            alt={level.imageAlt}
            width={1600}
            height={900}
          />
          <ReaderFigure
            src={level.action}
            alt={level.actionAlt}
            width={1600}
            height={900}
          />
        </ReaderSection>
      ))}

      <ReaderSection title="Made with">
        <ReaderList items={stack} />
        <ReaderLinks>
          <ReaderExternal href={GAME_URL}>Play</ReaderExternal>
        </ReaderLinks>
      </ReaderSection>
    </Reader>
  )
}
