import type { DayId, TimerSegment } from './types'

export const WARMUP_SEGMENTS: Array<TimerSegment> = [
  {
    name: 'Quadruped Wrist Spins',
    cue: 'On hands and knees, gently circle your shoulders over your wrists.',
    seconds: 120,
  },
  {
    name: 'Seiza Hip Extensions',
    cue: 'Kneeling, drive your hips forward to stretch the hip flexors.',
    seconds: 120,
  },
  {
    name: 'Kettlebell Halos',
    cue: 'Hold the bell upside down by the horns, trace tight circles around your head.',
    seconds: 120,
  },
  {
    name: 'Prying Goblet Squat',
    cue: 'Bell at chest, sit deep, elbows push knees out. Shift side to side.',
    seconds: 120,
  },
  {
    name: 'Bodyweight Single-Leg RDLs',
    cue: 'Hinge at the hips on one leg. Fire the hamstrings, test your balance.',
    seconds: 120,
  },
]

export const COOLDOWN_SEGMENTS: Array<TimerSegment> = [
  {
    name: 'The Sphinx',
    cue: 'On your stomach, prop up on forearms. Gently extend the lower back. Breathe through the nose.',
    seconds: 200,
  },
  {
    name: 'Staggered Fold',
    cue: 'One foot slightly forward, hinge and fold over the front leg. Switch halfway.',
    seconds: 200,
  },
  {
    name: '90/90 Hip Stretch',
    cue: 'Both legs at 90°. Lean over the front shin, then rotate to the back. Switch sides halfway.',
    seconds: 200,
  },
]

export const DAY_INFO: Record<DayId, { title: string; subtitle: string }> = {
  a: { title: 'Day A', subtitle: 'Heavy Hinge & Time Under Tension — Swings + Turkish Get-Ups' },
  b: { title: 'Day B', subtitle: 'Push/Pull Power & Heavy Squat — Clean & Press + Squats' },
  recovery: { title: 'Active Recovery', subtitle: 'Warm-up and cool-down sequences only' },
}

/** Suggested day for a JS weekday (0 = Sunday) per the Tetris schedule */
export function suggestedDay(weekday: number): DayId | 'rest' {
  switch (weekday) {
    case 1: // Monday
    case 4: // Thursday
      return 'a'
    case 2: // Tuesday
    case 5: // Friday
      return 'b'
    case 3: // Wednesday
      return 'recovery'
    default:
      return 'rest'
  }
}
