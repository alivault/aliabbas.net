import Footer from './Footer'
import PageAnimation from './PageAnimation'

interface MainProps {
  children: React.ReactNode
}
export default function Main({ children }: MainProps) {
  return (
    <main className="mx-auto w-full max-w-2xl">
      <PageAnimation>
        {children}
        <Footer />
      </PageAnimation>
    </main>
  )
}
