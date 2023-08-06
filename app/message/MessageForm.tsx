'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email({ message: 'Please provide a valid email address.' }),
  message: z.string().nonempty({ message: 'A message is required.' }),
  formError: z.string().optional(),
});

export function MessageForm() {
  const [isSubmitted, setSubmitted] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      message: '',
      formError: '',
    },
  });

  const { setError, clearErrors } = form;

  const watchedEmail = form.watch('email');
  const watchedMessage = form.watch('message');

  useEffect(() => {
    clearErrors('formError');
  }, [watchedEmail, watchedMessage, clearErrors]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const response = await fetch('/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();

    if (data.error) {
      setError('formError', {
        message:
          'An error occurred while sending your message. Please try again later.',
      });
    } else {
      setSubmitted(true);
    }
  }

  if (isSubmitted) {
    return (
      <section className='flex flex-col gap-4'>
        <h1 className='rounded-lg bg-green-600 p-5 text-center text-xl font-bold text-white'>
          Thank you for your message. I will respond soon.
        </h1>
        <div className='flex'>
          <Link href='/' className='text-link hover:underline'>
            ← Back to Home
          </Link>
        </div>
      </section>
    );
  } else {
    return (
      <section className='flex flex-col gap-4'>
        <h1 className='text-xl font-bold'>
          Do you have a question or are you interested in working with me? Just
          fill out the form below and I will get back to you within 24 hours.
        </h1>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col gap-4'
          >
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder='Your Email' {...field} />
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
                    <Textarea placeholder='Your Message' {...field} />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.formError &&
                      form.formState.errors.formError.message}
                  </FormMessage>
                </FormItem>
              )}
            />
            <Button type='submit' disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Sending...' : 'Send'}
            </Button>
          </form>
        </Form>
      </section>
    );
  }
}
