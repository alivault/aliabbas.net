import { createRootRoute, Outlet, HeadContent, Scripts } from '@tanstack/react-router'
import { Meta } from '@tanstack/react-start'
import '../styles/globals.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'darkreader-lock', content: 'true' },
      { title: 'Ali Abbas' },
      { name: 'description', content: 'Designer. Developer. Team player.' },
    ],
    links: [
      { rel: 'icon', href: '/icon.png' },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="flex flex-col bg-background font-sans text-foreground antialiased [&_:focus-visible]:outline-none [&_:focus-visible]:ring-2 [&_:focus-visible]:ring-ring">
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}

