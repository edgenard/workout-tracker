import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { EmomTimer } from '#/components/EmomTimer'
import { LadderTracker } from '#/components/LadderTracker'
import { SegmentTimer } from '#/components/SegmentTimer'
import { SetTracker } from '#/components/SetTracker'
import { GoalCheck } from '#/components/GoalCheck'
import { DAY_INFO, WARMUP_SEGMENTS, cooldownSegments } from '#/lib/plan'
import {
  LIMITS,
  MOVEMENT_NAMES,
  ladderRungs,
  movementTarget,
  nextStepHint,
} from '#/lib/progression'
import { progressionStore, saveWorkout } from '#/lib/store'
import type { DayId, MovementId, ProgressionState } from '#/lib/types'

export const Route = createFileRoute('/session/$day')({
  component: SessionPage,
  ssr: false,
})

type Step =
  | { kind: 'warmup' }
  | { kind: 'cooldown' }
  | { kind: 'movement'; movement: MovementId }
  | { kind: 'save' }

function stepsForDay(day: DayId): Array<Step> {
  const movements: Array<MovementId> =
    day === 'a'
      ? ['swing', 'tgu', 'pullover']
      : day === 'b'
        ? ['cleanPress', 'squat', 'splitSquat']
        : []
  return [
    { kind: 'warmup' },
    ...movements.map((movement) => ({ kind: 'movement' as const, movement })),
    { kind: 'cooldown' },
    { kind: 'save' },
  ]
}

function stepTitle(step: Step): string {
  switch (step.kind) {
    case 'warmup':
      return 'Warm-up'
    case 'cooldown':
      return 'Cool-down'
    case 'movement':
      return MOVEMENT_NAMES[step.movement]
    case 'save':
      return 'Finish'
  }
}

function SessionPage() {
  const { day } = Route.useParams()
  if (day !== 'a' && day !== 'b' && day !== 'recovery') {
    return (
      <div className="py-12 text-center">
        <p className="text-xl font-bold">Unknown session “{day}”</p>
        <Link to="/" className="mt-4 inline-block text-emerald-400 underline">
          Back to today
        </Link>
      </div>
    )
  }
  return <Session key={day} day={day} />
}

function Session({ day }: { day: DayId }) {
  const navigate = useNavigate()
  const progression = useStore(progressionStore)
  const steps = stepsForDay(day)
  const [stepIdx, setStepIdx] = useState(0)
  const [results, setResults] = useState<Partial<Record<MovementId, boolean>>>({})
  const [timerDone, setTimerDone] = useState<Record<number, boolean>>({})
  const [saved, setSaved] = useState(false)

  const step = steps[stepIdx]
  const markTimerDone = () => setTimerDone((t) => ({ ...t, [stepIdx]: true }))

  const canAdvance =
    step.kind === 'movement' ? results[step.movement] !== undefined : step.kind !== 'save'

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
          {DAY_INFO[day].title} — {DAY_INFO[day].subtitle}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {steps.map((s, i) => (
            <span
              key={i}
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                i === stepIdx
                  ? 'bg-emerald-500 text-zinc-950'
                  : i < stepIdx
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {stepTitle(s)}
            </span>
          ))}
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        {step.kind === 'warmup' && (
          <SegmentTimer title="Warm-up" segments={WARMUP_SEGMENTS} onDone={markTimerDone} />
        )}
        {step.kind === 'cooldown' && (
          <SegmentTimer
            title="Cool-down"
            segments={cooldownSegments(progression.goodMorning.loaded)}
            onDone={markTimerDone}
          />
        )}
        {step.kind === 'movement' && (
          <MovementStep
            movement={step.movement}
            progression={progression}
            result={results[step.movement]}
            timerDone={!!timerDone[stepIdx]}
            onTimerDone={markTimerDone}
            onResult={(hit) => setResults((r) => ({ ...r, [step.movement]: hit }))}
          />
        )}
        {step.kind === 'save' && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <p className="text-2xl font-black">
              {day === 'recovery' ? 'Recovery done' : 'Workout complete'}
            </p>
            {(Object.entries(results) as Array<[MovementId, boolean]>).map(([m, hit]) => (
              <p key={m} className="text-zinc-300">
                <span className={hit ? 'text-emerald-400' : 'text-rose-400'}>
                  {hit ? '✓' : '✗'}
                </span>{' '}
                {MOVEMENT_NAMES[m]}: {movementTarget(progression, m)}
              </p>
            ))}
            {!saved ? (
              <button
                type="button"
                className="rounded-xl bg-emerald-500 px-10 py-4 text-xl font-bold text-zinc-950 hover:bg-emerald-400"
                onClick={() => {
                  saveWorkout(day, results)
                  setSaved(true)
                  void navigate({ to: '/' })
                }}
              >
                Save Workout
              </button>
            ) : (
              <p className="text-emerald-400">Saved!</p>
            )}
            <p className="max-w-md text-sm text-zinc-500">
              Saving logs this session and updates your targets for next time — goals you hit
              progress per the Nerd Math rules, misses hold steady.
            </p>
          </div>
        )}
      </section>

      <footer className="flex justify-between">
        <button
          type="button"
          disabled={stepIdx === 0}
          className="rounded-lg border border-zinc-700 px-5 py-2 font-semibold text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
          onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
        >
          ← Back
        </button>
        {step.kind !== 'save' && (
          <button
            type="button"
            disabled={!canAdvance}
            className="rounded-lg bg-zinc-100 px-5 py-2 font-semibold text-zinc-950 hover:bg-white disabled:opacity-30"
            onClick={() => setStepIdx((i) => Math.min(steps.length - 1, i + 1))}
          >
            {canAdvance ? 'Next →' : 'Record result to continue'}
          </button>
        )}
      </footer>
    </div>
  )
}

