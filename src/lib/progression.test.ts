import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PROGRESSION,
  SPLIT_SQUAT_LEVELS,
  advanceCleanPress,
  advancePullover,
  advanceSplitSquat,
  advanceSquat,
  advanceSwing,
  advanceTgu,
  applyResults,
  ladderRungs,
  movementReps,
  movementUsesBell,
} from './progression'
import { convertWeight, entryVolume } from './volume'
import type { WorkoutLogEntry } from './types'

describe('swing progression', () => {
  it('adds a minute per successful workout up to 20', () => {
    const next = advanceSwing({ style: 'two-hand', repsPerMinute: 10, minutes: 10 }, true)
    expect(next.minutes).toBe(11)
    expect(next.repsPerMinute).toBe(10)
  })

  it('holds on a miss', () => {
    const s = { style: 'two-hand' as const, repsPerMinute: 10, minutes: 14 }
    expect(advanceSwing(s, false)).toEqual(s)
  })

  it('at 20 min drops to 10 and adds a rep (density phase)', () => {
    const next = advanceSwing({ style: 'two-hand', repsPerMinute: 10, minutes: 20 }, true)
    expect(next).toEqual({ style: 'two-hand', repsPerMinute: 11, minutes: 10 })
  })

  it('at 20 min and max reps switches to single-arm and restarts', () => {
    const next = advanceSwing({ style: 'two-hand', repsPerMinute: 15, minutes: 20 }, true)
    expect(next).toEqual({ style: 'single-arm', repsPerMinute: 10, minutes: 10 })
  })

  it('single-arm at ceiling holds (heavier bell time)', () => {
    const s = { style: 'single-arm' as const, repsPerMinute: 15, minutes: 20 }
    expect(advanceSwing(s, true)).toEqual(s)
  })
})

describe('tgu progression (weekly: two consecutive hits)', () => {
  it('first hit only builds the streak', () => {
    const next = advanceTgu({ minutes: 10, pauses: false, successStreak: 0 }, true)
    expect(next).toEqual({ minutes: 10, pauses: false, successStreak: 1 })
  })

  it('second consecutive hit adds 2 minutes and resets streak', () => {
    const next = advanceTgu({ minutes: 10, pauses: false, successStreak: 1 }, true)
    expect(next).toEqual({ minutes: 12, pauses: false, successStreak: 0 })
  })

  it('a miss resets the streak without losing minutes', () => {
    const next = advanceTgu({ minutes: 14, pauses: false, successStreak: 1 }, false)
    expect(next).toEqual({ minutes: 14, pauses: false, successStreak: 0 })
  })

  it('at 20 min the next progression is adding transition pauses', () => {
    const next = advanceTgu({ minutes: 20, pauses: false, successStreak: 1 }, true)
    expect(next).toEqual({ minutes: 20, pauses: true, successStreak: 0 })
  })
})

describe('clean & press progression', () => {
  it('adds a ladder per successful workout up to 5', () => {
    expect(advanceCleanPress({ ladderTop: 3, ladders: 3 }, true)).toEqual({
      ladderTop: 3,
      ladders: 4,
    })
  })

  it('at 5 ladders grows the ladder and drops back to 3', () => {
    expect(advanceCleanPress({ ladderTop: 3, ladders: 5 }, true)).toEqual({
      ladderTop: 4,
      ladders: 3,
    })
  })

  it('caps at 5 ladders of 5-4-3-2-1', () => {
    const s = { ladderTop: 5, ladders: 5 }
    expect(advanceCleanPress(s, true)).toEqual(s)
  })

  it('generates reverse-ladder rungs in order', () => {
    expect(ladderRungs({ ladderTop: 3, ladders: 2 })).toEqual([
      { ladder: 1, reps: 3 },
      { ladder: 1, reps: 2 },
      { ladder: 1, reps: 1 },
      { ladder: 2, reps: 3 },
      { ladder: 2, reps: 2 },
      { ladder: 2, reps: 1 },
    ])
  })
})

describe('squat progression', () => {
  it('adds a minute per successful workout', () => {
    expect(advanceSquat({ style: 'goblet', repsPerMinute: 6, minutes: 10 }, true).minutes).toBe(11)
  })

  it('at cap switches goblet → single-arm front rack and restarts', () => {
    expect(advanceSquat({ style: 'goblet', repsPerMinute: 12, minutes: 20 }, true)).toEqual({
      style: 'front-rack',
      repsPerMinute: 6,
      minutes: 10,
    })
  })
})

describe('floor pullover progression (ATG shoulder armor)', () => {
  it('adds a rep per successful workout up to 15', () => {
    expect(advancePullover({ reps: 10 }, true)).toEqual({ reps: 11 })
  })

  it('holds at 15 and on misses', () => {
    expect(advancePullover({ reps: 15 }, true)).toEqual({ reps: 15 })
    expect(advancePullover({ reps: 12 }, false)).toEqual({ reps: 12 })
  })
})

