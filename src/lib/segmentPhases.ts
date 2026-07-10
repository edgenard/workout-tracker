import type { Timed, WorkoutItem } from './types'

export type SegmentPhase =
  | { kind: 'work'; itemIndex: number; seconds: number; startsAt: number }
  | { kind: 'transition'; itemIndex: number; nextItemIndex: number; seconds: number; startsAt: number }

export function buildItemPhases(items: Array<WorkoutItem>): Array<SegmentPhase> {
  const phases: Array<SegmentPhase> = []
  let startsAt = 0
  items.forEach((item, itemIndex) => {
    if ('currentPhase' in item) {
      if (item.currentPhase.kind !== 'timed') return
      phases.push({ kind: 'work', itemIndex, seconds: item.currentPhase.duration, startsAt })
      startsAt += item.currentPhase.duration
      return
    }
    if (item.seconds <= 0) return
    const nextItemIndex = items.findIndex((candidate, index) => index > itemIndex && 'currentPhase' in candidate)
    phases.push({ kind: 'transition', itemIndex, nextItemIndex, seconds: item.seconds, startsAt })
    startsAt += item.seconds
  })
  return phases
}

export function phaseAtElapsedSeconds(phases: Array<SegmentPhase>, elapsedSeconds: number): SegmentPhase {
  if (phases.length === 0) throw new Error('Cannot find a segment phase in an empty phase list')
  const elapsed = Math.max(0, elapsedSeconds)
  return phases.find((phase) => elapsed < phase.startsAt + phase.seconds) ?? phases.at(-1)!
}

export function buildSegmentSwitchPoints(items: Array<WorkoutItem>, phases: Array<SegmentPhase>): Array<number> {
  const points: Array<number> = []
  for (const phase of phases) {
    if (phase.kind !== 'work') continue
    const item = items[phase.itemIndex]
    if (!item || !('currentPhase' in item)) continue
    for (const cue of (item.currentPhase as Timed).cues) points.push(phase.startsAt + cue)
  }
  return points
}
