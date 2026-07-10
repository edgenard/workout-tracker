import { Store } from '@tanstack/store'
import type { CountdownCueConfig } from './countdownCue'
import type { DayId, Emom, Timed, Workout } from './types'

const PRESENTATION_SETTINGS_KEY = 'workout-tracker:presentation-settings:v1'

export type CountdownFormatKind = Timed['kind'] | Emom['kind']
export type WorkoutPhaseSlot = 'current' | 'next'
export type WorkoutPresentationSettings = Record<string, CountdownCueConfig>

function loadPresentationSettings(): WorkoutPresentationSettings {
  if (typeof window === 'undefined') return {}
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(PRESENTATION_SETTINGS_KEY) ?? '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value as WorkoutPresentationSettings : {}
  } catch {
    return {}
  }
}

export const presentationSettingsStore = new Store<WorkoutPresentationSettings>(loadPresentationSettings())

if (typeof window !== 'undefined') {
  presentationSettingsStore.subscribe(() => window.localStorage.setItem(PRESENTATION_SETTINGS_KEY, JSON.stringify(presentationSettingsStore.state)))
}

export function workoutFormatPresentationKey(day: DayId, section: keyof Workout, exerciseId: string, slot: WorkoutPhaseSlot, kind: CountdownFormatKind): string {
  return [day, section, exerciseId, slot, kind].join(':')
}

export function setCountdownCueConfig(key: string, config: CountdownCueConfig): void {
  presentationSettingsStore.setState((settings) => ({ ...settings, [key]: config }))
}

export function resetPresentationSettings(): void {
  presentationSettingsStore.setState(() => ({}))
}
