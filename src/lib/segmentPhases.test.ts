import { describe, expect, it } from 'vitest'
import { buildItemPhases, buildSegmentSwitchPoints, phaseAtElapsedSeconds } from './segmentPhases'
import type { WorkoutItem } from './types'

const movement = { id: 'test', name: 'Test', description: 'Test movement' }
const items: Array<WorkoutItem> = [
  { exercise: movement, currentPhase: { kind: 'timed', variant: 'standard', duration: 10, cues: [] } },
  { kind: 'transition', seconds: 5 },
  { exercise: movement, currentPhase: { kind: 'timed', variant: 'standard', duration: 20, cues: [8] } },
  { kind: 'transition', seconds: 7 },
  { exercise: movement, currentPhase: { kind: 'timed', variant: 'standard', duration: 30, cues: [6, 18] } },
]

describe('buildItemPhases', () => {
  it('uses authored work and transition durations', () => {
    expect(buildItemPhases(items)).toEqual([
      { kind: 'work', itemIndex: 0, seconds: 10, startsAt: 0 },
      { kind: 'transition', itemIndex: 1, nextItemIndex: 2, seconds: 5, startsAt: 10 },
      { kind: 'work', itemIndex: 2, seconds: 20, startsAt: 15 },
      { kind: 'transition', itemIndex: 3, nextItemIndex: 4, seconds: 7, startsAt: 35 },
      { kind: 'work', itemIndex: 4, seconds: 30, startsAt: 42 },
    ])
  })
})

describe('phaseAtElapsedSeconds', () => {
  it('finds the phase and clamps to the final phase', () => {
    const phases = buildItemPhases(items)
    expect(phaseAtElapsedSeconds(phases, 10)).toEqual(phases[1])
    expect(phaseAtElapsedSeconds(phases, 72)).toEqual(phases[4])
  })
})

describe('buildSegmentSwitchPoints', () => {
  it('keeps cues relative to work starts', () => {
    const phases = buildItemPhases(items)
    expect(buildSegmentSwitchPoints(items, phases)).toEqual([23, 48, 60])
  })
})
