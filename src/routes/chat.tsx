import { createFileRoute } from '@tanstack/react-router'
import PortfolioChat from '~/components/chat/PortfolioChat'
import Main from '~/components/Main'

export const Route = createFileRoute('/chat')({
  head: () => ({
    meta: [
      { title: 'Ask About Ali — Portfolio AI' },
      {
        name: 'description',
        content:
          "Ask Ali Abbas's portfolio assistant about his experience, selected work, technical skills, and product engineering approach.",
      },
    ],
  }),
  component: ChatPage,
})

function ChatPage() {
  return (
    <Main hideFooterOnMobile>
      <section className="site-noise bg-background text-foreground">
        <div className="relative z-30 mx-auto max-w-[1600px]">
          <PortfolioChat />
        </div>
      </section>
    </Main>
  )
}
