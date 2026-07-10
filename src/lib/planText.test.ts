import { describe, expect, it } from 'vitest'
import { DEFAULT_WORKOUTS } from './movementData'
import { chunkWorkoutItems, emomRepsDone, ladderRepsDone, repsAndSetsRepsDone, targetReps } from './planText'
import type { Emom, Ladder, RepsAndSets } from './types'

function phaseAt<T>(items: typeof DEFAULT_WORKOUTS.a.coreWorkout, index: number): T {
  const item = items[index]!
  if (!('currentPhase' in item)) throw new Error('Expected exercise plan')
  return item.currentPhase as T
}

const swing = phaseAt<Emom>(DEFAULT_WORKOUTS.a.coreWorkout, 0)
const tgu = phaseAt<Emom>(DEFAULT_WORKOUTS.a.coreWorkout, 2)
const pullover = phaseAt<RepsAndSets>(DEFAULT_WORKOUTS.a.coreWorkout, 4)
const cleanPress = phaseAt<Ladder>(DEFAULT_WORKOUTS.b.coreWorkout, 0)
const squat = phaseAt<Emom>(DEFAULT_WORKOUTS.b.coreWorkout, 2)
const splitSquat = phaseAt<RepsAndSets>(DEFAULT_WORKOUTS.b.coreWorkout, 4)

describe('target rep parity', () => {
  it('matches all six starting goals', () => {
    expect([swing, tgu, pullover, cleanPress, squat, splitSquat].map(targetReps)).toEqual([100, 10, 30, 36, 60, 50])
  })
})

describe('completed rep parity', () => {
  it('counts EMOM, ladder, and per-side sets', () => {
    expect(emomRepsDone(swing, 8 * 60_000)).toBe(80)
    expect(ladderRepsDone(cleanPress, 2)).toBe(10)
    expect(repsAndSetsRepsDone(splitSquat, 3)).toBe(30)
  })
})

describe('chunkWorkoutItems', () => {
  it('keeps timed runs together and attaches transitions to self-paced steps', () => {
    const chunks = chunkWorkoutItems(DEFAULT_WORKOUTS.a.coreWorkout)
    expect(chunks).toHaveLength(3)
    expect(chunks.map((chunk) => chunk.kind)).toEqual(['selfPaced', 'selfPaced', 'selfPaced'])
    expect(chunks.slice(1).every((chunk) => chunk.kind === 'selfPaced' && chunk.upNext?.seconds === 5)).toBe(true)
  })

  it('does not merge recovery warm-up and cool-down sections', () => {
    expect(chunkWorkoutItems(DEFAULT_WORKOUTS.recovery.warmup ?? [])).toHaveLength(1)
    expect(chunkWorkoutItems(DEFAULT_WORKOUTS.recovery.cooldown ?? [])).toHaveLength(1)
  })
})
