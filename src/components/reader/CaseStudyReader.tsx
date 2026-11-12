import { recentWork } from '~/data/work'
import type { CaseStudy, CaseStudyImage } from '~/data/case-studies'
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
} from './Reader'

/** The dark screenshot when there is one: the site is dark. */
function figure(image: CaseStudyImage) {
  return {
    src: image.dark ?? image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
  }
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** A case study, read next to the icon of its project. */
export default function CaseStudyReader({ study }: { study: CaseStudy }) {
  const work = recentWork.find((item) => item.caseStudy === study.slug)
  const others = recentWork.filter(
    (item) => item.caseStudy && item.caseStudy !== study.slug,
  )

  return (
    <Reader>
      <ReaderTitle>{study.title}</ReaderTitle>
      <ReaderMeta>({study.year})</ReaderMeta>
      <ReaderList
        items={[study.category, ...(work?.tools ?? [])]}
        className="mt-6"
      />
      <ReaderText>{study.summary}</ReaderText>
      <ReaderLinks>
        <ReaderExternal href={study.liveHref}>Visit</ReaderExternal>
        {study.sourceHref ? (
          <ReaderExternal href={study.sourceHref}>Source</ReaderExternal>
        ) : null}
      </ReaderLinks>

      {study.media ? <ReaderFigure {...figure(study.media.hero)} /> : null}

      <ReaderSection title="The problem">
        {study.problem.map((text) => (
          <ReaderText key={text}>{text}</ReaderText>
        ))}
      </ReaderSection>

      <ReaderSection title="My role">
        {study.role.map((text) => (
          <ReaderText key={text}>{text}</ReaderText>
        ))}
      </ReaderSection>

      {study.media?.demo ? (
        <ReaderSection title={study.media.demo.title}>
          <ReaderFigure
            src={study.media.demo.poster}
            video={study.media.demo.video}
            alt={study.media.demo.caption}
            width={study.media.demo.width}
            height={study.media.demo.height}
            caption={study.media.demo.caption}
          />
        </ReaderSection>
      ) : null}

      {study.media?.gallery ? (
        <ReaderSection title={study.media.gallery.title}>
          {study.media.gallery.intro ? (
            <ReaderText>{study.media.gallery.intro}</ReaderText>
          ) : null}
          {study.media.gallery.figures.map((item) => (
            <ReaderFigure
              key={item.image.src}
              {...figure(item.image)}
              caption={item.caption}
            />
          ))}
        </ReaderSection>
      ) : null}

      {study.machines.map((machine) => (
        <ReaderSection key={machine.id} title={machine.title}>
          <ReaderText>{machine.intro}</ReaderText>
          {machine.states.map((state, index) => (
            <Line key={state.id} className="mt-6">
              <p className={hudText}>
                {LETTERS[index]}. {state.label}
              </p>
              <p className="text-fg-secondary mt-1 max-w-[60ch] text-base leading-7">
                {state.meaning}
              </p>
            </Line>
          ))}
        </ReaderSection>
      ))}

      {study.failureModes.map((mode) => (
        <ReaderSection key={mode.title} title={mode.title}>
          <ReaderText>{mode.risk}</ReaderText>
          {mode.design.map((text) => (
            <ReaderText key={text}>{text}</ReaderText>
          ))}
          {mode.figure ? (
            <ReaderFigure
              {...figure(mode.figure.image)}
              caption={mode.figure.caption}
            />
          ) : null}
        </ReaderSection>
      ))}

      {study.numbers.length ? (
        <ReaderSection title="Numbers">
          {study.numbers.map((number) => (
            <Line key={number.label} className="mt-6">
              <p className={hudText}>
                {number.value} — {number.label}
              </p>
              <p className="text-fg-muted mt-1 max-w-[60ch] text-sm leading-6">
                {number.method}
              </p>
            </Line>
          ))}
        </ReaderSection>
      ) : null}

      {study.media?.phone ? (
        <ReaderSection title="On a phone">
          <ReaderFigure
            {...figure(study.media.phone.image)}
            caption={study.media.phone.caption}
          />
        </ReaderSection>
      ) : null}

      <ReaderSection title="More work">
        <ReaderLinks>
          {others.map((item) => (
            <ReaderLink
              key={item.title}
              to="/work/$slug"
              params={{ slug: item.caseStudy! }}
            >
              {item.title}
            </ReaderLink>
          ))}
        </ReaderLinks>
        <ReaderText className="text-fg-muted text-sm">
          {study.evidenceNote}
        </ReaderText>
      </ReaderSection>
    </Reader>
  )
}
