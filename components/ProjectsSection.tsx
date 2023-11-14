import React from 'react'
import SectionHeader from './SectionHeader'
import Section from './Section'
import { ExternalLink } from 'lucide-react'

export default function ProjectsSection({}) {
  return (
    <Section>
      <SectionHeader>🚀 Projects</SectionHeader>
      <ul className='flex flex-col gap-4'>
        <li className='flex justify-start'>
          <a
            href='https://alivault.github.io/color-palette-maker/'
            target='blank'
            rel='noopener noreferrer'
            className='flex items-center gap-2 text-link hover:underline'
          >
            Color Palette Maker (WIP)
            <ExternalLink className='h-4 w-4' />
          </a>
        </li>
      </ul>
    </Section>
  )
}
