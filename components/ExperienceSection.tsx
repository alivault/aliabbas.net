import ExperienceList from './ExperienceList'
import SectionHeader from './SectionHeader'
import React from 'react'
import Link from 'next/link'
import Section from './Section'
export default function WorkSection({}) {
  return (
    <Section>
      <SectionHeader>💼 Experience</SectionHeader>
      <ExperienceList maxItems={1} />
      <Link href='/experience' className='text-link hover:underline'>
        Show more experience →
      </Link>
    </Section>
  )
}
