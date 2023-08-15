import React, { ReactNode } from 'react'

interface SectionProps {
  children: ReactNode
}

const Section: React.FC<SectionProps> = ({ children }) => {
  return <section className='flex flex-col gap-2'>{children}</section>
}

export default Section
