// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useStopwatch } from './useStopwatch'

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
})

describe('useStopwatch persistence', () => {
  it('keeps a running timer advancing while unmounted', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-10T12:00:00Z'))
    const key = 'test:stopwatch'
    window.localStorage.setItem(key, JSON.stringify({
      status: 'running',
      accumulatedMs: 2_000,
      startedAt: Date.now() - 3_000,
    }))

    const { result, unmount } = renderHook(() => useStopwatch(key))
    expect(result.current.status).toBe('running')
    expect(result.current.elapsedMs).toBe(5_000)
    unmount()

    vi.advanceTimersByTime(4_000)
    const resumed = renderHook(() => useStopwatch(key))
    expect(resumed.result.current.elapsedMs).toBe(9_000)
  })

  it('restores a paused timer without adding away time', () => {
    vi.useFakeTimers()
    const key = 'test:paused-stopwatch'
    const timer = renderHook(() => useStopwatch(key))

    act(() => timer.result.current.start())
    vi.advanceTimersByTime(2_500)
    act(() => timer.result.current.pause())
    timer.unmount()
    vi.advanceTimersByTime(10_000)

    const resumed = renderHook(() => useStopwatch(key))
    expect(resumed.result.current.status).toBe('paused')
    expect(resumed.result.current.elapsedMs).toBe(2_500)
  })
})
