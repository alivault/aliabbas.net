import { Link, createFileRoute } from '@tanstack/react-router'
import Main from '~/components/Main'
import Meta from '~/components/Meta'
import PageHeading from '~/components/PageHeading'
import Title from '~/components/Title'

export const Route = createFileRoute('/privacy')({
  head: () => ({
    meta: [
      { title: 'Privacy | Ali Abbas' },
      {
        name: 'description',
        content:
          'How aliabbas.net collects, uses, stores, and protects personal information.',
      },
    ],
  }),
  component: PrivacyPage,
})

function PrivacySection({
  children,
  number,
  title,
}: {
  children: React.ReactNode
  number: string
  title: string
}) {
  return (
    <section className="border-foreground/20 py-section-content grid gap-5 border-t lg:grid-cols-[360px_1fr] lg:gap-10">
      <Title as="h2" variant="subsection">
        <span className="text-brand tabular-nums">{Number(number)}.</span>{' '}
        {title}
      </Title>
      <div className="text-foreground/55 max-w-3xl space-y-5 text-base leading-7">
        {children}
      </div>
    </section>
  )
}

function PrivacyPage() {
  return (
    <Main>
      <article className="bg-background">
        <header className="pt-section pb-section-content mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
          <PageHeading>
            Privacy
            <em className="text-brand block">policy.</em>
          </PageHeading>
          <Meta as="div" className="mt-10 flex flex-wrap gap-x-8 gap-y-2">
            <span>Effective October 28, 2026</span>
            <span>Operator: Ali Abbas</span>
          </Meta>
        </header>

        <div className="pb-section mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
          <PrivacySection number="01" title="Overview">
            <p>
              This policy explains what information aliabbas.net collects, why
              it is used, how long it is retained, and the choices available to
              visitors. The site is operated by Ali Abbas as a professional
              portfolio and publishing website.
            </p>
            <p>
              Information collected through this site is not sold, rented, or
              shared for cross-context behavioral advertising.
            </p>
          </PrivacySection>

          <PrivacySection number="02" title="Portfolio chat">
            <p>
              When you send a message to the portfolio chatbot, the site stores:
            </p>
            <ul className="marker:text-brand list-disc space-y-2 pl-5">
              <li>The complete conversation, including AI responses.</li>
              <li>Server-generated timestamps.</li>
              <li>
                Approximate country, region, and city derived by Cloudflare from
                the network request.
              </li>
              <li>
                Browser, operating system, device category, and the full user
                agent string.
              </li>
              <li>A random conversation identifier and response status.</li>
            </ul>
            <p>
              The chat database does not store your raw IP address, precise
              latitude or longitude, or postal code. Network providers may
              process an IP address transiently to deliver and secure the
              service.
            </p>
            <p>
              Conversations are reviewed to understand what visitors ask,
              operate and improve the assistant, diagnose failures, and prevent
              abuse. Do not submit confidential, legally privileged, or
              sensitive personal information.
            </p>
          </PrivacySection>

          <PrivacySection number="03" title="Other information">
            <p>
              The contact form collects your name, email address, and message so
              Ali can receive and respond to your inquiry.
            </p>
            <p>
              If you create an account to comment on a note, the authentication
              service processes account details such as your name, email,
              verification status, login credentials, profile image, and session
              information. Public comments display the name, image, and content
              you choose to publish.
            </p>
            <p>
              The claim checker sends the claim you enter to Workers AI to grade
              it. The site does not store claims; a claim appears in the page
              address only so you can share a result.
            </p>
            <p>
              To measure how fast pages load, each page load sends its Core Web
              Vitals (load, response and layout-shift timings) once. The site
              stores only the metric values, the route without its full address
              (for example /notes/$slug), and whether the screen is mobile or
              desktop size. It does not store an IP address, browser details or
              any identifier, and it does not link measurements to a visitor.
              The results are public on the{' '}
              <Link
                to="/performance"
                className="text-foreground decoration-foreground/25 font-semibold underline underline-offset-4"
              >
                performance page
              </Link>
              .
            </p>
            <p>
              Hosting and security providers may generate limited technical
              logs, such as request times, network information, errors, and
              security events.
            </p>
          </PrivacySection>

          <PrivacySection number="04" title="Service providers">
            <p>
              Cloudflare provides hosting, security, approximate geolocation,
              chatbot and performance storage through D1, and AI inference
              through Workers AI. Cloudflare states that Workers AI customer
              content is not used to train models or improve its services
              without explicit consent.
            </p>
            <p>
              Convex and Better Auth provide account, authentication, and
              comment infrastructure. Resend delivers contact, verification,
              password-reset, and comment-notification emails. GitHub processes
              information if you choose GitHub sign-in. Sanity provides public
              portfolio content and media. The site serves its own fonts.
            </p>
            <p>
              These providers process information under their own terms and
              privacy commitments only as needed to provide their services.
            </p>
          </PrivacySection>

          <PrivacySection number="05" title="Retention">
            <p>
              Chat conversations and associated metadata are automatically
              deleted no later than 90 days after the last message. You may also
              delete the active conversation immediately using the trash button
              in the chat header. Performance measurements are deleted after 90
              days.
            </p>
            <p>
              Contact messages are retained for as long as reasonably necessary
              to respond and maintain relevant professional correspondence.
              Accounts and comments are retained until removed or until a valid
              deletion request is completed. Provider security logs follow the
              applicable provider’s retention schedule.
            </p>
          </PrivacySection>

          <PrivacySection number="06" title="Your choices">
            <p>
              You can use the site without creating an account or using the
              chatbot. You can start a fresh chat without deleting the prior
              conversation, or permanently delete the active conversation with
              the trash button.
            </p>
            <p>
              Depending on where you live and which law applies, you may have
              rights to request access, correction, or deletion of personal
              information and to receive information about how it is handled.
              Requests can be submitted through the{' '}
              <Link
                to="/contact"
                className="text-foreground decoration-foreground/25 font-semibold underline underline-offset-4"
              >
                contact page
              </Link>
              . Reasonable verification may be required before fulfilling a
              request.
            </p>
          </PrivacySection>

          <PrivacySection number="07" title="Tracking controls">
            <p>
              The site does not use advertising cookies or sell or share
              personal information for targeted advertising. Because there is no
              sale or advertising share to opt out of, Global Privacy Control
              and browser Do Not Track signals do not change the site’s current
              behavior.
            </p>
            <p>
              Authentication may use strictly necessary cookies to keep
              signed-in users secure. The anonymous chatbot conversation
              identifier is held only for the current page session.
            </p>
          </PrivacySection>

          <PrivacySection number="08" title="Security and changes">
            <p>
              Reasonable technical and organizational safeguards are used to
              protect stored information, including authenticated access to the
              private conversation viewer and encrypted transport. No online
              system can guarantee absolute security.
            </p>
            <p>
              This service is not directed to children under 13. This policy may
              be updated as the site or its providers change. The effective date
              above will be revised when material changes are published.
            </p>
            <p>
              Questions about this policy or privacy requests can be sent
              through the{' '}
              <Link
                to="/contact"
                className="text-foreground decoration-foreground/25 font-semibold underline underline-offset-4"
              >
                contact page
              </Link>
              .
            </p>
          </PrivacySection>
        </div>
      </article>
    </Main>
  )
}
