import { useEffect, useRef } from 'react'
import { finishBeep, switchBeep, tick, unlockAudio } from '#/lib/audio'
import { formatClock, useStopwatch, useWakeLock } from '#/lib/useStopwatch'

interface IntervalTrackerProps {
  workSeconds: number
  restSeconds: number
  reps: number
  persistenceKey?: string
  autoStart?: boolean
  onDone: (repsDone: number) => void
}

const TICK_SECONDS = 3

/** Work/rest interval timer (e.g. Tabata): counts down work, then rest, on repeat for N reps. */
export function IntervalTracker({ workSeconds, restSeconds, reps, persistenceKey, autoStart = false, onDone }: IntervalTrackerProps) {
  const { status, elapsedMs, start, pause, resume, finish } = useStopwatch(persistenceKey)
  useWakeLock(status === 'running')

  const cycleMs = (workSeconds + restSeconds) * 1000
  const totalMs = (reps - 1) * cycleMs + workSeconds * 1000
  const clamped = Math.min(elapsedMs, totalMs)
  const roundIdx = Math.min(Math.floor(clamped / cycleMs), reps - 1)
  const posMs = clamped - roundIdx * cycleMs
  const inWork = posMs < workSeconds * 1000
  const secRemaining = inWork ? workSeconds - Math.floor(posMs / 1000) : restSeconds - Math.floor((posMs - workSeconds * 1000) / 1000)

  const lastPhaseKeyRef = useRef<string | null>(null)
  const lastTickSecRef = useRef(-1)
  const doneRef = useRef(false)

  useEffect(() => {
    if (autoStart && status === 'idle') start()
  }, [autoStart, start, status])

  useEffect(() => {
    if (status !== 'running') return
    if (clamped >= totalMs) {
      if (!doneRef.current) {
        doneRef.current = true
        finishBeep()
        finish()
        onDone(reps)
      }
      return
    }
    const phaseKey = `${roundIdx}:${inWork ? 'work' : 'rest'}`
    if (lastPhaseKeyRef.current !== null && lastPhaseKeyRef.current !== phaseKey) {
      switchBeep()
      lastTickSecRef.current = -1
    }
    lastPhaseKeyRef.current = phaseKey
    if (secRemaining >= 0 && secRemaining <= TICK_SECONDS && secRemaining !== lastTickSecRef.current) {
      lastTickSecRef.current = secRemaining
      tick()
    }
  }, [clamped, totalMs, roundIdx, inWork, secRemaining, status, finish, onDone, reps])

  const endEarly = () => {
    if (doneRef.current) return
    doneRef.current = true
    finish()
    onDone(roundIdx)
  }

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-zinc-400">
          {reps} rounds · {workSeconds}s work / {restSeconds}s rest
        </p>
        <button
          type="button"
          className="rounded-xl bg-emerald-500 px-10 py-4 text-xl font-bold text-zinc-950 hover:bg-emerald-400"
          onClick={() => {
            unlockAudio()
            start()
          }}
        >
          Start Intervals
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <p className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
        Round {roundIdx + 1} of {reps}
        {status !== 'done' ? ` — ${inWork ? 'Work' : 'Rest'}` : ''}
      </p>
      <p
        className={`text-7xl font-black tabular-nums ${
          status === 'done'
            ? 'text-emerald-400'
            : inWork
              ? 'text-emerald-400'
              : 'text-amber-400'
        }`}
      >
        {status === 'done' ? 'Done' : formatClock(Math.max(0, secRemaining))}
      </p>
      <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full bg-emerald-500 transition-[width]"
          style={{ width: `${(clamped / totalMs) * 100}%` }}
        />
      </div>
      <p className="text-sm text-zinc-500 tabular-nums">Total: {formatClock(clamped / 1000)}</p>
      {status !== 'done' && (
        <div className="flex gap-3">
          {status === 'running' ? (
            <button
              type="button"
              className="rounded-lg border border-zinc-700 px-6 py-2 font-semibold hover:bg-zinc-800"
              onClick={pause}
            >
              Pause
            </button>
          ) : (
            <button
              type="button"
              className="rounded-lg bg-emerald-500 px-6 py-2 font-semibold text-zinc-950 hover:bg-emerald-400"
              onClick={resume}
            >
              Resume
            </button>
          )}
          <button
            type="button"
            className="rounded-lg border border-zinc-700 px-6 py-2 font-semibold text-zinc-400 hover:bg-zinc-800"
            onClick={endEarly}
          >
            End early
          </button>
        </div>
      )}
    </div>
  )
}
