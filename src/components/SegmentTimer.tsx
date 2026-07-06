import { useEffect, useMemo, useRef } from 'react'
import { finishBeep, minuteBeep, switchBeep, tick, unlockAudio } from '#/lib/audio'
import {
  buildSegmentPhases,
  buildSegmentSwitchPoints,
  phaseAtElapsedSeconds,
} from '#/lib/segmentPhases'
import { formatClock, useStopwatch, useWakeLock } from '#/lib/useStopwatch'
import type { TimerSegment } from '#/lib/types'

interface SegmentTimerProps {
  title: string
  segments: Array<TimerSegment>
  transitionSeconds?: number
  /** Seconds before a phase/switch boundary to start the countdown beep */
  countdownSeconds?: number
  onDone: () => void
}

/** Guided interval timer for the warm-up / cool-down sequences */
export function SegmentTimer({
  title,
  segments,
  transitionSeconds = 5,
  countdownSeconds = 5,
  onDone,
}: SegmentTimerProps) {
  const { status, elapsedMs, start, pause, resume, seek, finish } = useStopwatch()
  useWakeLock(status === 'running')

  const phases = useMemo(
    () => buildSegmentPhases(segments, transitionSeconds),
    [segments, transitionSeconds],
  )
  const totalSeconds = phases.reduce((sum, phase) => sum + phase.seconds, 0)
  const elapsedSec = Math.min(elapsedMs / 1000, totalSeconds)
  const currentPhase = phaseAtElapsedSeconds(phases, elapsedSec)
  const currentIdx =
    currentPhase.kind === 'work' ? currentPhase.segmentIndex : currentPhase.nextSegmentIndex
  const current = segments[currentIdx]!
  const phaseRemaining = currentPhase.startsAt + currentPhase.seconds - elapsedSec
  const next = currentPhase.kind === 'work' ? segments[currentIdx + 1] : undefined

  // Absolute times (from timer start) of every mid-segment switch cue
  const switchPoints = useMemo(() => {
    return buildSegmentSwitchPoints(segments, phases)
  }, [phases, segments])

  // Which part of the current segment we're in (e.g. Side 1 of 2)
  const secIntoSeg = currentPhase.kind === 'work' ? elapsedSec - currentPhase.startsAt : 0
  const segSwitches = currentPhase.kind === 'work' ? (current.switchTimes ?? []) : []
  const currentPart = segSwitches.filter((t) => secIntoSeg >= t).length + 1

  const lastIdxRef = useRef(0)
  const firedSwitchesRef = useRef(new Set<number>())
  const lastTickKeyRef = useRef('')
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
    if (currentPhase.kind === 'work' && currentIdx !== lastIdxRef.current) {
      lastIdxRef.current = currentIdx
      minuteBeep()
    }
    const nowSec = elapsedMs / 1000
    for (const point of switchPoints) {
      if (nowSec >= point && !firedSwitchesRef.current.has(point)) {
        firedSwitchesRef.current.add(point)
        switchBeep()
      }
    }
    const tickBoundary =
      currentPhase.kind === 'transition'
        ? currentPhase.startsAt + currentPhase.seconds
        : Math.min(
            ...switchPoints.filter(
              (point) => point > nowSec && point < currentPhase.startsAt + currentPhase.seconds,
            ),
            Number.POSITIVE_INFINITY,
          )
    const remaining = Math.ceil(tickBoundary - nowSec)
    if (remaining <= countdownSeconds && remaining >= 1) {
      const key = `${tickBoundary}:${remaining}`
      if (key !== lastTickKeyRef.current) {
        lastTickKeyRef.current = key
        tick()
      }
    }
  }, [
    elapsedMs,
    status,
    currentIdx,
    currentPhase,
    totalSeconds,
    switchPoints,
    countdownSeconds,
    finish,
    onDone,
  ])

  const endEarly = () => {
    if (doneRef.current) return
    doneRef.current = true
    finish()
    onDone()
  }

  const skipTransition = () => {
    if (currentPhase.kind !== 'transition') return
    seek(Math.min(currentPhase.startsAt + currentPhase.seconds, totalSeconds) * 1000)
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
        {currentPhase.kind === 'transition' ? 'Get ready' : `${currentIdx + 1} of ${segments.length}`}
      </p>
      <p className="text-3xl font-bold text-emerald-400">
        {currentPhase.kind === 'transition' ? `Next: ${current.name}` : current.name}
      </p>
      {segSwitches.length > 0 && status !== 'done' && (
        <p className="text-lg font-bold text-amber-400">
          {current.switchLabel ?? 'Part'} {currentPart} of {segSwitches.length + 1} — switch at
          the beep
        </p>
      )}
      <p
        className={`text-7xl font-black tabular-nums ${
          status === 'done'
            ? 'text-emerald-400'
            : currentPhase.kind === 'transition'
              ? 'text-amber-400'
              : ''
        }`}
      >
        {status === 'done' ? 'Done' : formatClock(phaseRemaining)}
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
          {currentPhase.kind === 'transition' ? (
            <button
              type="button"
              className="rounded-lg border border-zinc-700 px-6 py-2 font-semibold text-zinc-400 hover:bg-zinc-800"
              onClick={skipTransition}
            >
              Skip
            </button>
          ) : (
            <button
              type="button"
              className="rounded-lg border border-zinc-700 px-6 py-2 font-semibold text-zinc-400 hover:bg-zinc-800"
              onClick={endEarly}
            >
              End early
            </button>
          )}
        </div>
      )}
    </div>
  )
}
