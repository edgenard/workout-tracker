import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { EmomTimer } from '#/components/EmomTimer'
import { LadderTracker } from '#/components/LadderTracker'
import { RepsCheck } from '#/components/RepsCheck'
import { SetTracker } from '#/components/SetTracker'
import { TimedRun } from '#/components/TimedRun'
import { TransitionBeat } from '#/components/TransitionBeat'
import { DAY_INFO } from '#/lib/plan'
import { chunkWorkoutItems, emomRepsDone, formatTarget, ladderRepsDone, ladderRungs, repsAndSetsRepsDone, targetReps } from '#/lib/planText'
import { saveWorkout, workoutsStore } from '#/lib/store'
import type { DayId, Emom, ExerciseTrainingPlan, Ladder, RepsAndSets, Workout, WorkoutItem } from '#/lib/types'
import type { LoggedResult } from '#/lib/store'
import type { PlaybackChunk } from '#/lib/planText'

export const Route = createFileRoute('/session/$day')({ component: SessionPage, ssr: false })

type SectionLabel = 'Warm-up' | 'Core Workout' | 'Cool-down'

function sectionChunks(workout: Workout): Array<{ section: SectionLabel; chunk: PlaybackChunk }> {
  const sections: Array<[SectionLabel, Array<WorkoutItem>]> = [
    ['Warm-up', workout.warmup ?? []],
    ['Core Workout', workout.coreWorkout],
    ['Cool-down', workout.cooldown ?? []],
  ]
  return sections.flatMap(([section, items]) => chunkWorkoutItems(items).map((chunk) => ({ section, chunk })))
}

type Step = { kind: 'chunk'; section: SectionLabel; chunk: PlaybackChunk } | { kind: 'save' }

function stepTitle(step: Step): string {
  if (step.kind === 'save') return 'Finish'
  return step.chunk.kind === 'timedRun' ? step.section : step.chunk.plan.exercise.name
}

function SessionPage() {
  const { day } = Route.useParams()
  if (day !== 'a' && day !== 'b' && day !== 'recovery') {
    return <div className="py-12 text-center"><p className="text-xl font-bold">Unknown session “{day}”</p><Link to="/" className="mt-4 inline-block text-emerald-400 underline">Back to today</Link></div>
  }
  return <Session key={day} day={day} />
}

