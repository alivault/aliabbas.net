import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowUpRight, CircleCheck, Loader2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import PageHeading from './PageHeading'
import ScrollReveal from './ScrollReveal'
import { Button } from './ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { sendContactEmail } from '~/lib/email'

const fieldLabelStyles = 'text-foreground text-sm font-medium'

const formSchema = z.object({
  name: z.string().trim().min(1, 'A name is required'),
  email: z.email('Please provide a valid email address'),
  message: z.string().trim().min(1, 'A message is required'),
  verification: z.string().min(1, 'Please answer the verification question'),
})

type ContactFormValues = z.infer<typeof formSchema>

type Challenge = {
  first: number
  second: number
  ready: boolean
}

const createChallenge = (): Challenge => ({
  first: Math.floor(Math.random() * 11),
  second: Math.floor(Math.random() * 11),
  ready: true,
})

const inputClassName =
  'h-14 rounded-none border-x-0 border-t-0 border-b-foreground/25 px-4 text-base shadow-none focus-visible:border-brand focus-visible:ring-0'

export default function ContactForm() {
  const [isSubmitted, setSubmitted] = useState(false)
  const [challenge, setChallenge] = useState<Challenge>({
    first: 0,
    second: 0,
    ready: false,
  })

  useEffect(() => {
    setChallenge(createChallenge())
  }, [])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
      verification: '',
    },
  })

  const onSubmit = async (values: ContactFormValues) => {
    if (Number(values.verification) !== challenge.first + challenge.second) {
      setError('verification', {
        message: 'That answer is not quite right. Try the new one.',
      })
      setChallenge(createChallenge())
      return
    }

    try {
      await sendContactEmail({
        data: {
          name: values.name,
          email: values.email,
          message: values.message,
        },
      })
      setSubmitted(true)
    } catch {
      setError('root', {
        message:
          'Something went wrong while sending your message. Please try again.',
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
        <span className="bg-brand text-brand-foreground flex size-20 items-center justify-center rounded-full">
          <CircleCheck className="size-9" strokeWidth={1.5} />
        </span>
        <PageHeading className="mt-8">Message received.</PageHeading>
        <p className="text-foreground/50 mt-6 max-w-md text-base leading-7">
          Thanks for reaching out. I’ll read your note and get back to you soon.
        </p>
      </motion.section>
    )
  }

  return (
    <section className="gap-y-section-content py-section mx-auto grid max-w-[1440px] gap-x-14 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-x-24 lg:px-12">
      <ScrollReveal className="flex min-w-0 flex-col">
        <PageHeading>
          Let’s build
          <span className="block">something</span>
          <span className="text-brand block">remarkable.</span>
        </PageHeading>
        <p className="text-foreground/55 mt-9 max-w-md text-base leading-7">
          I’m interested in senior frontend roles on interactive and streaming
          interfaces, where design quality matters as much as technical
          execution. If that sounds like your team, I’d like to hear from you.
        </p>
        <div className="border-foreground/20 mt-12 grid grid-cols-2 gap-5 border-t pt-6 text-sm leading-6 lg:mt-auto">
          <div>
            <span className="text-foreground/55 block">Best fit</span>
            <span className="mt-1 block font-semibold">
              Senior frontend · Interactive UI
            </span>
          </div>
          <div>
            <span className="text-foreground/55 block">Response time</span>
            <span className="mt-1 block font-semibold">Usually 1–2 days</span>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.08}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup className="gap-8">
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="contact-name" className={fieldLabelStyles}>
                Name
              </FieldLabel>
              <Input
                id="contact-name"
                variant="filled"
                autoComplete="name"
                placeholder="Enter your name"
                aria-invalid={Boolean(errors.name)}
                className={inputClassName}
                {...register('name')}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field data-invalid={Boolean(errors.email)}>
              <FieldLabel htmlFor="contact-email" className={fieldLabelStyles}>
                Email
              </FieldLabel>
              <Input
                id="contact-email"
                variant="filled"
                type="email"
                autoComplete="email"
                placeholder="Enter your email address"
                aria-invalid={Boolean(errors.email)}
                className={inputClassName}
                {...register('email')}
              />
              <FieldError errors={[errors.email]} />
            </Field>

            <Field data-invalid={Boolean(errors.message)}>
              <FieldLabel
                htmlFor="contact-message"
                className={fieldLabelStyles}
              >
                Tell me about the opportunity
              </FieldLabel>
              <Textarea
                id="contact-message"
                variant="filled"
                placeholder="The role, team, problem, or idea…"
                rows={7}
                aria-invalid={Boolean(errors.message)}
                className="border-b-foreground/25 focus-visible:border-brand min-h-44 resize-none rounded-none border-x-0 border-t-0 px-4 py-4 text-base shadow-none focus-visible:ring-0"
                {...register('message')}
              />
              <FieldError errors={[errors.message]} />
            </Field>

            <Field data-invalid={Boolean(errors.verification)}>
              <FieldLabel
                htmlFor="contact-verification"
                className={fieldLabelStyles}
              >
                Human check:
                <span>
                  {challenge.ready
                    ? `${challenge.first} + ${challenge.second} = ?`
                    : 'Loading…'}
                </span>
              </FieldLabel>
              <Input
                id="contact-verification"
                variant="filled"
                type="number"
                inputMode="numeric"
                aria-invalid={Boolean(errors.verification)}
                className={`${inputClassName} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                {...register('verification')}
              />
              <FieldError errors={[errors.verification]} />
            </Field>

            {errors.root?.message && (
              <p className="text-destructive text-sm">{errors.root.message}</p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || !challenge.ready}
              className="group bg-foreground text-background hover:bg-brand hover:text-brand-foreground mt-2 h-14 w-full rounded-full px-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                  Sending
                </>
              ) : (
                <>
                  Send inquiry
                  <ArrowUpRight
                    className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                    data-icon="inline-end"
                  />
                </>
              )}
            </Button>
          </FieldGroup>
        </form>
      </ScrollReveal>
    </section>
  )
}
