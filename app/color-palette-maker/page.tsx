import Link from 'next/link';

export default function ColorPaletteMaker() {
  return (
    <main className='flex flex-col gap-1'>
      <p>Temporarily moved to:</p>
      <a
        href='https://alivault.github.io/color-palette-maker/'
        target='blank'
        rel='noopener noreferrer'
        className='text-link hover:underline'
      >
        https://alivault.github.io/color-palette-maker/
      </a>
      <p>
        Please bookmark{' '}
        <Link href='/' className='text-link hover:underline'>
          aliabbas.dev
        </Link>{' '}
        for future updates on this project.
      </p>
    </main>
  );
}
