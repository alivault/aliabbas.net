import React, { ReactNode } from 'react'

interface SectionHeaderProps {
  children: ReactNode
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ children }) => {
  return <h2 className='text-xl font-bold'>{children}</h2>
}

export default SectionHeader
