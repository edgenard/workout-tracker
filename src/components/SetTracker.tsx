import { finishBeep, minuteBeep, unlockAudio } from '#/lib/audio'
import { formatClock, useStopwatch, useWakeLock } from '#/lib/useStopwatch'
import { usePersistedState } from '#/lib/usePersistedState'

interface SetTrackerProps {
  sets: number
  /** Big text shown for each set, e.g. "12 reps" or "5 per leg" */
  repsText: string
  persistenceKey?: string
  /** Called with the number of sets actually completed */
  onDone: (completed: number) => void
}

/**
 * Self-paced sets × reps tracker: tap each set as you finish it. A rest clock
 * shows time since the last set.
 */
export function SetTracker({ sets, repsText, persistenceKey, onDone }: SetTrackerProps) {
  const { status, elapsedMs, start, finish } = useStopwatch(persistenceKey ? `${persistenceKey}:timer` : undefined)
  useWakeLock(status === 'running')
  const [completed, setCompleted] = usePersistedState(persistenceKey ? `${persistenceKey}:completed` : undefined, 0)
  const [lastSetAtMs, setLastSetAtMs] = usePersistedState(persistenceKey ? `${persistenceKey}:last-set` : undefined, 0)

  const restSec = (elapsedMs - lastSetAtMs) / 1000
  const remaining = sets - completed

  const completeSet = () => {
    const next = completed + 1
    setCompleted(next)
    setLastSetAtMs(elapsedMs)
    if (next >= sets) {
      finishBeep()
      finish()
      onDone(next)
    } else {
      minuteBeep()
    }
  }

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-zinc-400">
          {sets} sets of {repsText} · rest as needed, tap each set as you finish it
        </p>
        <button
          type="button"
          className="rounded-xl bg-emerald-500 px-10 py-4 text-xl font-bold text-zinc-950 hover:bg-emerald-400"
          onClick={() => {
            unlockAudio()
            start()
          }}
        >
          Start Sets
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {remaining > 0 ? (
        <>
          <p className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Set {completed + 1} of {sets}
          </p>
          <p className="text-6xl font-black text-emerald-400">{repsText}</p>
          <p className="text-zinc-400 tabular-nums">
            Rest since last set: {formatClock(restSec)}
          </p>
          <button
            type="button"
            className="rounded-xl bg-emerald-500 px-10 py-4 text-xl font-bold text-zinc-950 hover:bg-emerald-400"
            onClick={completeSet}
          >
            Set done
          </button>
        </>
      ) : (
        <p className="text-5xl font-black text-emerald-400">Done</p>
      )}
      <div className="flex gap-2">
        {Array.from({ length: sets }, (_, i) => (
          <span
            key={i}
            className={`size-3 rounded-full ${
              i < completed
                ? 'bg-emerald-500'
                : i === completed
                  ? 'bg-zinc-500'
                  : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-zinc-500 tabular-nums">Total: {formatClock(elapsedMs / 1000)}</p>
      {remaining > 0 && (
        <button
          type="button"
          className="rounded-lg border border-zinc-700 px-6 py-2 font-semibold text-zinc-400 hover:bg-zinc-800"
          onClick={() => {
            finish()
            onDone(completed)
          }}
        >
          End early
        </button>
      )}
    </div>
  )
}
