import './globals.css'
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  title: 'Ali Abbas',
  description: "I'm a web developer focused on building great products.",
  openGraph: {
    title: 'Ali Abbas',
    description: "I'm a web developer focused on building great products.",
    url: 'https://aliabbas.dev',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Ali Abbas',
    description: "I'm a web developer focused on building great products.",
  },
  other: {
    'darkreader-lock': 'true',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en'>
      <body className='mx-auto flex min-h-[100dvh] max-w-2xl flex-col bg-background p-4 text-foreground lg:p-6'>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
