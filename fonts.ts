import { Noto_Sans, Noto_Sans_Mono } from 'next/font/google'

export const notoSans = Noto_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sans',
})

export const notoSansMono = Noto_Sans_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sans-mono',
})
