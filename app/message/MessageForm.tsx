'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import { useEffect } from 'react'
import Spinner from '@/components/Spinner'

export function MessageForm() {
  const [isSubmitted, setSubmitted] = useState(false)
  const [number1, setNumber1] = useState<number | null>(null)
  const [number2, setNumber2] = useState<number | null>(null)

  useEffect(() => {
    setNumber1(Math.floor(Math.random() * 11))
    setNumber2(Math.floor(Math.random() * 11))
  }, [])

  const formSchema = z.object({
    name: z.string().nonempty({ message: 'A name is required' }),
    email: z
      .string()
      .email({ message: 'Please provide a valid email address' }),
    message: z.string().nonempty({ message: 'A message is required' }),
    verification: z
      .string()
      .refine(
        str =>
          number1 !== null &&
          number2 !== null &&
          parseInt(str, 10) === number1 + number2,
        {
          message: `Please answer the verification question correctly`,
        }
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
    const response = await fetch('/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    })

    if (!response.ok) {
      throw new Error('Network response was not ok')
    }

    const data = await response.json()

    if (data.error) {
      setError('formError', {
        message:
          'An error occurred while sending your message. Please try again later.',
      })
    } else {
      setSubmitted(true)
    }
  }

  if (isSubmitted) {
    return (
      <section className='flex flex-col gap-4'>
        <span className='rounded-lg bg-green-600 p-5 text-center text-xl font-bold text-white'>
          Thank you for your message. I will respond soon.
        </span>
      </section>
    )
  } else {
    return (
      <section className='flex flex-col gap-4'>
        <h1 className='text-3xl font-bold'>Message Ali </h1>
        <p>
          Looking to collaborate, hire, or seek guidance in tech and travel?
          Drop me a message – let's create something remarkable together.
        </p>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, errors => {
              if (errors.verification) {
                setValue('verification', '')
              }
              setNumber1(Math.floor(Math.random() * 11))
              setNumber2(Math.floor(Math.random() * 11))
            })}
            className='flex flex-col gap-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type='text' placeholder='Your name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type='email' placeholder='Your email' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='message'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      className='text-base'
                      placeholder='Your message'
                      {...field}
                    />
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
              name='verification'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-2'>
                    Anti-spam verification:{' '}
                    {number1 !== null && number2 !== null ? (
                      `${number1} + ${number2} = ?`
                    ) : (
                      <Spinner size='xs' />
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input type='number' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit' disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Spinner size='md' /> : 'Send'}
            </Button>
          </form>
        </Form>
      </section>
    )
  }
}
