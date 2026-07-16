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

const audioInstances: Array<MockAudio> = []

class MockAudio {
  src: string
  currentTime = 0
  duration = 60
  readyState = 1
  play = vi.fn(() => Promise.resolve())
  pause = vi.fn()
  addEventListener = vi.fn()

  constructor(src: string) {
    this.src = src
    audioInstances.push(this)
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('Audio', MockAudio)
  audioInstances.length = 0
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('EMOM minute audio', () => {
  it('alternates right then left at each minute', () => {
    render(
      <EmomTimer
        totalMinutes={3}
        repsText="1 rep"
        minuteLabel={(minute) => minute % 2 === 0 ? 'Right' : 'Left'}
        minuteAudioSources={['/right.mp3', '/left.mp3']}
        onDone={() => {}}
      />,
    )

    fireEvent.click(screen.getByText('Start EMOM'))
    expect(audioInstances.map((audio) => audio.src)).toEqual(['/right.mp3'])
    expect(screen.getByText(/Minute 1 of 3.*Right/)).toBeTruthy()

    act(() => vi.advanceTimersByTime(60_000))
    expect(audioInstances.map((audio) => audio.src)).toEqual(['/right.mp3', '/left.mp3'])
    expect(screen.getByText(/Minute 2 of 3.*Left/)).toBeTruthy()

    act(() => vi.advanceTimersByTime(60_000))
    expect(audioInstances.map((audio) => audio.src)).toEqual(['/right.mp3', '/left.mp3', '/right.mp3'])
    expect(screen.getByText(/Minute 3 of 3.*Right/)).toBeTruthy()
  })
})
