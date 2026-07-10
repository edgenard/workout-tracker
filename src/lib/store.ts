import { Store } from '@tanstack/store'
import { DEFAULT_WORKOUTS } from './movementData'
import { formatTarget, targetReps } from './planText'
import { resetPresentationSettings } from './presentationSettings'
import { recordedLoad } from './volume'
import type { DayId, Emom, Ladder, RepsAndSets, Workout, WorkoutLogEntry, WorkoutSettingsState } from './types'

const WORKOUTS_KEY = 'workout-tracker:workouts:v1'
const HISTORY_KEY = 'workout-tracker:history:v1'
const SETTINGS_KEY = 'workout-tracker:settings:v1'
const ACTIVE_SESSION_KEY = 'workout-tracker:active-session:v1'
const SESSION_RUNTIME_PREFIX = 'workout-tracker:session-runtime:v1:'

export const DEFAULT_WORKOUT_SETTINGS: WorkoutSettingsState = { displayUnit: 'kg' }

function load<T>(key: string, fallback: T, valid: (value: unknown) => value is T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const value: unknown = JSON.parse(raw)
    return valid(value) ? value : fallback
  } catch {
    return fallback
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object'
}

function isPhase(value: unknown): boolean {
  if (!isRecord(value) || typeof value.variant !== 'string' || typeof value.kind !== 'string') return false
  switch (value.kind) {
    case 'timed': return typeof value.duration === 'number' && Array.isArray(value.cues)
    case 'emom': return typeof value.duration === 'number' && typeof value.targetReps === 'number'
    case 'repsAndSets': return typeof value.reps === 'number' && typeof value.sets === 'number'
    case 'ladder': return typeof value.ladderTop === 'number' && typeof value.ladders === 'number' && (value.direction === 'up' || value.direction === 'down')
    default: return false
  }
}

function isItem(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (value.kind === 'transition') return typeof value.seconds === 'number'
  return isRecord(value.exercise)
    && typeof value.exercise.id === 'string'
    && typeof value.exercise.name === 'string'
    && typeof value.exercise.description === 'string'
    && isPhase(value.currentPhase)
    && (value.nextPhase === undefined || isPhase(value.nextPhase))
}

function isItems(value: unknown): value is Workout['coreWorkout'] {
  return Array.isArray(value) && value.every(isItem)
}

function isWorkout(value: unknown): value is Workout {
  if (!isRecord(value) || !isItems(value.coreWorkout)) return false
  return (value.warmup === undefined || isItems(value.warmup))
    && (value.cooldown === undefined || isItems(value.cooldown))
}

function isWorkouts(value: unknown): value is Record<DayId, Workout> {
  if (!value || typeof value !== 'object') return false
  const workouts = value as Record<string, unknown>
  return isWorkout(workouts.a) && isWorkout(workouts.b) && isWorkout(workouts.recovery)
}

function isHistory(value: unknown): value is Array<WorkoutLogEntry> {
  return Array.isArray(value)
}

function isSettings(value: unknown): value is WorkoutSettingsState {
  if (!value || typeof value !== 'object') return false
  const unit = (value as { displayUnit?: unknown }).displayUnit
  return unit === 'kg' || unit === 'lb'
}

export interface ActiveSessionState {
  id: string
  day: DayId
  workout: Workout
  stepIdx: number
  results: Record<string, LoggedResult>
  timerDone: Record<number, boolean>
}

function isActiveSession(value: unknown): value is ActiveSessionState | null {
  if (value === null) return true
  return isRecord(value)
    && typeof value.id === 'string'
    && (value.day === 'a' || value.day === 'b' || value.day === 'recovery')
    && isWorkout(value.workout)
    && typeof value.stepIdx === 'number'
    && isRecord(value.results)
    && isRecord(value.timerDone)
}

export const workoutsStore = new Store<Record<DayId, Workout>>(
  load(WORKOUTS_KEY, DEFAULT_WORKOUTS, isWorkouts),
)
export const historyStore = new Store<Array<WorkoutLogEntry>>(
  load(HISTORY_KEY, [], isHistory),
)
export const settingsStore = new Store<WorkoutSettingsState>(
  load(SETTINGS_KEY, DEFAULT_WORKOUT_SETTINGS, isSettings),
)
export const activeSessionStore = new Store<ActiveSessionState | null>(
  load(ACTIVE_SESSION_KEY, null, isActiveSession),
)

if (typeof window !== 'undefined') {
  workoutsStore.subscribe(() => window.localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workoutsStore.state)))
  historyStore.subscribe(() => window.localStorage.setItem(HISTORY_KEY, JSON.stringify(historyStore.state)))
  settingsStore.subscribe(() => window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsStore.state)))
  activeSessionStore.subscribe(() => window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(activeSessionStore.state)))
}

export function workoutRuntimeKey(sessionId: string, stepIdx: number, name: string): string {
  return `${SESSION_RUNTIME_PREFIX}${sessionId}:${stepIdx}:${name}`
}

function clearSessionRuntime(sessionId: string): void {
  if (typeof window === 'undefined') return
  const prefix = `${SESSION_RUNTIME_PREFIX}${sessionId}:`
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index)
    if (key?.startsWith(prefix)) window.localStorage.removeItem(key)
  }
}

export function startSession(day: DayId, workout: Workout): void {
  const previous = activeSessionStore.state
  if (previous) clearSessionRuntime(previous.id)
  activeSessionStore.setState(() => ({
    id: crypto.randomUUID(),
    day,
    workout,
    stepIdx: 0,
    results: {},
    timerDone: {},
  }))
}

export function updateActiveSession(update: (session: ActiveSessionState) => ActiveSessionState): void {
  activeSessionStore.setState((session) => session ? update(session) : session)
}

export function clearActiveSession(): void {
  const session = activeSessionStore.state
  if (session) clearSessionRuntime(session.id)
  activeSessionStore.setState(() => null)
}

export function setWorkout(day: DayId, workout: Workout): void {
  workoutsStore.setState((workouts) => ({ ...workouts, [day]: workout }))
}

export function setWorkoutSettings(next: WorkoutSettingsState): void {
  settingsStore.setState(() => next)
}

export interface LoggedResult {
  movementId: string
  movementName: string
  phase: Emom | RepsAndSets | Ladder
  repsDone: number
}

export function saveWorkout(day: DayId, results: Array<LoggedResult>): void {
  const entry: WorkoutLogEntry = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    day,
    results: results.map((result) => {
      const goal = targetReps(result.phase)
      return {
        movement: result.movementId,
        target: formatTarget(result.movementName, result.phase),
        hit: result.repsDone >= goal,
        targetReps: goal,
        repsDone: result.repsDone,
        ...recordedLoad(result.phase.equipment),
      }
    }),
  }
  historyStore.setState((history) => [entry, ...history])
}

export function deleteWorkout(id: string): void {
  historyStore.setState((history) => history.filter((entry) => entry.id !== id))
}

export function resetAllData(): void {
  clearActiveSession()
  resetPresentationSettings()
  workoutsStore.setState(() => DEFAULT_WORKOUTS)
  historyStore.setState(() => [])
}
