import { describe, expect, it } from 'vitest'
import { entryVolume, progressValue, recordedLoad } from './volume'
import type { MovementResult, WorkoutLogEntry } from './types'

const bodyweightSplitSquat: MovementResult = {
  movement: 'splitSquat',
  target: 'bodyweight split squat',
  hit: true,
  repsDone: 50,
  weight: 0,
}

const weightedSplitSquat: MovementResult = {
  movement: 'splitSquat',
  target: 'weighted split squat',
  hit: true,
  repsDone: 30,
  weight: 16,
  unit: 'kg',
}

describe('progress tracking', () => {
  it('uses reps for bodyweight work and records missing equipment as bodyweight', () => {
    expect(recordedLoad(undefined)).toEqual({ weight: 0, unit: undefined })
    expect(progressValue(bodyweightSplitSquat, 'kg')).toMatchObject({
      kind: 'bodyweight',
      value: 50,
    })
  })

  it('keeps bodyweight and weighted split squats on separate charts', () => {
    expect(progressValue(bodyweightSplitSquat, 'kg')?.key).toBe('splitSquat:bodyweight')
    expect(progressValue(weightedSplitSquat, 'kg')?.key).toBe('splitSquat:weighted')
  })

  it('combines bodyweight reps and weighted volume in overall output', () => {
    const entry: WorkoutLogEntry = {
      id: 'workout',
      date: '2026-07-10T12:00:00.000Z',
      day: 'b',
      results: [bodyweightSplitSquat, weightedSplitSquat],
    }
    expect(entryVolume(entry, 'kg')).toBe(530)
  })
})