function Session({ day }: { day: DayId }) {
  const navigate = useNavigate()
  const workouts = useStore(workoutsStore)
  const steps: Array<Step> = [
    ...sectionChunks(workouts[day]).map(({ section, chunk }) => ({ kind: 'chunk' as const, section, chunk })),
    { kind: 'save' },
  ]
  const [stepIdx, setStepIdx] = useState(0)
  const [results, setResults] = useState<Record<string, LoggedResult>>({})
  const [timerDone, setTimerDone] = useState<Record<number, boolean>>({})
  const [saved, setSaved] = useState(false)
  const step = steps[stepIdx]!
  const markTimerDone = () => setTimerDone((done) => ({ ...done, [stepIdx]: true }))
  const canAdvance = (() => {
    if (step.kind === 'save') return false
    if (step.chunk.kind === 'selfPaced' && step.section === 'Core Workout') {
      return results[step.chunk.plan.exercise.id] !== undefined
    }
    return true
  })()

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">{DAY_INFO[day].title} — {DAY_INFO[day].subtitle}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {steps.map((item, index) => <span key={index} className={`rounded-full px-3 py-1 text-sm font-semibold ${index === stepIdx ? 'bg-emerald-500 text-zinc-950' : index < stepIdx ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>{stepTitle(item)}</span>)}
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        {step.kind === 'chunk' && step.chunk.kind === 'timedRun' && <TimedRun key={stepIdx} items={step.chunk.items} onDone={markTimerDone} />}
        {step.kind === 'chunk' && step.chunk.kind === 'selfPaced' && (() => {
          const chunk = step.chunk
          return <SelfPacedStep
            key={`${stepIdx}-${chunk.plan.exercise.id}`}
            plan={chunk.plan}
            logged={step.section === 'Core Workout'}
            transitionSeconds={chunk.upNext?.seconds}
            result={results[chunk.plan.exercise.id]?.repsDone}
            timerDone={!!timerDone[stepIdx]}
            onTimerDone={markTimerDone}
            onResult={(repsDone) => setResults((current) => ({ ...current, [chunk.plan.exercise.id]: { movementId: chunk.plan.exercise.id, movementName: chunk.plan.exercise.name, phase: chunk.plan.currentPhase, repsDone } }))}
          />
        })()}
        {step.kind === 'save' && <div className="flex flex-col items-center gap-4 py-4 text-center">
          <p className="text-2xl font-black">{day === 'recovery' ? 'Recovery done' : 'Workout complete'}</p>
          {Object.values(results).map((result) => <p key={result.movementId} className="text-zinc-300"><span className={result.repsDone >= targetReps(result.phase) ? 'text-emerald-400' : 'text-rose-400'}>{result.repsDone >= targetReps(result.phase) ? '✓' : '✗'}</span> {result.movementName}: {result.repsDone}/{targetReps(result.phase)} reps</p>)}
          {!saved ? <button type="button" className="rounded-xl bg-emerald-500 px-10 py-4 text-xl font-bold text-zinc-950 hover:bg-emerald-400" onClick={() => { saveWorkout(day, Object.values(results)); setSaved(true); void navigate({ to: '/' }) }}>Save Workout</button> : <p className="text-emerald-400">Saved!</p>}
          <p className="max-w-md text-sm text-zinc-500">Saving logs the core workout. Progression stays under your control in Settings.</p>
        </div>}
      </section>

      <footer className="flex justify-between">
        <button type="button" disabled={stepIdx === 0} className="rounded-lg border border-zinc-700 px-5 py-2 font-semibold text-zinc-400 hover:bg-zinc-800 disabled:opacity-30" onClick={() => setStepIdx((index) => Math.max(0, index - 1))}>← Back</button>
        {step.kind !== 'save' && <button type="button" disabled={!canAdvance} className="rounded-lg bg-zinc-100 px-5 py-2 font-semibold text-zinc-950 hover:bg-white disabled:opacity-30" onClick={() => setStepIdx((index) => Math.min(steps.length - 1, index + 1))}>{canAdvance ? 'Next →' : 'Record result to continue'}</button>}
      </footer>
    </div>
  )
}

function SelfPacedStep({ plan, logged, transitionSeconds, result, timerDone, onTimerDone, onResult }: {
  plan: ExerciseTrainingPlan<Emom | RepsAndSets | Ladder>
  logged: boolean
  transitionSeconds: number | undefined
  result: number | undefined
  timerDone: boolean
  onTimerDone: () => void
  onResult: (repsDone: number) => void
}) {
  const { exercise, currentPhase, nextPhase } = plan
  const [ready, setReady] = useState(!transitionSeconds || transitionSeconds <= 0)
  const goal = targetReps(currentPhase)
  const record = (repsDone: number) => { if (logged) onResult(repsDone); onTimerDone() }
  if (!ready && transitionSeconds) return <TransitionBeat seconds={transitionSeconds} nextName={exercise.name} onDone={() => setReady(true)} />
  return <div>
    <div className="text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">{exercise.name}</p>
      <p className="mt-1 text-lg font-bold">{formatTarget(exercise.name, currentPhase)}</p>
      {currentPhase.cue && <p className="text-sm text-zinc-500">{currentPhase.cue}</p>}
      {nextPhase && <p className="text-sm text-zinc-500">Next: {formatTarget(exercise.name, nextPhase)}</p>}
    </div>
    {currentPhase.kind === 'emom' && <EmomTimer totalMinutes={currentPhase.duration} repsText={`${currentPhase.targetReps} reps`} onDone={(ms) => record(emomRepsDone(currentPhase, ms))} />}
    {currentPhase.kind === 'repsAndSets' && <SetTracker sets={currentPhase.sets} repsText={`${currentPhase.reps} reps${currentPhase.perSide ? ' per side' : ''}`} onDone={(completed) => record(repsAndSetsRepsDone(currentPhase, completed))} />}
    {currentPhase.kind === 'ladder' && <LadderTracker rungs={ladderRungs(currentPhase)} onDone={(completed) => record(ladderRepsDone(currentPhase, completed))} />}
    {logged && (timerDone || result !== undefined ? <RepsCheck targetReps={goal} value={result} onChange={onResult} /> : <p className="pt-2 text-center text-sm text-zinc-500">Finish (or end) the timer to record how many reps you completed.</p>)}
  </div>
}
