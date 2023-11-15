import React from 'react'
import ExperienceItem from './ExperienceItem'

interface Experience {
  title: string
  company: string
  url?: string
  date: string
  description: string
}

interface ExperienceListProps {
  maxItems?: number
}

const ExperienceList: React.FC<ExperienceListProps> = ({ maxItems }) => {
  const experiences: Experience[] = [
    {
      title: 'Web Developer',
      company: 'Super Studios Inc.',
      url: 'https://superstudios.io/',
      date: '2021 - Present',
      description:
        'Conceptualizing and designing user interfaces using Next.js with Tailwind to rapidly build modern, responsive designs.',
    },
    {
      title: 'Brand Architect',
      company: 'Freelance',
      date: '2019 - 2021',
      description:
        'Leveraged Adobe Creative Suite, Figma, and Webflow to architect and prototype diverse digital products, encompassing website design, app user interface development, and logo creation.',
    },
    {
      title: 'App Designer',
      company: 'DApp Evolution',
      date: '2018 - 2019',
      description:
        'I led app design for TronChat, a social media platform by DappEvolution. It enables users to earn TRX and bridges the gap between cryptocurrency and blockchain. I collaborated with the CTO on high-fidelity designs in Sketch and crafted UI animations using Flinto and After Effects.',
    },
    {
      title: 'Design Director',
      company: 'Live Streaming App',
      date: '2016 - 2018',
      description:
        'I spreaheaded all aspects of design, overseeing branding, app, and web design. Within a year, our rebranded app gained over 1,000 daily active users with an average 48-minute engagement and surpassed 5,000 monthly active users.',
    },
    {
      title: 'Co-Founder',
      company: 'Verge Collective',
      url: 'https://vergecollective.com/',
      date: '2012 - 2016',
      description:
        "I managed our team's brand design roadmap, frequently liaising with clients to comprehend their objectives and challenges. I translated these insights for our team and oversaw brand campaigns, client presentations, feedback integration, and brand standard formulation. Our clientele included Keller Williams Real Estate, Tony Horton of P90X, and The United Nations.",
    },
    {
      title: 'Events Coordinator',
      company: 'UC Santa Barbara',
      date: '2008 - 2011',
      description:
        'I organized concerts and festivals ranging from 800-seat venues to 15,000+ stadium events. I booked over 100 artists, including A-Trak, Major Lazer, Steve Aoki, and Portugal. the Man. My responsibilities included event coordination, artist booking, equipment management, and collaborating with publicity and ticketing teams to drive sales.',
    },
  ]

  const displayedItems = maxItems ? experiences.slice(0, maxItems) : experiences

  return (
    <ul className='flex flex-col gap-6'>
      {displayedItems.map((item, index) => (
        <ExperienceItem key={index} {...item} />
      ))}
    </ul>
  )
}

export default ExperienceList
