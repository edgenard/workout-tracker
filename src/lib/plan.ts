import type { DayId, TimerSegment } from './types'

export const WARMUP_SEGMENTS: Array<TimerSegment> = [
  {
    name: 'Quadruped Wrist Spins',
    cue: 'On hands and knees, gently circle your shoulders over your wrists.',
    seconds: 60,
  },
  {
    name: 'Kettlebell Halos',
    cue: 'Hold the bell upside down by the horns, trace tight circles around your head.',
    seconds: 60,
  },
  {
    name: 'Prying Goblet Squat',
    cue: 'Bell at chest, sit deep, elbows push knees out. Shift side to side.',
    seconds: 60,
  },
  {
    name: 'Wall Tibialis Raises (ATG)',
    cue: 'Lean back against a wall, legs straight, lift your toes — 25 reps. Step further out to make it harder.',
    seconds: 60,
  },
  {
    name: 'Elephant Walks (ATG)',
    cue: 'Hinge forward, hands on shins or floor, alternate straightening each leg — 30 total reps.',
    seconds: 60,
  },
]

export function cooldownSegments(goodMorningLoaded: boolean): Array<TimerSegment> {
  return [
    {
      name: 'The Sphinx',
      cue: 'On your stomach, prop up on forearms. Gently extend the lower back. Breathe through the nose.',
      seconds: 120,
    },
    {
      name: '90/90 Hip Stretch',
      cue: 'Both legs at 90°. Lean over the front shin, then rotate to the back. Switch sides halfway.',
      seconds: 120,
    },
    goodMorningLoaded
      ? {
          name: 'Seated Good Mornings (ATG)',
          cue: 'Hug the bell to your chest. Lower back arched, hinge slowly between your legs — 3 sets of 10 controlled reps.',
          seconds: 180,
        }
      : {
          name: 'Seated Good Mornings (ATG)',
          cue: 'Sit wide-legged. Lower back perfectly arched, hinge forward slowly. Bodyweight — chase range of motion, not load.',
          seconds: 120,
        },
  ]
}

export const DAY_INFO: Record<DayId, { title: string; subtitle: string }> = {
  a: {
    title: 'Day A',
    subtitle: 'Hinge, Stability & Shoulders — Swings + Turkish Get-Ups + Floor Pullovers',
  },
  b: {
    title: 'Day B',
    subtitle: 'Push/Pull, Quads & Knees — Clean & Press + Squats + ATG Split Squats',
  },
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
