import './globals.css';
import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: 'Ali Abbas',
  description: "I'm a web developer focused on building great products.",
  openGraph: {
    title: 'Ali Abbas',
    description: "I'm a web developer focused on building great products.",
    url: 'https://aliabbas.dev',
    type: 'website',
    images: [
      {
        url: 'https://aliabbas.dev/opengraph-image.jpeg',
        width: 384,
        height: 384,
        alt: 'Ali Headshot',
      },
    ],
  },
  other: {
    'twitter:card': 'summary',
    'twitter:title': 'Ali Abbas',
    'twitter:description':
      "I'm a web developer focused on building great products.",
    'twitter:image': 'https://aliabbas.dev/twitter-image.jpeg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className='mx-auto max-w-3xl bg-background p-4 text-foreground lg:p-6'>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
