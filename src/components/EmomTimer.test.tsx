// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EmomTimer } from './EmomTimer'

vi.mock('#/lib/audio', () => ({
  finishBeep: vi.fn(),
  minuteBeep: vi.fn(),
  tick: vi.fn(),
  unlockAudio: vi.fn(),
}))

const play = vi.fn(() => Promise.resolve())
const pause = vi.fn()

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause)
  play.mockClear()
  pause.mockClear()
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('EMOM minute audio', () => {
  it('alternates right then left at each minute', () => {
    const { container } = render(
      <EmomTimer
        totalMinutes={3}
        repsText="1 rep"
        minuteLabel={(minute) => minute % 2 === 0 ? 'Right' : 'Left'}
        minuteAudioSources={['/right.mp3', '/left.mp3']}
        onDone={() => {}}
      />,
    )

    const audio = Array.from(container.querySelectorAll('audio'))
    expect(audio).toHaveLength(2)
    expect(audio.map((element) => element.getAttribute('src'))).toEqual(['/right.mp3', '/left.mp3'])

    fireEvent.click(screen.getByText('Start EMOM'))
    // 1 real play for the right-hand clip + 1 silent "priming" play on the left-hand
    // clip so Safari will allow it to autoplay later without its own user gesture.
    expect(play).toHaveBeenCalledTimes(2)
    expect(screen.getByText(/Minute 1 of 3.*Right/)).toBeTruthy()

    act(() => vi.advanceTimersByTime(60_000))
    expect(play).toHaveBeenCalledTimes(3)
    expect(screen.getByText(/Minute 2 of 3.*Left/)).toBeTruthy()

    act(() => vi.advanceTimersByTime(60_000))
    expect(play).toHaveBeenCalledTimes(4)
    expect(screen.getByText(/Minute 3 of 3.*Right/)).toBeTruthy()
  })

  it('shows the blocked-audio fallback if play() never settles', () => {
    // iOS Safari can leave a blocked play() promise pending forever instead of
    // rejecting it, so the fallback has to rely on a watchdog timeout, not .catch().
    play.mockImplementation(() => new Promise(() => {}))

    render(
      <EmomTimer
        totalMinutes={1}
        repsText="1 rep"
        minuteAudioSources={['/right.mp3']}
        onDone={() => {}}
      />,
    )

    fireEvent.click(screen.getByText('Start EMOM'))
    expect(screen.queryByText(/Audio was blocked/)).toBeNull()

    act(() => vi.advanceTimersByTime(1200))
    expect(screen.getByText(/Audio was blocked by the browser/)).toBeTruthy()
  })
})
