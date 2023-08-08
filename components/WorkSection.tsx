import WorkList from './WorkList';
import SectionHeader from './SectionHeader';
import React from 'react';
import Link from 'next/link';
export default function WorkSection({}) {
  return (
    <section className='flex flex-col gap-4'>
      <SectionHeader>💼 Work History</SectionHeader>
      <WorkList maxItems={1} />
      <Link href='/work' className='text-link hover:underline'>
        Show full work history →
      </Link>
    </section>
  );
}
