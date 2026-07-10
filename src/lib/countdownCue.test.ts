import { describe, expect, it } from 'vitest'
import { countdownCueSeconds } from './countdownCue'

describe('countdownCueSeconds', () => {
  it('defaults to 10% with a three-second minimum', () => {
    expect(countdownCueSeconds(60, {})).toBe(6)
    expect(countdownCueSeconds(20, {})).toBe(3)
  })

  it('uses per-format overrides without exceeding the interval', () => {
    expect(countdownCueSeconds(60, { countdownPercent: 20, countdownMinSeconds: 5 })).toBe(12)
    expect(countdownCueSeconds(2, { countdownPercent: 10, countdownMinSeconds: 3 })).toBe(2)
  })
})
