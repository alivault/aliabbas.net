import React from 'react';
import TheNav from '@/components/TheNav';
import { MessageForm } from './MessageForm';

export default function MessagePage() {
  return (
    <main>
      <header>
        <TheNav />
      </header>
      <MessageForm />
    </main>
  );
}
