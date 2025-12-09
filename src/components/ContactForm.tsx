import { useEffect, useState } from 'react'
import Spinner from './Spinner'
import { Button } from './ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { AutosizeTextarea } from './AutosizeTextArea'
import PageHeading from './PageHeading'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { sendContactEmail } from '~/lib/email'

export default function ContactForm() {
  const [isSubmitted, setSubmitted] = useState(false)
  const [number1, setNumber1] = useState<number | null>(null)
  const [number2, setNumber2] = useState<number | null>(null)

  useEffect(() => {
    setNumber1(Math.floor(Math.random() * 11))
    setNumber2(Math.floor(Math.random() * 11))
  }, [])

  const formSchema = z.object({
    name: z.string().min(1, { message: 'A name is required' }),
    email: z
      .string()
      .email({ message: 'Please provide a valid email address' }),
    message: z.string().min(1, { message: 'A message is required' }),
    verification: z
      .string()
      .refine(
        (str) =>
          number1 !== null &&
          number2 !== null &&
          parseInt(str, 10) === number1 + number2,
        {
          message: `Please answer the verification question correctly`,
        },
      ),
    formError: z.string().optional(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
      verification: '',
      formError: '',
    },
  })

  const { setError, clearErrors, setValue } = form

  const watchedEmail = form.watch('email')
  const watchedMessage = form.watch('message')

  useEffect(() => {
    clearErrors('formError')
  }, [watchedEmail, watchedMessage, clearErrors])

  async function onSubmit(values: z.infer<typeof formSchema>) {
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
      setError('formError', {
        message:
          'An error occurred while sending your message. Please try again later.',
      })
    }
  }

  if (isSubmitted) {
    return (
      <section className="flex flex-col gap-4">
        <span className="rounded-lg bg-green-600 p-5 text-center text-xl font-bold text-white">
          Thank you for your message. I will respond soon.
        </span>
      </section>
    )
  } else {
    return (
      <section className="p-5">
        <PageHeading>Contact</PageHeading>
        <p className="prose mb-4 max-w-none dark:prose-invert">
          I'm always open to new collaborations and connections! Feel free to
          drop me a message if you'd like to chat or work together.
        </p>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              if (errors.verification) {
                setValue('verification', '')
              }
              setNumber1(Math.floor(Math.random() * 11))
              setNumber2(Math.floor(Math.random() * 11))
            })}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="text" placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="email" placeholder="Your email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <AutosizeTextarea placeholder="Your message" {...field} />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.formError &&
                      form.formState.errors.formError.message}
                  </FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="verification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Anti-spam verification:{' '}
                    {number1 !== null && number2 !== null ? (
                      `${number1} + ${number2} = ?`
                    ) : (
                      <Spinner size="xs" />
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? <Spinner size="md" /> : 'Send'}
            </Button>
          </form>
        </Form>
      </section>
    )
  }
}

