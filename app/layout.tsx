import type { Metadata } from 'next'
import { notoSans, notoSansMono } from '@/fonts'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'Ali Abbas',
  description: 'Designer. Developer. Team player.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${notoSansMono.variable} ${notoSans.variable}  flex flex-col bg-background px-4 py-10 text-foreground md:py-20`}
      >
        {children}
      </body>
    </html>
  )
}
