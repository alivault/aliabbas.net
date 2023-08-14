import React from 'react'
import TheNav from './TheNav'
import { SubscribeForm } from '@/app/subscribe/SubscribeForm'
export default function Footer({}) {
  return (
    <div className='flex flex-col gap-6 border-t py-6'>
      <TheNav />
      <SubscribeForm />
    </div>
  )
}
