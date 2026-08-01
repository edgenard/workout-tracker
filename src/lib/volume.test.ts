import { describe, expect, it } from 'vitest'
import { entryVolume, progressMetricLabel, progressValue, recordedLoad } from './volume'
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

const bodyweightIntervalRun: MovementResult = {
  movement: 'burpees',
  target: 'bodyweight interval burpees',
  hit: true,
  repsDone: 8,
  weight: 0,
  tensionSecondsPerRep: 20,
}

const weightedIntervalRun: MovementResult = {
  movement: 'kettlebellSwing',
  target: 'weighted interval kb swing',
  hit: true,
  repsDone: 8,
  weight: 16,
  unit: 'kg',
  tensionSecondsPerRep: 20,
}

describe('progress tracking', () => {
  it('uses reps for bodyweight work and records missing equipment as bodyweight', () => {
    expect(recordedLoad(undefined)).toEqual({ weight: 0, unit: undefined })
    expect(progressValue(bodyweightSplitSquat, 'kg')).toMatchObject({
      kind: 'bodyweight',
      metric: 'reps',
      value: 50,
    })
  })

  it('tracks time under tension for interval work instead of reps', () => {
    expect(progressValue(bodyweightIntervalRun, 'kg')).toMatchObject({
      kind: 'bodyweight',
      metric: 'time',
      value: 160,
    })
    expect(progressValue(weightedIntervalRun, 'kg')).toMatchObject({
      kind: 'weighted',
      metric: 'time',
      value: 2560,
    })
    expect(progressMetricLabel('bodyweight', 'time', 'kg')).toBe('sec')
    expect(progressMetricLabel('weighted', 'time', 'kg')).toBe('kg·sec')
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
