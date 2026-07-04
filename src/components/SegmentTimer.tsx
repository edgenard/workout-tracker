import { useEffect, useRef } from 'react'
import { finishBeep, minuteBeep, unlockAudio } from '#/lib/audio'
import { formatClock, useStopwatch, useWakeLock } from '#/lib/useStopwatch'
import type { TimerSegment } from '#/lib/types'

interface SegmentTimerProps {
  title: string
  segments: Array<TimerSegment>
  onDone: () => void
}

/** Guided interval timer for the warm-up / cool-down sequences */
export function SegmentTimer({ title, segments, onDone }: SegmentTimerProps) {
  const { status, elapsedMs, start, pause, resume, finish } = useStopwatch()
  useWakeLock(status === 'running')

  const totalSeconds = segments.reduce((sum, s) => sum + s.seconds, 0)
  const elapsedSec = Math.min(elapsedMs / 1000, totalSeconds)

  let currentIdx = segments.length - 1
  let segStart = totalSeconds - segments[segments.length - 1].seconds
  let acc = 0
  for (let i = 0; i < segments.length; i++) {
    if (elapsedSec < acc + segments[i].seconds) {
      currentIdx = i
      segStart = acc
      break
    }
    acc += segments[i].seconds
  }
  const current = segments[currentIdx]
  const segRemaining = segStart + current.seconds - elapsedSec
  const next = segments[currentIdx + 1]

  const lastIdxRef = useRef(0)
  const doneRef = useRef(false)

  useEffect(() => {
    if (status !== 'running') return
    if (elapsedMs / 1000 >= totalSeconds) {
      if (!doneRef.current) {
        doneRef.current = true
        finishBeep()
        finish()
        onDone()
      }
      return
    }
    if (currentIdx !== lastIdxRef.current) {
      lastIdxRef.current = currentIdx
      minuteBeep()
    }
  }, [elapsedMs, status, currentIdx, totalSeconds, finish, onDone])

  const endEarly = () => {
    if (doneRef.current) return
    doneRef.current = true
    finish()
    onDone()
  }

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-5xl font-black tabular-nums">{formatClock(totalSeconds)}</p>
        <ol className="w-full max-w-md space-y-1 text-zinc-400">
          {segments.map((s) => (
            <li key={s.name} className="flex justify-between gap-4">
              <span>{s.name}</span>
              <span className="tabular-nums">{formatClock(s.seconds)}</span>
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="rounded-xl bg-emerald-500 px-10 py-4 text-xl font-bold text-zinc-950 hover:bg-emerald-400"
          onClick={() => {
            unlockAudio()
            start()
          }}
        >
          Start {title}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
        {currentIdx + 1} of {segments.length}
      </p>
      <p className="text-3xl font-bold text-emerald-400">{current.name}</p>
      <p className={`text-7xl font-black tabular-nums ${status === 'done' ? 'text-emerald-400' : ''}`}>
        {status === 'done' ? 'Done' : formatClock(segRemaining)}
      </p>
      <p className="max-w-md text-zinc-400">{current.cue}</p>
      {next && status !== 'done' && (
        <p className="text-sm text-zinc-500">Next: {next.name}</p>
      )}
      <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full bg-emerald-500 transition-[width]"
          style={{ width: `${(elapsedSec / totalSeconds) * 100}%` }}
        />
      </div>
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
