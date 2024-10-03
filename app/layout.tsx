import type { Metadata } from 'next'
import { notoSans, playfair } from '@/fonts'
import '@/app/globals.css'
import Footer from '@/components/Footer'

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
    <html
      lang="en"
      className={`${notoSans.variable} ${playfair.variable} h-full`}
    >
      <body className="relative flex h-full flex-col bg-background font-sans text-foreground antialiased [&_:focus-visible]:outline-none [&_:focus-visible]:ring-2 [&_:focus-visible]:ring-ring">
        {children}
        <Footer />
      </body>
    </html>
  )
}
