import { Link, createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { DAY_INFO, suggestedDay } from '#/lib/plan'
import { formatTarget } from '#/lib/planText'
import { historyStore, workoutsStore } from '#/lib/store'
import type { DayId } from '#/lib/types'

export const Route = createFileRoute('/')({ component: Home, ssr: false })
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function Home() {
  const workouts = useStore(workoutsStore)
  const history = useStore(historyStore)
  const now = new Date()
  const today = suggestedDay(now.getDay())
  const lastEntry = history[0]
  return <div className="space-y-8">
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">{WEEKDAYS[now.getDay()]}</p>
      {today === 'rest' ? <><h1 className="mt-1 text-3xl font-black">Rest Day</h1><p className="mt-2 text-zinc-400">Total recovery. The bell will still be there on Monday.</p></> : <><h1 className="mt-1 text-3xl font-black">{DAY_INFO[today].title}</h1><p className="mt-2 text-zinc-400">{DAY_INFO[today].subtitle}</p><Link to="/session/$day" params={{ day: today }} className="mt-4 inline-block rounded-xl bg-emerald-500 px-8 py-3 text-lg font-bold text-zinc-950 hover:bg-emerald-400">Start Workout</Link></>}
      {lastEntry && <p className="mt-4 text-sm text-zinc-500">Last workout: {DAY_INFO[lastEntry.day].title} on {new Date(lastEntry.date).toLocaleDateString()} — {lastEntry.results.length === 0 ? 'recovery' : lastEntry.results.every((result) => result.hit) ? 'all goals hit' : `${lastEntry.results.filter((result) => result.hit).length}/${lastEntry.results.length} goals hit`}</p>}
    </section>
    <section>
      <h2 className="mb-3 text-xl font-bold">Current Targets</h2>
      {(['a', 'b'] as const).map((day) => <div key={day} className="mb-5"><h3 className="mb-2 font-bold text-zinc-400">{DAY_INFO[day].title}</h3><div className="grid gap-3 sm:grid-cols-2">{workouts[day].coreWorkout.map((item, index) => 'currentPhase' in item && <div key={`${item.exercise.id}-${index}`} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">{item.exercise.name}</p><p className="mt-1 font-semibold">{formatTarget(item.exercise.name, item.currentPhase)}</p>{item.nextPhase && <p className="mt-1 text-sm text-zinc-500">Next: {formatTarget(item.exercise.name, item.nextPhase)}</p>}</div>)}</div></div>)}
    </section>
    <section><h2 className="mb-3 text-xl font-bold">Start Any Session</h2><div className="flex flex-wrap gap-3">{(['a', 'b', 'recovery'] as Array<DayId>).map((day) => <Link key={day} to="/session/$day" params={{ day }} className="rounded-xl border border-zinc-700 px-5 py-2.5 font-semibold hover:bg-zinc-800">{DAY_INFO[day].title}</Link>)}</div></section>
  </div>
}
