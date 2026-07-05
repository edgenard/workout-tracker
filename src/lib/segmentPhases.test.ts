import { describe, expect, it } from 'vitest'
import { buildSegmentPhases, phaseAtElapsedSeconds } from './segmentPhases'
import type { TimerSegment } from './types'

const segments: Array<TimerSegment> = [
  { name: 'First', cue: 'Start here', seconds: 10 },
  { name: 'Second', cue: 'Keep going', seconds: 20 },
  { name: 'Third', cue: 'Finish strong', seconds: 30 },
]

describe('buildSegmentPhases', () => {
  it('inserts transitions between adjacent segments', () => {
    expect(buildSegmentPhases(segments, 5)).toEqual([
      { kind: 'work', segmentIndex: 0, seconds: 10, startsAt: 0 },
      { kind: 'transition', nextSegmentIndex: 1, seconds: 5, startsAt: 10 },
      { kind: 'work', segmentIndex: 1, seconds: 20, startsAt: 15 },
      { kind: 'transition', nextSegmentIndex: 2, seconds: 5, startsAt: 35 },
      { kind: 'work', segmentIndex: 2, seconds: 30, startsAt: 40 },
    ])
  })

  it('omits a transition after the final segment', () => {
    const phases = buildSegmentPhases(segments, 5)

    expect(phases.at(-1)).toEqual({ kind: 'work', segmentIndex: 2, seconds: 30, startsAt: 40 })
  })

  it('treats 0 seconds as no transition', () => {
    expect(buildSegmentPhases(segments, 0)).toEqual([
      { kind: 'work', segmentIndex: 0, seconds: 10, startsAt: 0 },
      { kind: 'work', segmentIndex: 1, seconds: 20, startsAt: 10 },
      { kind: 'work', segmentIndex: 2, seconds: 30, startsAt: 30 },
    ])
  })
})

describe('phaseAtElapsedSeconds', () => {
  it('returns the current phase at elapsed wall-clock seconds', () => {
    const phases = buildSegmentPhases(segments, 5)

    expect(phaseAtElapsedSeconds(phases, 9)).toEqual(phases[0])
    expect(phaseAtElapsedSeconds(phases, 10)).toEqual(phases[1])
    expect(phaseAtElapsedSeconds(phases, 15)).toEqual(phases[2])
  })

  it('returns the last phase when elapsed time reaches total duration', () => {
    const phases = buildSegmentPhases(segments, 5)

    expect(phaseAtElapsedSeconds(phases, 70)).toEqual(phases[4])
  })
})
