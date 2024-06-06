import type { Metadata } from 'next'
import { notoSans, notoSansMono } from '@/fonts'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Ali Abbas',
    default: 'Ali Abbas',
  },
  description: 'Designer. Developer. Team player.',
  metadataBase: new URL('https://www.aliabbas.dev'),
  other: {
    'darkreader-lock': 'true',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${notoSansMono.variable} ${notoSans.variable}`}>
      <body className="flex flex-col bg-background px-4 py-10 font-sans text-foreground antialiased md:py-20 [&_:focus-visible]:outline-none [&_:focus-visible]:ring-2 [&_:focus-visible]:ring-ring">
        {children}
      </body>
    </html>
  )
}
