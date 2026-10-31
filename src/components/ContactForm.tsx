import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import {
  ArrowUpRight,
  Check,
  CircleCheck,
  Copy,
  Loader2,
  MessageCircle,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import PageHeading from './PageHeading'
import ScrollReveal from './ScrollReveal'
import { Button, buttonVariants } from './ui/button'
import { chipStyles } from './ui/chip'
import { Field, FieldError, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import {
  CONTACT_TOPICS,
  HUMAN_CHECK_FAILED,
  MAX_MESSAGE_LENGTH,
} from '~/lib/contact'
import { sendContactEmail } from '~/lib/email'
import { useTurnstile } from '~/lib/turnstile'
import { cn } from 'cn'

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

type ContactFormValues = z.infer<typeof formSchema>

const labelStyles = 'text-foreground text-sm font-medium'

// Rounded fields on the page fill, so the form matches the buttons and
// the chips. 44px high, as the pill-lg button.
const fieldStyles =
  'border-border bg-background placeholder:text-fg-muted focus-visible:border-brand focus-visible:ring-brand/20 rounded-xl px-3.5 text-base! shadow-none dark:bg-background'

const quietLink =
  'text-fg-secondary hover:text-foreground focus-visible:outline-foreground inline-flex items-center gap-1 rounded-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2'

export default function ContactForm() {
  const [isSubmitted, setSubmitted] = useState(false)
  const turnstile = useTurnstile(import.meta.env.VITE_TURNSTILE_SITE_KEY)

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', message: '' },
  })

  const topic = watch('topic')
  const messageLength = watch('message').length

  const onSubmit = async (values: ContactFormValues) => {
    const token = await turnstile.getToken()
    if (!token) {
      setError('root', {
        message: `The human check did not pass. Reload the page, or write to ${EMAIL}.`,
      })
      return
    }
    try {
      await sendContactEmail({
        data: { ...values, token },
      })
      setSubmitted(true)
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

  if (isSubmitted) {
    return (
      <motion.section
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto flex min-h-[75svh] max-w-[1440px] flex-col items-center justify-center px-5 text-center sm:px-8 lg:px-12"
      >
        <span className="bg-brand/10 text-brand border-brand/25 flex size-16 items-center justify-center rounded-full border">
          <CircleCheck className="size-8" strokeWidth={1.5} />
        </span>
        <PageHeading className="mt-8">Message received.</PageHeading>
        <p className="text-fg-muted mt-6 max-w-md text-base leading-7 text-pretty">
          Thanks for reaching out. I read every message and usually reply in 1–2
          days, from {EMAIL}.
        </p>
        <Link
          to="/work"
          className={buttonVariants({
            variant: 'secondary',
            size: 'pill-lg',
            className: 'mt-8',
          })}
        >
          See the work
        </Link>
      </motion.section>
    )
  }

  return (
    <section className="py-section mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
      <ScrollReveal
        as="header"
        className="grid justify-items-center gap-6 text-center"
      >
        <PageHeading>Let’s build something remarkable.</PageHeading>
        <p className="text-fg-muted max-w-xl text-base leading-7 text-pretty lg:text-lg lg:leading-8">
          I’m interested in senior frontend roles on interactive and streaming
          interfaces, where design quality matters as much as technical
          execution. If that sounds like your team, I’d like to hear from you.
        </p>
      </ScrollReveal>

      <ScrollReveal
        delay={0.08}
        className="mt-section-content mx-auto max-w-xl"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          aria-label="Contact"
          className="border-border bg-card grid gap-6 rounded-2xl border p-5 sm:p-8"
        >
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="contact-name" className={labelStyles}>
                Name
              </FieldLabel>
              <Input
                id="contact-name"
                type="text"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                className={cn(fieldStyles, 'h-11')}
                {...register('name')}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field data-invalid={Boolean(errors.email)}>
              <FieldLabel htmlFor="contact-email" className={labelStyles}>
                Email
              </FieldLabel>
              <Input
                id="contact-email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                className={cn(fieldStyles, 'h-11')}
                {...register('email')}
              />
              <FieldError errors={[errors.email]} />
            </Field>
          </div>

          <fieldset>
            <legend className={labelStyles}>
              What is it about?{' '}
              <span className="text-fg-muted font-normal">Optional</span>
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {CONTACT_TOPICS.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={topic === item}
                  onClick={() =>
                    setValue('topic', topic === item ? undefined : item)
                  }
                  className={chipStyles({ active: topic === item })}
                >
                  {item}
                </button>
              ))}
            </div>
          </fieldset>

          <Field data-invalid={Boolean(errors.message)}>
            <div className="flex items-baseline justify-between gap-4">
              <FieldLabel htmlFor="contact-message" className={labelStyles}>
                Message
              </FieldLabel>
              <span
                className={cn(
                  'text-sm tabular-nums',
                  messageLength > MAX_MESSAGE_LENGTH
                    ? 'text-destructive'
                    : 'text-fg-muted',
                )}
              >
                {messageLength} / {MAX_MESSAGE_LENGTH}
              </span>
            </div>
            <Textarea
              id="contact-message"
              placeholder="The role, the team, the problem or the idea."
              rows={6}
              aria-invalid={Boolean(errors.message)}
              className={cn(fieldStyles, 'min-h-40 resize-y py-3')}
              {...register('message')}
            />
            <FieldError errors={[errors.message]} />
          </Field>

          {errors.root?.message && (
            <p role="alert" className="text-destructive text-sm leading-6">
              {errors.root.message}
            </p>
          )}

          <div>
            {/* Turnstile shows a checkbox here only when it is not sure. */}
            <div ref={turnstile.containerRef} className="has-[iframe]:mb-6" />
            <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:justify-between">
              <p className="text-fg-muted text-sm leading-6">
                I usually reply in 1–2 days.
              </p>
              <Button
                type="submit"
                size="pill-lg"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      className="animate-spin"
                      data-icon="inline-start"
                    />
                    Sending
                  </>
                ) : (
                  <>
                    Send message
                    <ArrowUpRight data-icon="inline-end" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        <OtherWays />
      </ScrollReveal>
    </section>
  )
}

/** For people who prefer not to use a form. */
function OtherWays() {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.location.href = `mailto:${EMAIL}`
    }
  }

  return (
    <div className="mt-8 grid justify-items-center gap-3 text-center text-sm leading-6">
      <p className="text-fg-muted flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        Prefer email?
        <a href={`mailto:${EMAIL}`} className={cn(quietLink, 'font-medium')}>
          {EMAIL}
        </a>
        <button
          type="button"
          onClick={() => void copy()}
          className={buttonVariants({
            variant: 'ghost',
            size: 'sm',
            className: 'text-sm',
          })}
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </p>
      <p role="status" className="sr-only">
        {copied ? 'Email address copied.' : ''}
      </p>
      <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <li>
          <a
            href="https://www.linkedin.com/in/webdevali"
            target="_blank"
            rel="noreferrer"
            className={quietLink}
          >
            LinkedIn
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </li>
        <li>
          <a
            href="https://github.com/alivault"
            target="_blank"
            rel="noreferrer"
            className={quietLink}
          >
            GitHub
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </li>
        <li>
          <Link to="/chat" className={quietLink}>
            <MessageCircle aria-hidden="true" className="size-3.5" />
            Ask AI about me first
          </Link>
        </li>
      </ul>
    </div>
  )
}
