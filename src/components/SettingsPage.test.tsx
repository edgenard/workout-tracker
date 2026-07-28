// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { customMovementsStore, DEFAULT_WORKOUTS } from '#/lib/movementData'
import { workoutsStore } from '#/lib/store'
import { SettingsPage } from './SettingsPage'
import type { WorkoutItem } from '#/lib/types'

function exerciseOf(item: WorkoutItem | undefined) {
  return item && 'currentPhase' in item ? item.exercise : undefined
}

function resetStores() {
  window.localStorage.clear()
  workoutsStore.setState(() => DEFAULT_WORKOUTS)
  customMovementsStore.setState(() => [])
}

beforeEach(resetStores)

afterEach(() => {
  cleanup()
  resetStores()
})

function coreWorkoutSection(): HTMLElement {
  const section = screen.getByText('Core Workout').closest('section')
  if (!section) throw new Error('Core Workout section not found')
  return section
}

function warmupSection(): HTMLElement {
  const section = screen.getByText('Warm-up').closest('section')
  if (!section) throw new Error('Warm-up section not found')
  return section
}

function addExercise(section: HTMLElement, name: string) {
  fireEvent.change(within(section).getByLabelText('Exercise name'), { target: { value: name } })
  fireEvent.click(within(section).getByText('Add exercise'))
}

describe('SettingsPage - core workout editing', () => {
  it('shows an exercise picker and add-exercise form for the core workout, same as warmup/cooldown', () => {
    render(<SettingsPage />)
    const core = coreWorkoutSection()

    // Existing core exercises are swappable via a dropdown, not just plain text.
    expect(within(core).getAllByLabelText('Exercise').length).toBeGreaterThan(0)
    // The "choose existing or type a new one" combobox is present for core workouts now.
    expect(within(core).getByLabelText('Exercise name')).toBeTruthy()
    expect(within(core).getByText('Add exercise')).toBeTruthy()
  })

  it('lets the user swap an existing core workout exercise for another known movement', () => {
    render(<SettingsPage />)
    const core = coreWorkoutSection()

    const select = within(core).getAllByLabelText('Exercise')[0] as HTMLSelectElement
    expect(select.value).toBe('swing')

    fireEvent.change(select, { target: { value: 'squat' } })

    expect(exerciseOf(workoutsStore.state.a.coreWorkout[0])?.id).toBe('squat')
  })

  it('adds a brand new exercise to the core workout for the selected day', () => {
    render(<SettingsPage />)
    const core = coreWorkoutSection()
    const before = workoutsStore.state.a.coreWorkout.length

    addExercise(core, 'Bear Crawl')

    expect(workoutsStore.state.a.coreWorkout).toHaveLength(before + 1)
    expect(exerciseOf(workoutsStore.state.a.coreWorkout.at(-1))?.name).toBe('Bear Crawl')
    expect(within(core).getByDisplayValue('Bear Crawl')).toBeTruthy()
  })

  it('makes a new exercise added via core workout available to pick from in other sections', () => {
    render(<SettingsPage />)
    const core = coreWorkoutSection()

    addExercise(core, 'Bear Crawl')

    const warmup = warmupSection()
    const firstWarmupSelect = within(warmup).getAllByLabelText('Exercise')[0]!
    expect(within(firstWarmupSelect).getByText('Bear Crawl')).toBeTruthy()
  })

  it('reuses an existing movement by name instead of creating a duplicate', () => {
    render(<SettingsPage />)
    const core = coreWorkoutSection()

    addExercise(core, 'Kettlebell Swing')

    expect(customMovementsStore.state).toHaveLength(0)
    expect(exerciseOf(workoutsStore.state.a.coreWorkout.at(-1))?.id).toBe('swing')
  })

  it('persists newly added core workout exercises to localStorage', () => {
    render(<SettingsPage />)
    const core = coreWorkoutSection()

    addExercise(core, 'Bear Crawl')

    const stored = JSON.parse(window.localStorage.getItem('workout-tracker:custom-movements:v1') ?? '[]')
    expect(stored.some((movement: { name: string }) => movement.name === 'Bear Crawl')).toBe(true)
  })
})
