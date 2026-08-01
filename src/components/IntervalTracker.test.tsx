// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IntervalTracker } from './IntervalTracker'

const audio = vi.hoisted(() => ({
  finishBeep: vi.fn(),
  switchBeep: vi.fn(),
  tick: vi.fn(),
  unlockAudio: vi.fn(),
}))

vi.mock('#/lib/audio', () => audio)

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

  it('ticks for the last seconds of both work and rest, by default and on a custom countdown', () => {
    audio.tick.mockClear()
    render(<IntervalTracker workSeconds={10} restSeconds={10} reps={2} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Start Intervals'))

    act(() => vi.advanceTimersByTime(1000)) // 9s work left, no tick yet
    expect(audio.tick).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(6000)) // 3s work left -> default countdown starts
    expect(audio.tick).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(1000)) // 2s work left
    expect(audio.tick).toHaveBeenCalledTimes(2)
    act(() => vi.advanceTimersByTime(3000)) // into rest, 9s rest left, no tick from rest yet
    expect(audio.tick).toHaveBeenCalledTimes(2)
    act(() => vi.advanceTimersByTime(6000)) // 3s rest left -> default countdown starts
    expect(audio.tick).toHaveBeenCalledTimes(3)
  })

  it('honors a wider custom countdown config', () => {
    audio.tick.mockClear()
    render(<IntervalTracker workSeconds={10} restSeconds={10} reps={1} countdownConfig={{ countdownPercent: 50 }} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Start Intervals'))

    act(() => vi.advanceTimersByTime(4000)) // 6s left, still outside the wider 50% (5s) window
    expect(audio.tick).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1000)) // 5s left -> inside the wider countdown window
    expect(audio.tick).toHaveBeenCalledTimes(1)
  })
})
