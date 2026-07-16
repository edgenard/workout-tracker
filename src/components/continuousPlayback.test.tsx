// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SetTracker } from './SetTracker'
import { TransitionBeat } from './TransitionBeat'

vi.mock('#/lib/audio', () => ({
  finishBeep: vi.fn(),
  minuteBeep: vi.fn(),
  tick: vi.fn(),
  unlockAudio: vi.fn(),
}))

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('continuous section playback', () => {
  it('automatically starts a self-paced tracker when continuing a section', async () => {
    render(<SetTracker sets={3} repsText="10 reps" persistenceKey="sets" autoStart onDone={() => {}} />)

    expect(await screen.findByText('Set 1 of 3')).toBeTruthy()
    expect(screen.queryByText('Start Sets')).toBeNull()
    expect(JSON.parse(window.localStorage.getItem('sets:timer') ?? '{}')).toMatchObject({ status: 'running' })
  })

  it('automatically starts a transition when continuing a section', async () => {
    render(<TransitionBeat seconds={5} nextName="Next exercise" persistenceKey="transition" autoStart onDone={() => {}} />)

    await waitFor(() => {
      expect(screen.queryByText('Start transition')).toBeNull()
      expect(JSON.parse(window.localStorage.getItem('transition') ?? '{}')).toMatchObject({ status: 'running' })
    })
  })

  it('still requires a manual start at a section boundary', () => {
    render(<SetTracker sets={3} repsText="10 reps" persistenceKey="sets" onDone={() => {}} />)

    expect(screen.getByText('Start Sets')).toBeTruthy()
    expect(window.localStorage.getItem('sets:timer')).toBeNull()
  })

  it('shows exercise time without a per-set rest timer', async () => {
    render(<SetTracker sets={3} repsText="10 reps" persistenceKey="sets" autoStart onDone={() => {}} />)

    expect(await screen.findByText('Total: 0:00')).toBeTruthy()
    expect(screen.queryByText(/rest since last set/i)).toBeNull()
    expect(window.localStorage.getItem('sets:last-set')).toBeNull()
  })
})
