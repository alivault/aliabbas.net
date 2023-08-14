import WorkList from './WorkList'
import SectionHeader from './SectionHeader'
import React from 'react'
import Link from 'next/link'
export default function WorkSection({}) {
  return (
    <section className='flex flex-col gap-4'>
      <SectionHeader>💼 Experience</SectionHeader>
      <WorkList maxItems={1} />
      <Link href='/experience' className='text-link hover:underline'>
        Show more experience →
      </Link>
    </section>
  )
}
