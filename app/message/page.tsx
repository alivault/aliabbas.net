import React from 'react';
import TheNav from '@/components/TheNav';
import { MessageForm } from './MessageForm';

export default function MessagePage() {
  return (
    <main className='flex flex-col gap-8'>
      <TheNav />
      <MessageForm />
    </main>
  );
}
