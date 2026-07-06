import { useState } from 'react'
import { finishBeep, minuteBeep, unlockAudio } from '#/lib/audio'
import { formatClock, useStopwatch, useWakeLock } from '#/lib/useStopwatch'

interface LadderTrackerProps {
  /** Rungs in order, e.g. 3-2-1 × 3 ladders → 9 rungs */
  rungs: Array<{ ladder: number; reps: number }>
  /** Called with the number of rungs actually completed */
  onDone: (completed: number) => void
}

/**
 * Self-paced tracker for Clean & Press reverse ladders: tap each rung as you
 * finish it. A rest clock shows time since the last rung so you can keep
 * rests honest.
 */
export function LadderTracker({ rungs, onDone }: LadderTrackerProps) {
  const { status, elapsedMs, start, finish } = useStopwatch()
  useWakeLock(status === 'running')
  const [completed, setCompleted] = useState(0)
  const [lastRungAtMs, setLastRungAtMs] = useState(0)

  const restSec = (elapsedMs - lastRungAtMs) / 1000
  const current = rungs[completed]

  const completeRung = () => {
    const next = completed + 1
    setCompleted(next)
    setLastRungAtMs(elapsedMs)
    if (next >= rungs.length) {
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
          {rungs.length} rungs · rest between rungs, tap each one as you finish it
        </p>
        <button
          type="button"
          className="rounded-xl bg-emerald-500 px-10 py-4 text-xl font-bold text-zinc-950 hover:bg-emerald-400"
          onClick={() => {
            unlockAudio()
            start()
          }}
        >
          Start Ladders
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {current ? (
        <>
          <p className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Ladder {current.ladder} · Rung {completed + 1} of {rungs.length}
          </p>
          <p className="text-6xl font-black text-emerald-400">
            {current.reps} L + {current.reps} R
          </p>
          <p className="text-zinc-400 tabular-nums">
            Rest since last rung: {formatClock(restSec)}
          </p>
          <button
            type="button"
            className="rounded-xl bg-emerald-500 px-10 py-4 text-xl font-bold text-zinc-950 hover:bg-emerald-400"
            onClick={completeRung}
          >
            Rung done
          </button>
        </>
      ) : (
        <p className="text-5xl font-black text-emerald-400">Done</p>
      )}
      <div className="flex max-w-md flex-wrap justify-center gap-2">
        {rungs.map((r, i) => (
          <span
            key={i}
            className={`rounded-md px-2.5 py-1 text-sm font-semibold tabular-nums ${
              i < completed
                ? 'bg-emerald-500/20 text-emerald-400'
                : i === completed
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            {r.reps}
          </span>
        ))}
      </div>
      <p className="text-sm text-zinc-500 tabular-nums">Total: {formatClock(elapsedMs / 1000)}</p>
      {current && (
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
