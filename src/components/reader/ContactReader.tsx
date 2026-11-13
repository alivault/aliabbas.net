import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { cn } from '~/lib/utils'
import {
  CONTACT_TOPICS,
  HUMAN_CHECK_FAILED,
  MAX_MESSAGE_LENGTH,
} from '~/lib/contact'
import { sendContactEmail } from '~/lib/email'
import { play } from '~/lib/sound'
import { useTurnstile } from '~/lib/turnstile'
import {
  Line,
  Reader,
  ReaderExternal,
  ReaderLinks,
  ReaderSection,
  ReaderText,
  ReaderTitle,
  hudText,
} from './Reader'

const EMAIL = 'ali@aliabbas.net'

const formSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.'),
  email: z.email('Enter a valid email address.'),
  topic: z.enum(CONTACT_TOPICS).optional(),
  message: z
    .string()
    .trim()
    .min(1, 'Enter a message.')
    .max(MAX_MESSAGE_LENGTH, `Use ${MAX_MESSAGE_LENGTH} characters or fewer.`),
})

type Values = z.infer<typeof formSchema>

/** A field: a line in the HUD color, with the label as its placeholder. */
const field =
  'border-hud/40 focus:border-hud placeholder:text-hud/45 text-foreground w-full border-b bg-transparent py-3 text-base outline-none transition-colors'

/** Contact: the address, and a message form in the style of the HUD. */
export default function ContactReader() {
  const [sent, setSent] = useState(false)
  const turnstile = useTurnstile(import.meta.env.VITE_TURNSTILE_SITE_KEY)
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', message: '' },
  })
  const topic = watch('topic')

  const onSubmit = async (values: Values) => {
    const token = await turnstile.getToken()
    if (!token) {
      setError('root', {
        message: `The human check did not pass. Reload the page, or write to ${EMAIL}.`,
      })
      return
    }
    try {
      await sendContactEmail({ data: { ...values, token } })
      play('send')
      setSent(true)
    } catch (error) {
      turnstile.reset()
      setError('root', {
        message:
          error instanceof Error && error.message === HUMAN_CHECK_FAILED
            ? 'The human check failed. Try again.'
            : `Your message was not sent. Try again, or write to ${EMAIL}.`,
      })
    }
  }

  return (
    <Reader>
      <ReaderTitle>Contact</ReaderTitle>
      <ReaderText>
        I look for senior frontend and design engineer roles on interactive and
        streaming interfaces, where the design is as important as the code. If
        your team does this work, please write to me.
      </ReaderText>
      <ReaderLinks>
        <a
          href={`mailto:${EMAIL}`}
          className="hud-fill decoration-hud/50 underline underline-offset-[10px]"
        >
          {EMAIL}
        </a>
        <ReaderExternal href="https://github.com/alivault">
          GitHub
        </ReaderExternal>
        <ReaderExternal href="https://www.linkedin.com/in/webdevali/">
          LinkedIn
        </ReaderExternal>
      </ReaderLinks>

      <ReaderSection title={sent ? 'Message received' : 'Send a message'}>
        {sent ? (
          <ReaderText>
            Thanks for reaching out. I read every message and usually reply in
            1–2 days, from {EMAIL}.
          </ReaderText>
        ) : (
          <Line className="mt-6 max-w-[60ch]">
            <form
              aria-label="Contact"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="flex flex-col gap-6"
            >
              <fieldset>
                <legend className={hudText}>About</legend>
                <div className={cn(hudText, 'mt-2 flex flex-wrap gap-x-8')}>
                  {CONTACT_TOPICS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      data-sound="toggle"
                      aria-pressed={topic === option}
                      onClick={() =>
                        setValue('topic', topic === option ? undefined : option)
                      }
                      className={cn(
                        'hud-fill uppercase underline-offset-[10px]',
                        topic === option
                          ? 'decoration-hud underline'
                          : 'text-hud/60',
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </fieldset>
              <FieldShell error={errors.name?.message}>
                <label htmlFor="contact-name" className="sr-only">
                  Name
                </label>
                <input
                  id="contact-name"
                  autoComplete="name"
                  placeholder="Name"
                  className={field}
                  aria-invalid={Boolean(errors.name)}
                  {...register('name')}
                />
              </FieldShell>
              <FieldShell error={errors.email?.message}>
                <label htmlFor="contact-email" className="sr-only">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  className={field}
                  aria-invalid={Boolean(errors.email)}
                  {...register('email')}
                />
              </FieldShell>
              <FieldShell error={errors.message?.message}>
                <label htmlFor="contact-message" className="sr-only">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  placeholder="Message"
                  className={cn(field, 'resize-none')}
                  aria-invalid={Boolean(errors.message)}
                  {...register('message')}
                />
              </FieldShell>
              <div ref={turnstile.containerRef} />
              {errors.root?.message ? (
                <p role="alert" className="text-destructive text-sm">
                  {errors.root.message}
                </p>
              ) : null}
              <button
                type="submit"
                // Send plays when the message is sent.
                data-sound="hover"
                disabled={isSubmitting}
                className={cn(
                  hudText,
                  'hud-fill decoration-hud/50 self-start text-lg uppercase underline underline-offset-[10px] disabled:opacity-50',
                )}
              >
                {isSubmitting ? 'Sending' : 'Send'}
              </button>
            </form>
          </Line>
        )}
      </ReaderSection>
    </Reader>
  )
}

function FieldShell({
  error,
  children,
}: {
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      {children}
      {error ? (
        <p role="alert" className="text-destructive mt-2 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  )
}
