import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight, CircleCheck, Loader2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import ScrollReveal from './ScrollReveal'
import { Button } from './ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { sendContactEmail } from '~/lib/email'

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
  'h-14 rounded-none border-x-0 border-t-0 border-b-black/25 bg-transparent px-0 text-base shadow-none focus-visible:border-[#335cff] focus-visible:ring-0'

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
        <span className="flex size-20 items-center justify-center rounded-full bg-[#d9ff43] text-[#10100f]">
          <CircleCheck className="size-9" strokeWidth={1.5} />
        </span>
        <h1 className="font-display mt-8 text-[clamp(4.5rem,10vw,9rem)] leading-[0.8] tracking-[-0.06em]">
          Message received.
        </h1>
        <p className="mt-6 max-w-md text-base leading-7 text-black/50">
          Thanks for reaching out. I’ll read your note and get back to you soon.
        </p>
      </motion.section>
    )
  }

  return (
    <section className="mx-auto grid max-w-[1440px] gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-12 lg:py-32">
      <ScrollReveal className="flex min-w-0 flex-col">
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#335cff] uppercase">
          Contact / opportunities / collaborations
        </p>
        <h1 className="mt-6 text-[clamp(2.75rem,12vw,6rem)] leading-[0.74] font-extrabold tracking-[-0.07em] uppercase lg:text-[clamp(3.6rem,5.8vw,6rem)]">
          Let’s build
          <span className="font-display block font-normal text-[#335cff] normal-case italic">
            something
          </span>
          remarkable.
        </h1>
        <p className="mt-9 max-w-md text-base leading-7 text-black/55">
          I’m interested in product engineering and creative frontend roles
          where design quality matters as much as technical execution. If that
          sounds like your team, I’d like to hear from you.
        </p>
        <div className="mt-12 grid grid-cols-2 gap-5 border-t border-black/20 pt-6 text-xs lg:mt-auto">
          <div>
            <span className="block text-black/35">Best fit</span>
            <span className="mt-2 block font-bold">
              Product & design engineering
            </span>
          </div>
          <div>
            <span className="block text-black/35">Response time</span>
            <span className="mt-2 block font-bold">Usually 1–2 days</span>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.08}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="border-t border-black/25 pt-8"
        >
          <FieldGroup className="gap-8">
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel
                htmlFor="contact-name"
                className="font-mono text-[11px] tracking-[0.14em] text-black/45 uppercase"
              >
                01 / Your name
              </FieldLabel>
              <Input
                id="contact-name"
                autoComplete="name"
                placeholder="What should I call you?"
                aria-invalid={Boolean(errors.name)}
                className={inputClassName}
                {...register('name')}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field data-invalid={Boolean(errors.email)}>
              <FieldLabel
                htmlFor="contact-email"
                className="font-mono text-[11px] tracking-[0.14em] text-black/45 uppercase"
              >
                02 / Email address
              </FieldLabel>
              <Input
                id="contact-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                aria-invalid={Boolean(errors.email)}
                className={inputClassName}
                {...register('email')}
              />
              <FieldError errors={[errors.email]} />
            </Field>

            <Field data-invalid={Boolean(errors.message)}>
              <FieldLabel
                htmlFor="contact-message"
                className="font-mono text-[11px] tracking-[0.14em] text-black/45 uppercase"
              >
                03 / Tell me about the opportunity
              </FieldLabel>
              <Textarea
                id="contact-message"
                placeholder="The role, team, problem, or idea…"
                rows={7}
                aria-invalid={Boolean(errors.message)}
                className="min-h-44 resize-none rounded-none border-x-0 border-t-0 border-b-black/25 bg-transparent px-0 py-4 text-base shadow-none focus-visible:border-[#335cff] focus-visible:ring-0"
                {...register('message')}
              />
              <FieldError errors={[errors.message]} />
            </Field>

            <Field data-invalid={Boolean(errors.verification)}>
              <FieldLabel
                htmlFor="contact-verification"
                className="font-mono text-[11px] tracking-[0.14em] text-black/45 uppercase"
              >
                04 / Human check
                <span className="text-black/30">
                  {challenge.ready
                    ? `${challenge.first} + ${challenge.second} = ?`
                    : 'Loading…'}
                </span>
              </FieldLabel>
              <Input
                id="contact-verification"
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
              className="group mt-2 h-14 w-full rounded-full bg-[#10100f] px-6 text-white hover:bg-[#335cff]"
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
            <p className="text-center text-xs leading-5 text-black/40">
              Your name, email, and message are used to respond to this inquiry.{' '}
              <Link
                to="/privacy"
                className="font-semibold text-black/60 underline decoration-black/20 underline-offset-4"
              >
                Privacy policy
              </Link>
            </p>
          </FieldGroup>
        </form>
      </ScrollReveal>
    </section>
  )
}
