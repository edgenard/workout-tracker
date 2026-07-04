import { useEffect, useRef } from 'react'
import { finishBeep, minuteBeep, tick, unlockAudio } from '#/lib/audio'
import { formatClock, useStopwatch, useWakeLock } from '#/lib/useStopwatch'

interface EmomTimerProps {
  totalMinutes: number
  /** Big text shown for the work to do this minute, e.g. "10 reps" */
  repsText: string
  /** Optional per-minute label, e.g. Left/Right for alternating TGU */
  minuteLabel?: (minuteIndex: number) => string
  onDone: () => void
}

export function EmomTimer({ totalMinutes, repsText, minuteLabel, onDone }: EmomTimerProps) {
  const { status, elapsedMs, start, pause, resume, finish } = useStopwatch()
  useWakeLock(status === 'running')

  const totalMs = totalMinutes * 60_000
  const clamped = Math.min(elapsedMs, totalMs)
  const minuteIdx = Math.min(Math.floor(clamped / 60_000), totalMinutes - 1)
  const secIntoMinute = Math.floor((clamped % 60_000) / 1000)
  const secRemaining = 60 - secIntoMinute

  const lastMinuteRef = useRef(0)
  const lastTickSecRef = useRef(-1)
  const doneRef = useRef(false)

  useEffect(() => {
    if (status !== 'running') return
    if (elapsedMs >= totalMs) {
      if (!doneRef.current) {
        doneRef.current = true
        finishBeep()
        finish()
        onDone()
      }
      return
    }
    const m = Math.floor(elapsedMs / 60_000)
    if (m !== lastMinuteRef.current) {
      lastMinuteRef.current = m
      minuteBeep()
    }
    const s = Math.floor((elapsedMs % 60_000) / 1000)
    if (s >= 57 && s !== lastTickSecRef.current) {
      lastTickSecRef.current = s
      tick()
    }
  }, [elapsedMs, status, totalMs, finish, onDone])

  const endEarly = () => {
    if (doneRef.current) return
    doneRef.current = true
    finish()
    onDone()
  }

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-5xl font-black tabular-nums">{totalMinutes}:00</p>
        <p className="text-zinc-400">
          {totalMinutes} minutes · beep at the top of every minute
        </p>
        <button
          type="button"
          className="rounded-xl bg-emerald-500 px-10 py-4 text-xl font-bold text-zinc-950 hover:bg-emerald-400"
          onClick={() => {
            unlockAudio()
            start()
          }}
        >
          Start EMOM
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <p className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
        Minute {minuteIdx + 1} of {totalMinutes}
        {minuteLabel ? ` — ${minuteLabel(minuteIdx)}` : ''}
      </p>
      <p
        className={`text-7xl font-black tabular-nums ${
          status === 'done' ? 'text-emerald-400' : secRemaining <= 3 ? 'text-amber-400' : ''
        }`}
      >
        {status === 'done' ? 'Done' : `0:${String(secRemaining === 60 ? 0 : secRemaining).padStart(2, '0')}`}
      </p>
      <p className="text-3xl font-bold text-emerald-400">{repsText}</p>
      <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full bg-emerald-500 transition-[width]"
          style={{ width: `${(clamped / totalMs) * 100}%` }}
        />
      </div>
      <p className="text-sm text-zinc-500">Total: {formatClock(clamped / 1000)}</p>
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
