// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'
import { addCustomVariant, customVariantsStore, MOVEMENTS, variantOptionsFor } from './movementData'

afterEach(() => {
  customVariantsStore.setState(() => ({}))
  window.localStorage.clear()
})

describe('variantOptionsFor', () => {
  it('returns the built-in variants when nothing custom has been saved', () => {
    expect(variantOptionsFor(MOVEMENTS.swing)).toEqual(['Two-Hand', 'Single-Arm'])
  })

  it('appends saved custom variants after the built-ins', () => {
    addCustomVariant(MOVEMENTS.swing, 'Alternating')
    expect(variantOptionsFor(MOVEMENTS.swing)).toEqual(['Two-Hand', 'Single-Arm', 'Alternating'])
  })

  it('is available for movements with no built-in variants at all', () => {
    addCustomVariant(MOVEMENTS.pullover, 'Wide grip')
    expect(variantOptionsFor(MOVEMENTS.pullover)).toEqual(['Wide grip'])
  })
})

describe('addCustomVariant', () => {
  it('ignores blank input', () => {
    addCustomVariant(MOVEMENTS.swing, '   ')
    expect(variantOptionsFor(MOVEMENTS.swing)).toEqual(['Two-Hand', 'Single-Arm'])
  })

  it('does not duplicate a variant that already exists, case-insensitively', () => {
    addCustomVariant(MOVEMENTS.swing, 'two-hand')
    expect(variantOptionsFor(MOVEMENTS.swing)).toEqual(['Two-Hand', 'Single-Arm'])
  })

  it('does not add the same custom variant twice', () => {
    addCustomVariant(MOVEMENTS.swing, 'Alternating')
    addCustomVariant(MOVEMENTS.swing, 'Alternating')
    expect(variantOptionsFor(MOVEMENTS.swing)).toEqual(['Two-Hand', 'Single-Arm', 'Alternating'])
  })
})
