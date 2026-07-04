import { Link, createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { DAY_INFO, suggestedDay } from '#/lib/plan'
import { MOVEMENT_NAMES, movementTarget, nextStepHint } from '#/lib/progression'
import { historyStore, progressionStore } from '#/lib/store'
import type { DayId, MovementId } from '#/lib/types'

export const Route = createFileRoute('/')({ component: Home, ssr: false })

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function Home() {
  const progression = useStore(progressionStore)
  const history = useStore(historyStore)
  const now = new Date()
  const today = suggestedDay(now.getDay())
  const lastEntry = history[0]

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
          {WEEKDAYS[now.getDay()]}
        </p>
        {today === 'rest' ? (
          <>
            <h1 className="mt-1 text-3xl font-black">Rest Day</h1>
            <p className="mt-2 text-zinc-400">
              Total recovery. The bell will still be there on Monday.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-1 text-3xl font-black">{DAY_INFO[today].title}</h1>
            <p className="mt-2 text-zinc-400">{DAY_INFO[today].subtitle}</p>
            <Link
              to="/session/$day"
              params={{ day: today }}
              className="mt-4 inline-block rounded-xl bg-emerald-500 px-8 py-3 text-lg font-bold text-zinc-950 hover:bg-emerald-400"
            >
              Start Workout
            </Link>
          </>
        )}
        {lastEntry && (
          <p className="mt-4 text-sm text-zinc-500">
            Last workout: {DAY_INFO[lastEntry.day].title} on{' '}
            {new Date(lastEntry.date).toLocaleDateString()} —{' '}
            {lastEntry.results.length === 0
              ? 'recovery'
              : lastEntry.results.every((r) => r.hit)
                ? 'all goals hit'
                : `${lastEntry.results.filter((r) => r.hit).length}/${lastEntry.results.length} goals hit`}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Current Targets</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(['swing', 'tgu', 'cleanPress', 'squat'] as Array<MovementId>).map((m) => (
            <div key={m} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
                {MOVEMENT_NAMES[m]}
              </p>
              <p className="mt-1 font-semibold">{movementTarget(progression, m)}</p>
              <p className="mt-1 text-sm text-zinc-500">{nextStepHint(progression, m)}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Start Any Session</h2>
        <div className="flex flex-wrap gap-3">
          {(['a', 'b', 'recovery'] as Array<DayId>).map((d) => (
            <Link
              key={d}
              to="/session/$day"
              params={{ day: d }}
              className="rounded-xl border border-zinc-700 px-5 py-2.5 font-semibold hover:bg-zinc-800"
            >
              {DAY_INFO[d].title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
