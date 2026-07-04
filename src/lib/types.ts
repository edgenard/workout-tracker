export type MovementId = 'swing' | 'tgu' | 'cleanPress' | 'squat'

export type DayId = 'a' | 'b' | 'recovery'

export interface SwingState {
  /** Phase 3 switches two-hand → single-arm and restarts the cycle */
  style: 'two-hand' | 'single-arm'
  repsPerMinute: number
  minutes: number
}

export interface TguState {
  /** Always even — one left + one right per pair of minutes */
  minutes: number
  /** Phase 2: strict 3-second pause at every transition */
  pauses: boolean
  /** TGU progresses weekly, so we require 2 consecutive hits (≈1 week at 2 A-days) */
  successStreak: number
}

export interface CleanPressState {
  /** Ladder shape: ladderTop..1, e.g. 3 → 3-2-1 */
  ladderTop: number
  ladders: number
}

export interface SquatState {
  style: 'goblet' | 'front-rack'
  repsPerMinute: number
  minutes: number
}

export interface ProgressionState {
  swing: SwingState
  tgu: TguState
  cleanPress: CleanPressState
  squat: SquatState
}

export interface MovementResult {
  movement: MovementId
  /** Human-readable target that was attempted, frozen at log time */
  target: string
  hit: boolean
}

export interface WorkoutLogEntry {
  id: string
  /** ISO date-time the workout was saved */
  date: string
  day: DayId
  results: Array<MovementResult>
}

export interface TimerSegment {
  name: string
  cue: string
  seconds: number
}
