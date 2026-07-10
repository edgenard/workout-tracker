import type { Emom, ExerciseTrainingPlan, Ladder, RepsAndSets, TrainingFormat, Transition, WorkoutItem } from './types'

function ladderSequence(phase: Ladder): Array<number> {
  const asc = Array.from({ length: phase.ladderTop }, (_, i) => i + 1)
  return phase.direction === 'down' ? [...asc].reverse() : asc
}

export function ladderRungs(phase: Ladder): Array<{ ladder: number; reps: number }> {
  const sequence = ladderSequence(phase)
  const rungs: Array<{ ladder: number; reps: number }> = []
  for (let ladder = 1; ladder <= phase.ladders; ladder++) {
    for (const reps of sequence) rungs.push({ ladder, reps })
  }
  return rungs
}

export function targetReps(phase: TrainingFormat): number {
  const raw = (() => {
    switch (phase.kind) {
      case 'repsAndSets': return phase.reps * phase.sets
      case 'emom': return phase.targetReps * phase.duration
      case 'ladder': return ladderRungs(phase).reduce((sum, rung) => sum + rung.reps, 0)
      case 'timed': return 0
    }
  })()
  return phase.perSide ? raw * 2 : raw
}

export function formatTarget(movementName: string, phase: TrainingFormat): string {
  const prefix = phase.variant !== 'standard' ? `${phase.variant} ` : ''
  switch (phase.kind) {
    case 'repsAndSets': return `${prefix}${movementName} — ${phase.sets} sets × ${phase.reps} reps${phase.perSide ? ' per side' : ''}`
    case 'emom': return `${prefix}${movementName} — ${phase.targetReps} reps EMOM × ${phase.duration} min (${targetReps(phase)} total)`
    case 'ladder': return `${prefix}${movementName} — ${ladderSequence(phase).join('-')} ladder × ${phase.ladders}${phase.perSide ? ' per side' : ''} (${targetReps(phase)} total)`
    case 'timed': return `${prefix}${movementName} — ${phase.duration}s`
  }
}

export function emomRepsDone(phase: Emom, completedMs: number): number {
  const raw = Math.min(phase.duration, Math.floor(completedMs / 60_000)) * phase.targetReps
  return phase.perSide ? raw * 2 : raw
}

export function repsAndSetsRepsDone(phase: RepsAndSets, completedSets: number): number {
  const raw = completedSets * phase.reps
  return phase.perSide ? raw * 2 : raw
}

export function ladderRepsDone(phase: Ladder, completedRungs: number): number {
  const raw = ladderRungs(phase).slice(0, completedRungs).reduce((sum, rung) => sum + rung.reps, 0)
  return phase.perSide ? raw * 2 : raw
}

export interface TimedRunChunk { kind: 'timedRun'; items: Array<WorkoutItem> }
export interface SelfPacedChunk {
  kind: 'selfPaced'
  plan: ExerciseTrainingPlan<Emom | RepsAndSets | Ladder>
  upNext?: Transition
}
export type PlaybackChunk = TimedRunChunk | SelfPacedChunk

export function chunkWorkoutItems(items: Array<WorkoutItem>): Array<PlaybackChunk> {
  const chunks: Array<PlaybackChunk> = []
  let run: Array<WorkoutItem> = []
  const flushRun = () => {
    if (run.length > 0) chunks.push({ kind: 'timedRun', items: run })
    run = []
  }
  for (const item of items) {
    const selfPaced = 'currentPhase' in item && item.currentPhase.kind !== 'timed'
    if (!selfPaced) {
      run.push(item)
      continue
    }
    const last = run.at(-1)
    const upNext = last && !('currentPhase' in last) ? (run.pop() as Transition) : undefined
    flushRun()
    chunks.push({ kind: 'selfPaced', plan: item as ExerciseTrainingPlan<Emom | RepsAndSets | Ladder>, upNext })
  }
  flushRun()
  return chunks
}
