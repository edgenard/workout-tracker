import type { TimerSegment } from './types'

export type SegmentPhase =
  | { kind: 'work'; segmentIndex: number; seconds: number; startsAt: number }
  | { kind: 'transition'; nextSegmentIndex: number; seconds: number; startsAt: number }

export function buildSegmentPhases(
  segments: Array<TimerSegment>,
  transitionSeconds: number,
): Array<SegmentPhase> {
  const phases: Array<SegmentPhase> = []
  const shouldAddTransitions = transitionSeconds > 0
  let startsAt = 0

  segments.forEach((segment, index) => {
    phases.push({ kind: 'work', segmentIndex: index, seconds: segment.seconds, startsAt })
    startsAt += segment.seconds

    if (shouldAddTransitions && index < segments.length - 1) {
      phases.push({
        kind: 'transition',
        nextSegmentIndex: index + 1,
        seconds: transitionSeconds,
        startsAt,
      })
      startsAt += transitionSeconds
    }
  })

  return phases
}

export function phaseAtElapsedSeconds(
  phases: Array<SegmentPhase>,
  elapsedSeconds: number,
): SegmentPhase {
  if (phases.length === 0) {
    throw new Error('Cannot find a segment phase in an empty phase list')
  }

  const clampedElapsed = Math.max(0, elapsedSeconds)
  const found = phases.find((phase) => clampedElapsed < phase.startsAt + phase.seconds)
  return found ?? phases[phases.length - 1]!
}

export function buildSegmentSwitchPoints(
  segments: Array<TimerSegment>,
  phases: Array<SegmentPhase>,
): Array<number> {
  const points: Array<number> = []

  for (const phase of phases) {
    if (phase.kind !== 'work') continue
    const segment = segments[phase.segmentIndex]!
    for (const switchTime of segment.switchTimes ?? []) {
      points.push(phase.startsAt + switchTime)
    }
  }

  return points
}
