import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { DAY_INFO } from '#/lib/plan'
import { MOVEMENT_NAMES } from '#/lib/progression'
import { bellStore, deleteWorkout, historyStore } from '#/lib/store'
import { entryVolume, formatVolume } from '#/lib/volume'

export const Route = createFileRoute('/history')({ component: History, ssr: false })

function History() {
  const history = useStore(historyStore)
  const bell = useStore(bellStore)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Workout History</h1>
      {history.length === 0 && (
        <p className="text-zinc-400">
          Nothing logged yet. Finish a session and it will show up here.
        </p>
      )}
      {history.map((entry) => (
        <div key={entry.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-bold">
              {DAY_INFO[entry.day].title}
              <span className="ml-2 text-sm font-normal text-zinc-500">
                {new Date(entry.date).toLocaleString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </p>
            <button
              type="button"
              className="text-sm text-zinc-500 hover:text-rose-400"
              onClick={() => {
                if (window.confirm('Delete this workout log? (Targets are not rewound.)')) {
                  deleteWorkout(entry.id)
                }
              }}
            >
              Delete
            </button>
          </div>
          {entry.results.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-400">Warm-up and cool-down only.</p>
          ) : (
            <>
              <ul className="mt-2 space-y-1">
                {entry.results.map((r) => (
                  <li key={r.movement} className="text-sm text-zinc-300">
                    <span className={r.hit ? 'text-emerald-400' : 'text-rose-400'}>
                      {r.hit ? '✓' : '✗'}
                    </span>{' '}
                    <span className="font-semibold">{MOVEMENT_NAMES[r.movement]}:</span> {r.target}
                    {r.weight !== undefined && (
                      <span className="text-zinc-500">
                        {' '}
                        @ {r.weight > 0 ? `${r.weight} ${r.unit}` : 'bodyweight'}
                      </span>
                    )}
                    {r.repsDone !== undefined && r.targetReps !== undefined && (
                      <span className="text-zinc-500"> — {r.repsDone}/{r.targetReps} reps</span>
                    )}
                  </li>
                ))}
              </ul>
              {(() => {
                const v = entryVolume(entry, bell.unit)
                return v !== null ? (
                  <p className="mt-2 text-sm text-zinc-500">
                    Total output:{' '}
                    <span className="font-semibold text-zinc-300 tabular-nums">
                      {formatVolume(v)}
                    </span>{' '}
                    {bell.unit}·reps
                  </p>
                ) : null
              })()}
            </>
          )}
        </div>
      ))}
    </div>
  )
}
