import React from 'react';
import TheNav from '@/components/TheNav';
import { SubscribeForm } from './SubscribeForm';

export default function FollowPage() {
  return (
    <main>
      <header>
        <TheNav />
      </header>
      <section className='flex flex-col gap-4'>
        <SubscribeForm />
      </section>
    </main>
  );
}
