import { Link } from '@tanstack/react-router'
import Logo from './Logo'
import { Button } from './ui/button'

export default function HeroSection() {
  return (
    <section className="flex flex-col items-center p-5 pt-10 text-center">
      <Logo className="mb-4 w-[64px]" />
      <h1 className="font-heading mb-4 text-6xl">Ali Abbas</h1>
      <p className="prose dark:prose-invert mb-4 max-w-none text-lg leading-relaxed">
        Front-end developer currently working at Super Studios, Inc.
      </p>
      <Button render={<Link to="/contact" />} variant="secondary">
        Contact
      </Button>
    </section>
  )
}
