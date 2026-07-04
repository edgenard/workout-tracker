import { Store } from '@tanstack/store'
import { DEFAULT_PROGRESSION } from './progression'
import type { MovementId, ProgressionState, WorkoutLogEntry } from './types'
import { applyResults, movementTarget } from './progression'

const PROGRESSION_KEY = 'workout-tracker:progression:v1'
const HISTORY_KEY = 'workout-tracker:history:v1'

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

if (typeof window !== 'undefined') {
  progressionStore.subscribe(() => {
    window.localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progressionStore.state))
  })
  historyStore.subscribe(() => {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(historyStore.state))
  })
}

export function saveWorkout(
  day: WorkoutLogEntry['day'],
  results: Partial<Record<MovementId, boolean>>,
): void {
  const progression = progressionStore.state
  const entry: WorkoutLogEntry = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    day,
    results: (Object.entries(results) as Array<[MovementId, boolean]>).map(
      ([movement, hit]) => ({
        movement,
        target: movementTarget(progression, movement),
        hit,
      }),
    ),
  }
  historyStore.setState((h) => [entry, ...h])
  progressionStore.setState((p) => applyResults(p, results))
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
