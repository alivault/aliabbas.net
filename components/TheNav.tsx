import Link from 'next/link';
import Avatar from './Avatar';
import NavLink from './NavLink';

import React from 'react';
export default function TheNav({}) {
  return (
    <nav className='mx-auto flex w-full items-start'>
      <ul className='flex flex-row gap-4'>
        <li className='flex items-center gap-2'>
          <Link href='/'>
            <Avatar size='md' />
          </Link>
          <div className='flex flex-col'>
            <NavLink href='/'>Ali Abbas</NavLink>
            <Link href='/' className='text-xs opacity-50 hover:underline'>
              aliabbas.dev
            </Link>
          </div>
        </li>
      </ul>
    </nav>
  );
}
