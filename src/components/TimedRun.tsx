import { useEffect, useMemo, useRef } from 'react'
import { finishBeep, minuteBeep, switchBeep, tick, unlockAudio } from '#/lib/audio'
import { buildItemPhases, buildSegmentSwitchPoints, phaseAtElapsedSeconds } from '#/lib/segmentPhases'
import { formatClock, useStopwatch, useWakeLock } from '#/lib/useStopwatch'
import type { Timed, WorkoutItem } from '#/lib/types'

const COUNTDOWN_SECONDS = 5

export function TimedRun({ items, onDone }: { items: Array<WorkoutItem>; onDone: () => void }) {
  const { status, elapsedMs, start, pause, resume, seek, finish } = useStopwatch()
  useWakeLock(status === 'running')
  const phases = useMemo(() => buildItemPhases(items), [items])
  const totalSeconds = phases.reduce((sum, phase) => sum + phase.seconds, 0)
  const elapsedSec = Math.min(elapsedMs / 1000, totalSeconds)
  const currentPhase = phaseAtElapsedSeconds(phases, elapsedSec)
  const currentIndex = currentPhase.kind === 'work' ? currentPhase.itemIndex : currentPhase.nextItemIndex
  const currentItem = items[currentIndex]
  const currentPlan = currentItem && 'currentPhase' in currentItem ? currentItem : undefined
  const currentTimed = currentPlan?.currentPhase as Timed | undefined
  const phaseRemaining = currentPhase.startsAt + currentPhase.seconds - elapsedSec
  const workPlans = items.filter((item) => 'currentPhase' in item)
  const currentWorkNumber = currentPlan ? workPlans.indexOf(currentPlan) + 1 : 0
  const switchPoints = useMemo(() => buildSegmentSwitchPoints(items, phases), [items, phases])
  const secondsIntoWork = currentPhase.kind === 'work' ? elapsedSec - currentPhase.startsAt : 0
  const switches = currentPhase.kind === 'work' ? (currentTimed?.cues ?? []) : []
  const currentPart = switches.filter((value) => secondsIntoWork >= value).length + 1
  const nextPlan = currentPhase.kind === 'work'
    ? items.slice(currentPhase.itemIndex + 1).find((item) => 'currentPhase' in item)
    : undefined

  const lastIndex = useRef(-1)
  const firedSwitches = useRef(new Set<number>())
  const lastTick = useRef('')
  const done = useRef(false)

  useEffect(() => {
    if (status !== 'running') return
    if (elapsedMs / 1000 >= totalSeconds) {
      if (!done.current) {
        done.current = true
        finishBeep()
        finish()
        onDone()
      }
      return
    }
    if (currentPhase.kind === 'work' && currentPhase.itemIndex !== lastIndex.current) {
      lastIndex.current = currentPhase.itemIndex
      minuteBeep()
    }
    const now = elapsedMs / 1000
    for (const point of switchPoints) {
      if (now >= point && !firedSwitches.current.has(point)) {
        firedSwitches.current.add(point)
        switchBeep()
      }
    }
    const boundary = currentPhase.kind === 'transition'
      ? currentPhase.startsAt + currentPhase.seconds
      : Math.min(...switchPoints.filter((point) => point > now && point < currentPhase.startsAt + currentPhase.seconds), Number.POSITIVE_INFINITY)
    const remaining = Math.ceil(boundary - now)
    if (remaining <= COUNTDOWN_SECONDS && remaining >= 1) {
      const key = `${boundary}:${remaining}`
      if (key !== lastTick.current) {
        lastTick.current = key
        tick()
      }
    }
  }, [currentPhase, elapsedMs, finish, onDone, status, switchPoints, totalSeconds])

  const endEarly = () => {
    if (done.current) return
    done.current = true
    finish()
    onDone()
  }

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-5xl font-black tabular-nums">{formatClock(totalSeconds)}</p>
        <ol className="w-full max-w-md space-y-1 text-zinc-400">
          {workPlans.map((plan) => 'currentPhase' in plan && (
            <li key={plan.exercise.id} className="flex justify-between gap-4">
              <span>{plan.exercise.name}</span>
              <span className="tabular-nums">{formatClock((plan.currentPhase as Timed).duration)}</span>
            </li>
          ))}
        </ol>
        <button type="button" className="rounded-xl bg-emerald-500 px-10 py-4 text-xl font-bold text-zinc-950 hover:bg-emerald-400" onClick={() => { unlockAudio(); start() }}>
          Start timed run
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
        {currentPhase.kind === 'transition' ? 'Get ready' : `${currentWorkNumber} of ${workPlans.length}`}
      </p>
      <p className="text-3xl font-bold text-emerald-400">
        {currentPhase.kind === 'transition' ? `Next: ${currentPlan?.exercise.name ?? 'exercise'}` : currentPlan?.exercise.name}
      </p>
      {switches.length > 0 && status !== 'done' && <p className="text-lg font-bold text-amber-400">Part {currentPart} of {switches.length + 1} — switch at the beep</p>}
      <p className={`text-7xl font-black tabular-nums ${status === 'done' ? 'text-emerald-400' : currentPhase.kind === 'transition' ? 'text-amber-400' : ''}`}>
        {status === 'done' ? 'Done' : formatClock(phaseRemaining)}
      </p>
      <p className="max-w-md text-zinc-400">{currentTimed?.cue}</p>
      {nextPlan && 'currentPhase' in nextPlan && status !== 'done' && <p className="text-sm text-zinc-500">Next: {nextPlan.exercise.name}</p>}
      <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-zinc-800"><div className="h-full bg-emerald-500 transition-[width]" style={{ width: `${totalSeconds ? (elapsedSec / totalSeconds) * 100 : 100}%` }} /></div>
      {status !== 'done' && <div className="flex gap-3">
        {status === 'running' ? <button type="button" className="rounded-lg border border-zinc-700 px-6 py-2 font-semibold hover:bg-zinc-800" onClick={pause}>Pause</button> : <button type="button" className="rounded-lg bg-emerald-500 px-6 py-2 font-semibold text-zinc-950 hover:bg-emerald-400" onClick={resume}>Resume</button>}
        {currentPhase.kind === 'transition' ? <button type="button" className="rounded-lg border border-zinc-700 px-6 py-2 font-semibold text-zinc-400 hover:bg-zinc-800" onClick={() => seek((currentPhase.startsAt + currentPhase.seconds) * 1000)}>Skip</button> : <button type="button" className="rounded-lg border border-zinc-700 px-6 py-2 font-semibold text-zinc-400 hover:bg-zinc-800" onClick={endEarly}>End early</button>}
      </div>}
    </div>
  )
}
