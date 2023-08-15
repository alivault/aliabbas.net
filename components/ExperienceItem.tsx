import React from 'react'
import { ExternalLink } from 'lucide-react'

interface WorkItemProps {
  title: string
  company: string
  url?: string
  date: string
  description: string
}

const WorkItem: React.FC<WorkItemProps> = ({
  title,
  company,
  url,
  date,
  description,
}) => {
  return (
    <li className='flex flex-col items-start gap-1'>
      <span className='text-sm opacity-50'>{date}</span>
      <span className='font-medium'>{title}</span>
      {url ? (
        <a
          href={url}
          target='_blank'
          rel='noopener noreferrer'
          className='flex items-center justify-start gap-1 text-sm text-link hover:underline'
        >
          {company}
          <ExternalLink className='h-4 w-4' />
        </a>
      ) : (
        <span className='text-sm opacity-50'>{company}</span>
      )}
      <p className='opacity-80'>{description}</p>
    </li>
  )
}

export default WorkItem
