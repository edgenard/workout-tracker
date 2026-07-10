export type DayId = 'a' | 'b' | 'recovery'
export type WeightUnit = 'kg' | 'lb'

export interface Movement {
  id: string
  name: string
  description: string
  variantOptions?: Array<string>
}

export interface Equipment {
  name: string
  weightUnit: WeightUnit
  weight: number
}

export interface BaseTrainingFormat {
  variant: string
  cue?: string
  equipment?: Equipment
  perSide?: boolean
}

export interface RepsAndSets extends BaseTrainingFormat {
  kind: 'repsAndSets'
  reps: number
  sets: number
}

export interface Emom extends BaseTrainingFormat {
  kind: 'emom'
  duration: number
  targetReps: number
}

export interface Timed extends BaseTrainingFormat {
  kind: 'timed'
  duration: number
  cues: Array<number>
}

export interface Ladder extends BaseTrainingFormat {
  kind: 'ladder'
  ladderTop: number
  ladders: number
  direction: 'up' | 'down'
}

export type TrainingFormat = RepsAndSets | Emom | Timed | Ladder

export interface Transition {
  kind: 'transition'
  seconds: number
}

export interface ExerciseTrainingPlan<TFormat extends TrainingFormat> {
  exercise: Movement
  currentPhase: TFormat
  nextPhase?: TFormat
  previousPhase?: TFormat
}

export type WorkoutItem = ExerciseTrainingPlan<TrainingFormat> | Transition

export interface Workout {
  warmup?: Array<WorkoutItem>
  coreWorkout: Array<WorkoutItem>
  cooldown?: Array<WorkoutItem>
}

export interface WorkoutSettingsState {
  displayUnit: WeightUnit
}

export interface MovementResult {
  movement: string
  target: string
  hit: boolean
  targetReps?: number
  repsDone?: number
  weight?: number
  unit?: WeightUnit
}

export interface WorkoutLogEntry {
  id: string
  date: string
  day: DayId
  results: Array<MovementResult>
}
