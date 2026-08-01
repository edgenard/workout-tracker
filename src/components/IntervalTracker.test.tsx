// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IntervalTracker } from './IntervalTracker'

vi.mock('#/lib/audio', () => ({
  finishBeep: vi.fn(),
  switchBeep: vi.fn(),
  tick: vi.fn(),
  unlockAudio: vi.fn(),
}))

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('IntervalTracker', () => {
  it('alternates work and rest, then finishes on the last work interval', () => {
    const onDone = vi.fn()
    render(<IntervalTracker workSeconds={20} restSeconds={10} reps={2} onDone={onDone} />)

    fireEvent.click(screen.getByText('Start Intervals'))
    expect(screen.getByText(/Round 1 of 2.*Work/)).toBeTruthy()

    act(() => vi.advanceTimersByTime(20_000))
    expect(screen.getByText(/Round 1 of 2.*Rest/)).toBeTruthy()

    act(() => vi.advanceTimersByTime(10_000))
    expect(screen.getByText(/Round 2 of 2.*Work/)).toBeTruthy()

    act(() => vi.advanceTimersByTime(20_000))
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(onDone).toHaveBeenCalledWith(2)
    expect(screen.getByText('Done')).toBeTruthy()
  })

  it('can be ended early from rest or work without erroring', () => {
    const onDone = vi.fn()
    render(<IntervalTracker workSeconds={20} restSeconds={10} reps={3} onDone={onDone} />)

    fireEvent.click(screen.getByText('Start Intervals'))
    act(() => vi.advanceTimersByTime(25_000)) // into rest of round 1, which hasn't finished yet
    fireEvent.click(screen.getByText('End early'))

    expect(onDone).toHaveBeenCalledTimes(1)
    expect(onDone).toHaveBeenCalledWith(0)
  })
})