function MovementStep({
  movement,
  progression,
  result,
  timerDone,
  onTimerDone,
  onResult,
}: {
  movement: MovementId
  progression: ProgressionState
  result: boolean | undefined
  timerDone: boolean
  onTimerDone: () => void
  onResult: (hit: boolean) => void
}) {
  return (
    <div>
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
          {MOVEMENT_NAMES[movement]}
        </p>
        <p className="mt-1 text-lg font-bold">{movementTarget(progression, movement)}</p>
        <p className="text-sm text-zinc-500">{nextStepHint(progression, movement)}</p>
        {movement === 'tgu' && progression.tgu.pauses && (
          <p className="mt-1 text-sm font-semibold text-amber-400">
            Hold 3 seconds at every transition point.
          </p>
        )}
      </div>

      {movement === 'swing' && (
        <EmomTimer
          totalMinutes={progression.swing.minutes}
          repsText={`${progression.swing.repsPerMinute} ${
            progression.swing.style === 'single-arm' ? 'single-arm ' : ''
          }swings`}
          onDone={onTimerDone}
        />
      )}
      {movement === 'tgu' && (
        <EmomTimer
          totalMinutes={progression.tgu.minutes}
          repsText="1 get-up"
          minuteLabel={(i) => (i % 2 === 0 ? 'Left side' : 'Right side')}
          onDone={onTimerDone}
        />
      )}
      {movement === 'pullover' && (
        <SetTracker
          sets={LIMITS.pulloverSets}
          repsText={`${progression.pullover.reps} pullovers`}
          onDone={onTimerDone}
        />
      )}
      {movement === 'cleanPress' && (
        <LadderTracker rungs={ladderRungs(progression.cleanPress)} onDone={onTimerDone} />
      )}
      {movement === 'splitSquat' && (
        <SetTracker
          sets={LIMITS.splitSquatSets}
          repsText={`${LIMITS.splitSquatReps} per leg`}
          onDone={onTimerDone}
        />
      )}
      {movement === 'squat' && (
        <EmomTimer
          totalMinutes={progression.squat.minutes}
          repsText={`${progression.squat.repsPerMinute} ${
            progression.squat.style === 'goblet' ? 'goblet' : 'front-rack'
          } squats`}
          onDone={onTimerDone}
        />
      )}

      {timerDone || result !== undefined ? (
        <GoalCheck value={result} onChange={onResult} />
      ) : (
        <p className="pt-2 text-center text-sm text-zinc-500">
          Finish (or end) the timer to record whether you hit the goal.
        </p>
      )}
    </div>
  )
}
