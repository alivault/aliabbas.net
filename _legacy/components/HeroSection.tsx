import Link from 'next/link'
import Logo from './Logo'
import { Button } from './ui/button'

export default function HeroSection() {
  return (
    <section className="flex flex-col items-center p-5 pt-10 text-center">
      <Logo className="mb-4 w-[64px]" />
      <h1 className="mb-4 font-heading text-6xl">Ali Abbas</h1>
      <p className="prose mb-4 max-w-none text-lg leading-relaxed dark:prose-invert">
        Front-end developer currently working at Super Studios, Inc.
      </p>
      <Button asChild variant="secondary" className="w-[110px]">
        <Link href="/contact">Contact</Link>
      </Button>
    </section>
  )
}
