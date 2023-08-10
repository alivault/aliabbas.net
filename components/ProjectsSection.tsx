import React from 'react';
import SectionHeader from './SectionHeader';

export default function ProjectsSection({}) {
  return (
    <section className='flex flex-col gap-4'>
      <SectionHeader>🚀 Projects</SectionHeader>
      <ul className='flex flex-col gap-4'>
        <li>
          <a
            href='https://www.aliabbas.dev/color-palette-maker/'
            target='blank'
            className='text-link hover:underline'
          >
            Color Palette Maker [WIP]
          </a>
        </li>
      </ul>
    </section>
  );
}
