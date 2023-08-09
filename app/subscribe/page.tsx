import React from 'react';
import TheNav from '@/components/TheNav';
import { SubscribeForm } from './SubscribeForm';

export default function FollowPage() {
  return (
    <main className='flex flex-col gap-8'>
      <TheNav />
      <section className='flex flex-col gap-4'>
        <h1 className='text-3xl font-bold'>The Chronicles of Ali</h1>
        <SubscribeForm />
      </section>
    </main>
  );
}
