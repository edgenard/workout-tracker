import type {
  CleanPressState,
  MovementId,
  ProgressionState,
  PulloverState,
  SplitSquatState,
  SquatState,
  SwingState,
  TguState,
} from './types'

export const LIMITS = {
  emomMinMinutes: 10,
  emomMaxMinutes: 20,
  /** "usually around 15–20 reps per minute" — switch swing style here */
  swingMaxReps: 15,
  /** Squat volume cap before switching to single-arm front rack */
  squatMaxReps: 12,
  maxLadders: 5,
  maxLadderTop: 5,
  pulloverSets: 3,
  pulloverMinReps: 10,
  pulloverMaxReps: 15,
  splitSquatSets: 5,
  splitSquatReps: 5,
}

/** ATG split squat depth-then-load progression, shallowest to hardest */
export const SPLIT_SQUAT_LEVELS = [
  'front foot on a chair, bodyweight',
  'front foot on a low box, bodyweight',
  'front foot on a plate/step, bodyweight',
  'front foot flat on the floor, bodyweight',
  'floor, kettlebell in goblet position',
]

export const DEFAULT_PROGRESSION: ProgressionState = {
  swing: { style: 'two-hand', repsPerMinute: 10, minutes: 10 },
  tgu: { minutes: 10, pauses: false, successStreak: 0 },
  pullover: { reps: 10 },
  cleanPress: { ladderTop: 3, ladders: 3 },
  squat: { style: 'goblet', repsPerMinute: 6, minutes: 10 },
  splitSquat: { level: 0, successStreak: 0 },
  goodMorning: { loaded: false },
}

export const MOVEMENT_NAMES: Record<MovementId, string> = {
  swing: 'Kettlebell Swing',
  tgu: 'Turkish Get-Up',
  pullover: 'Floor Pullovers',
  cleanPress: 'Clean & Press',
  squat: 'Squat',
  splitSquat: 'ATG Split Squat',
}

function ladderReps(top: number): number {
  return (top * (top + 1)) / 2
}

export function swingTarget(s: SwingState): string {
  const style = s.style === 'two-hand' ? 'Two-Hand' : 'Single-Arm'
  return `${style} Swings — ${s.repsPerMinute} reps EMOM × ${s.minutes} min (${
    s.repsPerMinute * s.minutes
  } total)`
}

export function tguTarget(t: TguState): string {
  const pauses = t.pauses ? ' with 3-sec pauses at every transition' : ''
  return `Alternating TGU — 1 rep/min × ${t.minutes} min (${t.minutes / 2} per side)${pauses}`
}

export function cleanPressTarget(c: CleanPressState): string {
  const shape = Array.from({ length: c.ladderTop }, (_, i) => c.ladderTop - i).join('-')
  return `Clean & Press — ${shape} ladder × ${c.ladders} (${
    ladderReps(c.ladderTop) * c.ladders
  } reps per arm)`
}

export function pulloverTarget(p: PulloverState): string {
  return `Floor Pullovers — ${LIMITS.pulloverSets} sets × ${p.reps} reps`
}

export function splitSquatTarget(s: SplitSquatState): string {
  return `ATG Split Squats — ${LIMITS.splitSquatSets} sets × ${LIMITS.splitSquatReps} per leg, ${
    SPLIT_SQUAT_LEVELS[s.level]
  }`
}

export function squatTarget(s: SquatState): string {
  const style = s.style === 'goblet' ? 'Goblet' : 'Single-Arm Front Rack'
  return `${style} Squats — ${s.repsPerMinute} reps EMOM × ${s.minutes} min (${
    s.repsPerMinute * s.minutes
  } total)`
}

export function movementTarget(p: ProgressionState, m: MovementId): string {
  switch (m) {
    case 'swing':
      return swingTarget(p.swing)
    case 'tgu':
      return tguTarget(p.tgu)
    case 'pullover':
      return pulloverTarget(p.pullover)
    case 'cleanPress':
      return cleanPressTarget(p.cleanPress)
    case 'squat':
      return squatTarget(p.squat)
    case 'splitSquat':
      return splitSquatTarget(p.splitSquat)
  }
}

