import type { DayId } from './types'

export const DAY_INFO: Record<DayId, { title: string; subtitle: string }> = {
  a: { title: 'Day A', subtitle: 'Hinge, Stability & Shoulders' },
  b: { title: 'Day B', subtitle: 'Push/Pull, Quads & Knees' },
  recovery: { title: 'Active Recovery', subtitle: 'Warm-up and cool-down sequences only' },
}

export function suggestedDay(weekday: number): DayId | 'rest' {
  switch (weekday) {
    case 1:
    case 4:
      return 'a'
    case 2:
    case 5:
      return 'b'
    case 3:
      return 'recovery'
    default:
      return 'rest'
  }
}
