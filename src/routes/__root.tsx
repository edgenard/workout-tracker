import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Kettlebell Tracker' },
      {
        name: 'description',
        content:
          'Single-kettlebell 4-day program tracker with EMOM timers and Nerd Math progressions',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

const navLink =
  'rounded-lg px-3 py-1.5 font-semibold text-zinc-400 hover:text-zinc-100 [&.active]:bg-zinc-800 [&.active]:text-emerald-400'

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
          <nav className="mx-auto flex max-w-3xl flex-wrap items-center gap-1 px-4 py-3">
            <Link to="/" className="mr-auto text-lg font-black tracking-tight">
              🏋️ Kettlebell<span className="text-emerald-400">Tracker</span>
            </Link>
            <Link to="/" className={navLink} activeOptions={{ exact: true }}>
              Today
            </Link>
            <Link to="/history" className={navLink}>
              History
            </Link>
            <Link to="/plan" className={navLink}>
              Plan
            </Link>
            <Link to="/settings" className={navLink}>
              Settings
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
        {import.meta.env.DEV && (
          <TanStackDevtools
            config={{ position: 'bottom-right' }}
            plugins={[{ name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> }]}
          />
        )}
        <Scripts />
      </body>
    </html>
  )
}
