import { createFileRoute } from '@tanstack/react-router'
import {
  Line,
  Reader,
  ReaderLink,
  ReaderList,
  ReaderSection,
  ReaderText,
  ReaderTitle,
} from '~/components/reader/Reader'
import { pageHead } from '~/lib/structured-data'

export const Route = createFileRoute('/privacy')({
  head: () =>
    pageHead({
      title: 'Privacy — Ali Abbas',
      description:
        'How aliabbas.net collects, uses, stores and protects personal information.',
      path: '/privacy',
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
    <ReaderSection title={`${Number(number)}. ${title}`}>
      {children}
    </ReaderSection>
  )
}

function PrivacyPage() {
  return (
    <Reader>
      <ReaderTitle>Privacy</ReaderTitle>
      <ReaderList
        items={['Effective October 30, 2026', 'Operator: Ali Abbas']}
      />

      <PrivacySection number="01" title="Overview">
        <ReaderText>
          This policy tells you which information aliabbas.net collects, why it
          collects it, how long it keeps it and which choices you have. Ali
          Abbas operates the site as a professional portfolio and publishing
          website.
        </ReaderText>
        <ReaderText>
          The site does not sell or rent the information that it collects. It
          does not share it for cross-context behavioral advertising.
        </ReaderText>
      </PrivacySection>

      <PrivacySection number="02" title="Portfolio chat">
        <ReaderText>
          When you send a message to the portfolio chatbot, the site stores:
        </ReaderText>
        <Line>
          <ul className="text-fg-secondary marker:text-hud mt-6 max-w-[60ch] list-disc space-y-2 pl-5 text-base leading-7">
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
        </Line>
        <ReaderText>
          The chat database does not store your raw IP address, precise latitude
          or longitude, or postal code. Network providers may process an IP
          address transiently to deliver and secure the service.
        </ReaderText>
        <ReaderText>
          Conversations are reviewed to understand what visitors ask, operate
          and improve the assistant, diagnose failures, and prevent abuse. Do
          not submit confidential, legally privileged, or sensitive personal
          information.
        </ReaderText>
      </PrivacySection>

      <PrivacySection number="03" title="Other information">
        <ReaderText>
          The contact form collects your name, email address, topic, and message
          so I can receive and respond to your inquiry. Cloudflare Turnstile
          checks that a person sends the form. It reads browser and device
          signals for this check only.
        </ReaderText>
        <ReaderText>
          If you create an account to comment on a note, the authentication
          service processes account details such as your name, email,
          verification status, login credentials, profile image, and session
          information. Public comments display the name, image, and content you
          choose to publish.
        </ReaderText>
        <ReaderText>
          The claim checker sends the claim you enter to Workers AI to grade it.
          The site does not store claims; a claim appears in the page address
          only so you can share a result.
        </ReaderText>
        <ReaderText>
          To measure how fast pages load, each page load sends its Core Web
          Vitals (load, response and layout-shift timings) once. The site stores
          only the metric values, the route without its full address (for
          example /notes/$slug), and whether the screen is mobile or desktop
          size. It does not store an IP address, browser details or any
          identifier, and it does not link measurements to a visitor. The
          results are public on the{' '}
          <ReaderLink to="/performance">performance page</ReaderLink>.
        </ReaderText>
        <ReaderText>
          Hosting and security providers may generate limited technical logs,
          such as request times, network information, errors, and security
          events.
        </ReaderText>
      </PrivacySection>

      <PrivacySection number="04" title="Service providers">
        <ReaderText>
          Cloudflare provides hosting, security, the Turnstile human check,
          approximate geolocation, chatbot and performance storage through D1,
          and AI inference through Workers AI. Cloudflare states that Workers AI
          customer content is not used to train models or improve its services
          without explicit consent.
        </ReaderText>
        <ReaderText>
          Convex and Better Auth provide account, authentication, and comment
          infrastructure. Resend delivers contact, verification, password-reset,
          and comment-notification emails. GitHub processes information if you
          choose GitHub sign-in. Sanity provides public portfolio content and
          media. The site serves its own fonts.
        </ReaderText>
        <ReaderText>
          These providers process information under their own terms and privacy
          commitments only as needed to provide their services.
        </ReaderText>
      </PrivacySection>

      <PrivacySection number="05" title="Retention">
        <ReaderText>
          Chat conversations and associated metadata are automatically deleted
          no later than 90 days after the last message. You may also delete the
          active conversation immediately using the trash button in the chat
          header. Performance measurements are deleted after 90 days.
        </ReaderText>
        <ReaderText>
          Contact messages are retained for as long as reasonably necessary to
          respond and maintain relevant professional correspondence. Accounts
          and comments are retained until removed or until a valid deletion
          request is completed. Provider security logs follow the applicable
          provider’s retention schedule.
        </ReaderText>
      </PrivacySection>

      <PrivacySection number="06" title="Your choices">
        <ReaderText>
          You can use the site without creating an account or using the chatbot.
          You can start a fresh chat without deleting the prior conversation, or
          permanently delete the active conversation with the trash button.
        </ReaderText>
        <ReaderText>
          Depending on where you live and which law applies, you may have rights
          to request access, correction, or deletion of personal information and
          to receive information about how it is handled. Requests can be
          submitted through the{' '}
          <ReaderLink to="/contact">contact page</ReaderLink>. Reasonable
          verification may be required before fulfilling a request.
        </ReaderText>
      </PrivacySection>

      <PrivacySection number="07" title="Tracking controls">
        <ReaderText>
          The site does not use advertising cookies or sell or share personal
          information for targeted advertising. Because there is no sale or
          advertising share to opt out of, Global Privacy Control and browser Do
          Not Track signals do not change the site’s current behavior.
        </ReaderText>
        <ReaderText>
          Authentication may use strictly necessary cookies to keep signed-in
          users secure. The anonymous chatbot conversation identifier is held
          only for the current page session.
        </ReaderText>
      </PrivacySection>

      <PrivacySection number="08" title="Security and changes">
        <ReaderText>
          Reasonable technical and organizational safeguards are used to protect
          stored information, including authenticated access to the private
          conversation viewer and encrypted transport. No online system can
          guarantee absolute security.
        </ReaderText>
        <ReaderText>
          This service is not directed to children under 13. This policy may be
          updated as the site or its providers change. The effective date above
          will be revised when material changes are published.
        </ReaderText>
        <ReaderText>
          Questions about this policy or privacy requests can be sent through
          the <ReaderLink to="/contact">contact page</ReaderLink>.
        </ReaderText>
      </PrivacySection>
    </Reader>
  )
}
