'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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
import Link from 'next/link';
import Spinner from '@/components/Spinner';

const formSchema = z.object({
  email: z.string().email({
    message: 'Please provide a valid email address.',
  }),
  formError: z.string().optional(),
});

export function SubscribeForm() {
  const [isSubmitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      formError: '',
    },
  });

  const { setError } = form;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    form.clearErrors('formError');

    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(values),
    });

    const data = await response.json();

    if (!response.ok) {
      setError('formError', { message: data.message });
    } else {
      setSubmitted(true);
    }
  }

  if (isSubmitted) {
    return (
      <section className='flex flex-col gap-4'>
        <div className='flex flex-col gap-4'>
          <h1 className='rounded-lg bg-green-600 p-5 text-center text-xl font-bold text-white'>
            Thank you for subscribing!
          </h1>
          <div className='flex'>
            <Link href='/' className='text-link hover:underline'>
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>
    );
  } else {
    return (
      <section className='flex flex-col gap-4'>
        <h1 className='text-xl font-bold'>
          Receive my articles directly in your inbox.
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
                  <FormMessage>
                    {form.formState.errors.formError &&
                      form.formState.errors.formError.message}
                  </FormMessage>
                </FormItem>
              )}
            />
            <Button type='submit' disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Spinner size='md' />
              ) : (
                'Subscribe'
              )}
            </Button>
          </form>
        </Form>
      </section>
    );
  }
}