describe('atg split squat progression (depth over weeks, then load)', () => {
  it('first hit only builds the streak', () => {
    expect(advanceSplitSquat({ level: 0, successStreak: 0 }, true)).toEqual({
      level: 0,
      successStreak: 1,
    })
  })

  it('two consecutive hits lower the elevation one stage', () => {
    expect(advanceSplitSquat({ level: 0, successStreak: 1 }, true)).toEqual({
      level: 1,
      successStreak: 0,
    })
  })

  it('a miss resets the streak without losing the stage', () => {
    expect(advanceSplitSquat({ level: 2, successStreak: 1 }, false)).toEqual({
      level: 2,
      successStreak: 0,
    })
  })

  it('caps at the loaded floor stage', () => {
    const top = SPLIT_SQUAT_LEVELS.length - 1
    expect(advanceSplitSquat({ level: top, successStreak: 1 }, true)).toEqual({
      level: top,
      successStreak: 0,
    })
  })
})

describe('movement reps and bell usage (for volume tracking)', () => {
  it('computes total reps per movement from the current target', () => {
    expect(movementReps(DEFAULT_PROGRESSION, 'swing')).toBe(100) // 10 × 10
    expect(movementReps(DEFAULT_PROGRESSION, 'tgu')).toBe(10) // 1/min × 10
    expect(movementReps(DEFAULT_PROGRESSION, 'pullover')).toBe(30) // 3 × 10
    expect(movementReps(DEFAULT_PROGRESSION, 'cleanPress')).toBe(36) // (3+2+1) × 3 × 2 arms
    expect(movementReps(DEFAULT_PROGRESSION, 'squat')).toBe(60) // 6 × 10
    expect(movementReps(DEFAULT_PROGRESSION, 'splitSquat')).toBe(50) // 5 × 5 × 2 legs
  })

  it('split squat only uses the bell at the loaded stage', () => {
    expect(movementUsesBell(DEFAULT_PROGRESSION, 'splitSquat')).toBe(false)
    const loaded = {
      ...DEFAULT_PROGRESSION,
      splitSquat: { level: 4, successStreak: 0 },
    }
    expect(movementUsesBell(loaded, 'splitSquat')).toBe(true)
    expect(movementUsesBell(DEFAULT_PROGRESSION, 'swing')).toBe(true)
  })
})

describe('volume', () => {
  it('converts between kg and lb', () => {
    expect(convertWeight(16, 'kg', 'lb')).toBeCloseTo(35.27, 1)
    expect(convertWeight(35, 'lb', 'kg')).toBeCloseTo(15.88, 1)
    expect(convertWeight(16, 'kg', 'kg')).toBe(16)
  })

  it('sums reps × weight across a workout in the display unit', () => {
    const entry: WorkoutLogEntry = {
      id: 'x',
      date: '2026-07-06T10:00:00Z',
      day: 'a',
      results: [
        { movement: 'swing', target: '', hit: true, reps: 100, weight: 16, unit: 'kg' },
        { movement: 'tgu', target: '', hit: true, reps: 10, weight: 16, unit: 'kg' },
        { movement: 'pullover', target: '', hit: false, reps: 30, weight: 16, unit: 'kg' },
      ],
    }
    expect(entryVolume(entry, 'kg')).toBe(140 * 16)
  })

  it('returns null for legacy entries without weight data', () => {
    const entry: WorkoutLogEntry = {
      id: 'x',
      date: '2026-07-06T10:00:00Z',
      day: 'a',
      results: [{ movement: 'swing', target: '', hit: true }],
    }
    expect(entryVolume(entry, 'kg')).toBeNull()
  })

  it('counts bodyweight-stage movements as zero, not missing', () => {
    const entry: WorkoutLogEntry = {
      id: 'x',
      date: '2026-07-06T10:00:00Z',
      day: 'b',
      results: [
        { movement: 'squat', target: '', hit: true, reps: 60, weight: 16, unit: 'kg' },
        { movement: 'splitSquat', target: '', hit: true, reps: 50, weight: 0, unit: 'kg' },
      ],
    }
    expect(entryVolume(entry, 'kg')).toBe(960)
  })
})

describe('applyResults', () => {
  it('only advances movements that were logged', () => {
    const next = applyResults(DEFAULT_PROGRESSION, { swing: true })
    expect(next.swing.minutes).toBe(11)
    expect(next.tgu).toEqual(DEFAULT_PROGRESSION.tgu)
    expect(next.squat).toEqual(DEFAULT_PROGRESSION.squat)
  })

  it('applies hits and misses independently', () => {
    const next = applyResults(DEFAULT_PROGRESSION, { cleanPress: true, squat: false })
    expect(next.cleanPress.ladders).toBe(4)
    expect(next.squat).toEqual(DEFAULT_PROGRESSION.squat)
  })

  it('handles the ATG movements', () => {
    const next = applyResults(DEFAULT_PROGRESSION, { pullover: true, splitSquat: true })
    expect(next.pullover.reps).toBe(11)
    expect(next.splitSquat).toEqual({ level: 0, successStreak: 1 })
  })
})