/** What happens next if the goal is hit — shown so you know what you're working toward */
export function nextStepHint(p: ProgressionState, m: MovementId): string {
  switch (m) {
    case 'swing': {
      const s = p.swing
      if (s.minutes < LIMITS.emomMaxMinutes) return `Next: add 1 minute (${s.minutes + 1} min)`
      if (s.repsPerMinute < LIMITS.swingMaxReps)
        return `Next: back to 10 min at ${s.repsPerMinute + 1} reps/min`
      if (s.style === 'two-hand') return 'Next: switch to Single-Arm Swings, restart at 10×10'
      return 'Cycle complete — time for a heavier bell'
    }
    case 'tgu': {
      const t = p.tgu
      const need = 2 - t.successStreak
      const wait = need > 1 ? ` (after ${need} more hits — TGU progresses weekly)` : ''
      if (t.minutes < LIMITS.emomMaxMinutes) return `Next: add 2 minutes (${t.minutes + 2} min)${wait}`
      if (!t.pauses) return `Next: add 3-second pauses at every transition${wait}`
      return 'Cycle complete — time for a heavier bell'
    }
    case 'pullover': {
      const r = p.pullover.reps
      if (r < LIMITS.pulloverMaxReps) return `Next: add 1 rep per set (3 × ${r + 1})`
      return 'At 3 × 15 — deepen the stretch and slow the tempo'
    }
    case 'splitSquat': {
      const s = p.splitSquat
      if (s.level >= SPLIT_SQUAT_LEVELS.length - 1)
        return 'Full depth, loaded — armor complete, keep it strong'
      const need = 2 - s.successStreak
      const wait = need > 1 ? ` (after ${need} more hits — lower the elevation over weeks)` : ''
      const next = SPLIT_SQUAT_LEVELS[s.level + 1]
      const gate =
        s.level === SPLIT_SQUAT_LEVELS.length - 2
          ? ' Only load once the full range is pain-free.'
          : ''
      return `Next: ${next}${wait}.${gate}`
    }
    case 'cleanPress': {
      const c = p.cleanPress
      if (c.ladders < LIMITS.maxLadders) return `Next: add 1 ladder (${c.ladders + 1} ladders)`
      if (c.ladderTop < LIMITS.maxLadderTop) {
        const shape = Array.from({ length: c.ladderTop + 1 }, (_, i) => c.ladderTop + 1 - i).join('-')
        return `Next: back to 3 ladders of ${shape}`
      }
      return 'Cycle complete — time for a heavier bell'
    }
    case 'squat': {
      const s = p.squat
      if (s.minutes < LIMITS.emomMaxMinutes) return `Next: add 1 minute (${s.minutes + 1} min)`
      if (s.repsPerMinute < LIMITS.squatMaxReps)
        return `Next: back to 10 min at ${s.repsPerMinute + 1} reps/min`
      if (s.style === 'goblet') return 'Next: switch to Single-Arm Front Rack Squats, restart at 6×10'
      return 'Cycle complete — time for a heavier bell'
    }
  }
}

export function advanceSwing(s: SwingState, hit: boolean): SwingState {
  if (!hit) return s
  if (s.minutes < LIMITS.emomMaxMinutes) return { ...s, minutes: s.minutes + 1 }
  if (s.repsPerMinute < LIMITS.swingMaxReps)
    return { ...s, minutes: LIMITS.emomMinMinutes, repsPerMinute: s.repsPerMinute + 1 }
  if (s.style === 'two-hand')
    return { style: 'single-arm', repsPerMinute: 10, minutes: LIMITS.emomMinMinutes }
  return s
}

export function advanceTgu(t: TguState, hit: boolean): TguState {
  if (!hit) return { ...t, successStreak: 0 }
  const streak = t.successStreak + 1
  if (streak < 2) return { ...t, successStreak: streak }
  if (t.minutes < LIMITS.emomMaxMinutes)
    return { ...t, minutes: t.minutes + 2, successStreak: 0 }
  if (!t.pauses) return { ...t, pauses: true, successStreak: 0 }
  return { ...t, successStreak: 0 }
}

export function advancePullover(p: PulloverState, hit: boolean): PulloverState {
  if (!hit) return p
  if (p.reps < LIMITS.pulloverMaxReps) return { reps: p.reps + 1 }
  return p
}

export function advanceSplitSquat(s: SplitSquatState, hit: boolean): SplitSquatState {
  if (!hit) return { ...s, successStreak: 0 }
  const streak = s.successStreak + 1
  if (streak < 2) return { ...s, successStreak: streak }
  if (s.level < SPLIT_SQUAT_LEVELS.length - 1) return { level: s.level + 1, successStreak: 0 }
  return { ...s, successStreak: 0 }
}

export function advanceCleanPress(c: CleanPressState, hit: boolean): CleanPressState {
  if (!hit) return c
  if (c.ladders < LIMITS.maxLadders) return { ...c, ladders: c.ladders + 1 }
  if (c.ladderTop < LIMITS.maxLadderTop) return { ladderTop: c.ladderTop + 1, ladders: 3 }
  return c
}

export function advanceSquat(s: SquatState, hit: boolean): SquatState {
  if (!hit) return s
  if (s.minutes < LIMITS.emomMaxMinutes) return { ...s, minutes: s.minutes + 1 }
  if (s.repsPerMinute < LIMITS.squatMaxReps)
    return { ...s, minutes: LIMITS.emomMinMinutes, repsPerMinute: s.repsPerMinute + 1 }
  if (s.style === 'goblet')
    return { style: 'front-rack', repsPerMinute: 6, minutes: LIMITS.emomMinMinutes }
  return s
}

export function applyResults(
  p: ProgressionState,
  results: Partial<Record<MovementId, boolean>>,
): ProgressionState {
  const next = { ...p }
  if (results.swing !== undefined) next.swing = advanceSwing(p.swing, results.swing)
  if (results.tgu !== undefined) next.tgu = advanceTgu(p.tgu, results.tgu)
  if (results.pullover !== undefined)
    next.pullover = advancePullover(p.pullover, results.pullover)
  if (results.cleanPress !== undefined)
    next.cleanPress = advanceCleanPress(p.cleanPress, results.cleanPress)
  if (results.squat !== undefined) next.squat = advanceSquat(p.squat, results.squat)
  if (results.splitSquat !== undefined)
    next.splitSquat = advanceSplitSquat(p.splitSquat, results.splitSquat)
  return next
}

/** Rungs for the clean & press ladder tracker, in order */
export function ladderRungs(c: CleanPressState): Array<{ ladder: number; reps: number }> {
  const rungs: Array<{ ladder: number; reps: number }> = []
  for (let l = 1; l <= c.ladders; l++) {
    for (let r = c.ladderTop; r >= 1; r--) {
      rungs.push({ ladder: l, reps: r })
    }
  }
  return rungs
}
