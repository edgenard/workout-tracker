import { Store } from '@tanstack/store'
import { DEFAULT_PROGRESSION } from './progression'
import type {
  BellState,
  MovementId,
  ProgressionState,
  WorkoutLogEntry,
  WorkoutSettingsState,
} from './types'
import {
  applyResults,
  movementReps,
  movementTarget,
  movementUsesBell,
} from './progression'

const PROGRESSION_KEY = 'workout-tracker:progression:v1'
const HISTORY_KEY = 'workout-tracker:history:v1'
const BELL_KEY = 'workout-tracker:bell:v1'
const SETTINGS_KEY = 'workout-tracker:settings:v1'

export const DEFAULT_BELL: BellState = { weight: 16, unit: 'kg' }
export const DEFAULT_WORKOUT_SETTINGS: WorkoutSettingsState = {
  transitionSeconds: 5,
  countdownSeconds: 5,
}

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return { ...fallback, ...JSON.parse(raw) }
  } catch {
    return fallback
  }
}

function loadHistory(): Array<WorkoutLogEntry> {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as Array<WorkoutLogEntry>) : []
  } catch {
    return []
  }
}

export const progressionStore = new Store<ProgressionState>(
  load(PROGRESSION_KEY, DEFAULT_PROGRESSION),
)

export const historyStore = new Store<Array<WorkoutLogEntry>>(loadHistory())

export const bellStore = new Store<BellState>(load(BELL_KEY, DEFAULT_BELL))

export const settingsStore = new Store<WorkoutSettingsState>(
  load(SETTINGS_KEY, DEFAULT_WORKOUT_SETTINGS),
)

if (typeof window !== 'undefined') {
  progressionStore.subscribe(() => {
    window.localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progressionStore.state))
  })
  historyStore.subscribe(() => {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(historyStore.state))
  })
  bellStore.subscribe(() => {
    window.localStorage.setItem(BELL_KEY, JSON.stringify(bellStore.state))
  })
  settingsStore.subscribe(() => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsStore.state))
  })
}

export function setBell(next: BellState): void {
  bellStore.setState(() => next)
}

export function setWorkoutSettings(next: WorkoutSettingsState): void {
  settingsStore.setState(() => next)
}

export function saveWorkout(
  day: WorkoutLogEntry['day'],
  results: Partial<Record<MovementId, number>>,
): void {
  const progression = progressionStore.state
  const hits: Partial<Record<MovementId, boolean>> = {}
  const entry: WorkoutLogEntry = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    day,
    results: (Object.entries(results) as Array<[MovementId, number]>).map(
      ([movement, repsDone]) => {
        const targetReps = movementReps(progression, movement)
        const hit = repsDone >= targetReps
        hits[movement] = hit
        return {
          movement,
          target: movementTarget(progression, movement),
          hit,
          targetReps,
          repsDone,
          weight: movementUsesBell(progression, movement) ? bellStore.state.weight : 0,
          unit: bellStore.state.unit,
        }
      },
    ),
  }
  historyStore.setState((h) => [entry, ...h])
  progressionStore.setState((p) => applyResults(p, hits))
}

export function deleteWorkout(id: string): void {
  historyStore.setState((h) => h.filter((e) => e.id !== id))
}

export function setProgression(next: ProgressionState): void {
  progressionStore.setState(() => next)
}

export function resetAllData(): void {
  progressionStore.setState(() => DEFAULT_PROGRESSION)
  historyStore.setState(() => [])
}
