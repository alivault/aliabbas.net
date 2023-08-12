import React from 'react';
import ExperienceItem from './WorkItem';

interface Experience {
  title: string;
  company: string;
  url?: string;
  date: string;
  description: string;
}

interface ExperienceListProps {
  maxItems?: number;
}

const ExperienceList: React.FC<ExperienceListProps> = ({ maxItems }) => {
  const experiences: Experience[] = [
    {
      title: 'Web Designer',
      company: 'Super Studios Inc.',
      url: 'https://superstudios.io/',
      date: 'Mar 2021 - Present',
      description:
        'Conceptualizing and designing user interfaces using Figma for UX/UI design, Webflow for streamlined prototype development, and Next.js with Tailwind CSS to rapidly build modern, responsive designs.',
    },
    {
      title: 'Web Designer',
      company: 'Freelance',
      date: 'Mar 2019 - Mar 2021 · 2 yrs 1 mo',
      description:
        'Leveraged Adobe Creative Suite, Figma, and Webflow to architect and prototype diverse digital products, encompassing website design, app user interface development, and logo creation.',
    },
    {
      title: 'Product Designer',
      company: 'DApp Evolution',
      date: 'Dec 2018 - Mar 2019 · 4 mos',
      description:
        'DappEvolution owns TronChat, a social media platform that enables users to earn TRX from their interactions. TronChat bridges the gap between cryptocurrency and practical blockchain use. I led the app design for iOS and Android, collaborated with the CTO on high-fidelity designs in Sketch, and crafted custom UI animations using Flinto and After Effects.',
    },
    {
      title: 'Design Director',
      company: 'Live Streaming App',
      date: 'Oct 2016 - Dec 2018 · 2 yrs 3 mos',
      description:
        'I spearheaded the brand, app, and web design. I oversaw marketing design, managed the app design for iOS and Android, and shaped the web experience. Collaborating with the CTO and CEO, I directed our feature and design roadmap. I provided developers with Sketch files via Zeplin. Within a year, our rebranded app saw daily active users rise from hundreds to over 1,000, with an average 48-minute engagement, and surpassed 5,000 monthly active users.',
    },
    {
      title: 'Creative Director & Co-Founder',
      company: 'Verge Collective',
      url: 'https://vergecollective.com/',
      date: 'Oct 2012 - Sep 2016 · 4 yrs',
      description:
        "I managed our team's brand design roadmap, frequently liaising with clients to comprehend their objectives and challenges. I translated these insights for our team and oversaw brand campaigns, client presentations, feedback integration, and brand standard formulation. Our clientele included Keller Williams Real Estate, Tony Horton of P90X, The Santa Maria Group, Prime Source Mortgage, Capital Direct Funding, and The United Nations.",
    },
    {
      title: 'Events Coordinator',
      company: 'UC Santa Barbara',
      date: 'Oct 2008 - Dec 2011 · 3 yrs 3 mos',
      description:
        'I organized concerts and festivals, from 800-seat venues to 15,000+ stadium events over three years. Booked artists included A-Trak, Major Lazer, Steve Aoki, People Under The Stairs, Portugal. the Man, OK Go and many others, totaling over 100 performers. My responsibilities encompassed event coordination, artist booking negotiations, equipment management, and collaboration with publicity and ticketing teams to drive sales.',
    },
  ];

  const displayedItems = maxItems
    ? experiences.slice(0, maxItems)
    : experiences;

  return (
    <ul className='flex flex-col gap-6'>
      {displayedItems.map((item, index) => (
        <ExperienceItem key={index} {...item} />
      ))}
    </ul>
  );
};

export default ExperienceList;
