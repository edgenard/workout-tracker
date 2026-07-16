import { useEffect, useState } from 'react'
import { HeadContent, Link, Scripts, createRootRoute, useRouter } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useStore } from '@tanstack/react-store'
import { activeSessionStore } from '#/lib/store'

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

const NAV_ITEMS: Array<{ to: string; label: string }> = [
  { to: '/', label: 'Today' },
  { to: '/history', label: 'History' },
  { to: '/progress', label: 'Progress' },
  { to: '/plan', label: 'Plan' },
  { to: '/settings', label: 'Settings' },
]

function Nav() {
  const router = useRouter()
  const activeSession = useStore(activeSessionStore)
  // The prerendered SPA shell must carry no active state: hydration adopts the
  // shell's DOM attributes as-is, so anything baked in at prerender time (when
  // the location is '/') would stick. Start with no active link, then set it
  // from the real URL after mount and after every completed navigation.
  const [pathname, setPathname] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
    setPathname(window.location.pathname)
    return router.subscribe('onResolved', () => setPathname(window.location.pathname))
  }, [router])

  // Strip the deploy basepath (e.g. /workout-tracker on GitHub Pages) so
  // active states are computed against app-relative paths.
  const base = router.options.basepath ?? '/'
  let rel: string | null = null
  if (pathname !== null) {
    rel = base !== '/' && pathname.startsWith(base) ? pathname.slice(base.length) : pathname
    if (!rel.startsWith('/')) rel = `/${rel}`
  }

  return (
    <nav className="mx-auto flex max-w-3xl flex-wrap items-center gap-1 px-4 py-3">
      <Link to="/" className="mr-auto text-lg font-black tracking-tight">
        🏋️ Kettlebell<span className="text-emerald-400">Tracker</span>
      </Link>
      {hydrated && activeSession && <Link
        to="/session/$day"
        params={{ day: activeSession.day }}
        className={`rounded-lg px-3 py-1.5 font-semibold ${rel?.startsWith('/session') ? 'bg-emerald-500 text-zinc-950' : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'}`}
      >Active Workout</Link>}
      {NAV_ITEMS.map(({ to, label }) => {
        const active = rel !== null && (to === '/' ? rel === '/' : rel.startsWith(to))
        return (
          <Link
            key={to}
            to={to}
            className={`rounded-lg px-3 py-1.5 font-semibold ${
              active
                ? 'bg-zinc-800 text-emerald-400'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
          <Nav />
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
