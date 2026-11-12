import { createFileRoute } from '@tanstack/react-router'
import {
  Line,
  Reader,
  ReaderExternal,
  ReaderLink,
  ReaderLinks,
  ReaderSection,
  ReaderText,
  ReaderTitle,
  hudText,
} from '~/components/reader/Reader'
import { recentWork } from '~/data/work'
import { pageHead } from '~/lib/structured-data'

export const Route = createFileRoute('/work')({
  head: () =>
    pageHead({
      title: 'Selected Work — Ali Abbas',
      description: 'Selected products designed and engineered by Ali Abbas.',
      path: '/work',
    }),
  component: WorkPage,
})

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function WorkPage() {
  return (
    <Reader>
      <ReaderTitle>Work</ReaderTitle>
      <ReaderText>
        Product experiences where visual ambition and engineering rigor have to
        coexist. I care about the concept, the system, and the final 2px in
        production.
      </ReaderText>

      <ReaderSection title="Products">
        {recentWork.map((item, index) => (
          <Line key={item.title} className="mt-8">
            <p className={hudText}>
              {LETTERS[index]}. {item.title} ({item.year})
            </p>
            <p className={hudText}>{item.category}</p>
            <p className="text-fg-secondary mt-2 max-w-[60ch] text-base leading-7">
              {item.description}
            </p>
            <p className={`${hudText} mt-3 flex flex-wrap gap-x-10`}>
              <ReaderLink to="/work/$slug" params={{ slug: item.caseStudy }}>
                Case study
              </ReaderLink>
              <ReaderExternal href={item.href}>Visit</ReaderExternal>
            </p>
          </Line>
        ))}
      </ReaderSection>

      <ReaderSection title="Side projects">
        <Line className="mt-8">
          <p className={hudText}>D. Averno (2026)</p>
          <p className={hudText}>Browser game · 3D</p>
          <p className="text-fg-secondary mt-2 max-w-[60ch] text-base leading-7">
            A 3D shooter that runs in the browser on a computer or a phone.
            Three.js and React, light baked in a web worker, and one input model
            for keyboard, gamepad and touch.
          </p>
        </Line>
        <ReaderLinks>
          <ReaderLink to="/play">Play</ReaderLink>
        </ReaderLinks>
        <Line className="mt-10">
          <p className={hudText}>E. Chromagine (2025)</p>
          <p className={hudText}>Creative tool · Color</p>
          <p className="text-fg-secondary mt-2 max-w-[60ch] text-base leading-7">
            A joyful utility for creating harmonious palettes with perceptual
            color models instead of guesswork.
          </p>
        </Line>
        <ReaderLinks>
          <ReaderExternal href="https://chromagine.aliabbas.net/">
            Visit
          </ReaderExternal>
        </ReaderLinks>
      </ReaderSection>
    </Reader>
  )
}
