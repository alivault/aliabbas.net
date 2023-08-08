import React from 'react';

interface WorkItemProps {
  title: string;
  company: string;
  url?: string;
  date: string;
  description: string;
}

const WorkItem: React.FC<WorkItemProps> = ({
  title,
  company,
  url,
  date,
  description,
}) => {
  return (
    <li className='flex flex-col'>
      <span className='font-medium'>{title}</span>
      <span className='text-sm'>
        {url ? (
          <a
            href={url}
            target='_blank'
            rel='noopener noreferrer'
            className='dark:text-link-dark text-link hover:underline'
          >
            {company}
          </a>
        ) : (
          company
        )}
      </span>
      <span className='text-sm opacity-50'>{date}</span>
      <p className='text-sm'>{description}</p>
    </li>
  );
};

export default WorkItem;
