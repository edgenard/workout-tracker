import { describe, expect, it } from 'vitest'
import { niceTicks } from './chartScale'

describe('niceTicks', () => {
  it('sets the chart ceiling at or above the largest value', () => {
    for (const max of [0.1, 1, 5.25, 999, 1_166.55, 12_345]) {
      const ticks = niceTicks(max)
      expect(ticks.at(-1)).toBeGreaterThanOrEqual(max)
    }
  })

  it('includes the next tick when the previous tick is below the data', () => {
    expect(niceTicks(1_166.55)).toEqual([0, 500, 1_000, 1_500])
  })
})
