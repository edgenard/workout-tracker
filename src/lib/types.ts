export type MovementId =
  | 'swing'
  | 'tgu'
  | 'pullover'
  | 'cleanPress'
  | 'squat'
  | 'splitSquat'

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

export interface PulloverState {
  /** ATG shoulder armor: 3 sets, build from 10 to 15 controlled reps */
  reps: number
}

export interface SplitSquatState {
  /** ATG knee armor: 0 = high elevation … 3 = floor bodyweight, 4 = floor goblet-loaded */
  level: number
  /** Depth drops "over weeks" — require 2 consecutive hits to lower the elevation */
  successStreak: number
}

export interface GoodMorningState {
  /** ROM first with bodyweight; hug the bell only once deep hinging is comfortable */
  loaded: boolean
}

export interface ProgressionState {
  swing: SwingState
  tgu: TguState
  pullover: PulloverState
  cleanPress: CleanPressState
  squat: SquatState
  splitSquat: SplitSquatState
  goodMorning: GoodMorningState
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
  /** Seconds into the segment where a switch cue fires (e.g. change sides) */
  switchTimes?: Array<number>
  /** What a switch divides the segment into, e.g. "Side" or "Set" */
  switchLabel?: string
}
