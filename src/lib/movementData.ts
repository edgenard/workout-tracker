import type { DayId, Equipment, Movement, Transition, Workout, WorkoutItem } from './types'

export const SPLIT_SQUAT_LEVELS = [
  'front foot on a chair, bodyweight',
  'front foot on a low box, bodyweight',
  'front foot on a plate/step, bodyweight',
  'front foot flat on the floor, bodyweight',
  'floor, kettlebell in goblet position',
]

function kettlebell(weight = 16): Equipment {
  return { name: 'Kettlebell', weightUnit: 'kg', weight }
}

function transition(seconds = 5): Transition {
  return { kind: 'transition', seconds }
}

export const MOVEMENTS = {
  swing: { id: 'swing', name: 'Kettlebell Swing', description: 'Hip hinge exercise that works the posterior chain.', variantOptions: ['Two-Hand', 'Single-Arm'] },
  tgu: { id: 'tgu', name: 'Turkish Get-Up', description: 'Floor-to-standing sequence, alternating sides.', variantOptions: ['standard', '3-second pause'] },
  pullover: { id: 'pullover', name: 'Floor Pullovers', description: 'ATG shoulder armor — deep overhead stretch to the floor and back.' },
  cleanPress: { id: 'cleanPress', name: 'Clean & Press', description: 'Clean to the rack, press overhead.' },
  squat: { id: 'squat', name: 'Squat', description: 'Bell-loaded squat, EMOM pace.', variantOptions: ['Goblet', 'Single-Arm Front Rack'] },
  splitSquat: { id: 'splitSquat', name: 'ATG Split Squat', description: 'Long lunge stance, back leg straight — knee armor.', variantOptions: SPLIT_SQUAT_LEVELS },
  goodMorning: { id: 'goodMorning', name: 'Seated Good Morning', description: 'Seated hip hinge — lower back armor.' },
  wristSpins: { id: 'wristSpins', name: 'Quadruped Wrist Spins', description: 'Wrist and shoulder prep on hands and knees.' },
  kbHalos: { id: 'kbHalos', name: 'Kettlebell Halos', description: 'Shoulder mobility, bell traced around the head.' },
  pryingGobletSquat: { id: 'pryingGobletSquat', name: 'Prying Goblet Squat', description: 'Hip opener, weight shifted side to side at depth.' },
  wallTibialisRaises: { id: 'wallTibialisRaises', name: 'Wall Tibialis Raises', description: 'ATG ankle armor.' },
  elephantWalks: { id: 'elephantWalks', name: 'Elephant Walks', description: 'ATG hamstring armor.' },
  sphinx: { id: 'sphinx', name: 'The Sphinx', description: 'Prone lower-back extension.' },
  ninetyNinety: { id: 'ninetyNinety', name: '90/90 Hip Stretch', description: 'Both legs at 90°, switch sides halfway through.' },
} as const satisfies Record<string, Movement>

export type MovementKey = keyof typeof MOVEMENTS

const WARMUP: Array<WorkoutItem> = [
  { exercise: MOVEMENTS.wristSpins, currentPhase: { kind: 'timed', variant: 'standard', duration: 60, cues: [], cue: 'On hands and knees, gently circle your shoulders over your wrists.' } },
  transition(),
  { exercise: MOVEMENTS.kbHalos, currentPhase: { kind: 'timed', variant: 'standard', duration: 60, cues: [], cue: 'Hold the bell upside down by the horns, trace tight circles around your head.' } },
  transition(),
  { exercise: MOVEMENTS.pryingGobletSquat, currentPhase: { kind: 'timed', variant: 'standard', duration: 60, cues: [], cue: 'Bell at chest, sit deep, elbows push knees out. Shift side to side.' } },
  transition(),
  { exercise: MOVEMENTS.wallTibialisRaises, currentPhase: { kind: 'timed', variant: 'standard', duration: 60, cues: [], cue: 'Lean back against a wall, legs straight, lift your toes — 25 reps.' } },
  transition(),
  { exercise: MOVEMENTS.elephantWalks, currentPhase: { kind: 'timed', variant: 'standard', duration: 60, cues: [], cue: 'Hinge forward, hands on shins or floor, alternate straightening each leg — 30 total reps.' } },
]

const COOLDOWN: Array<WorkoutItem> = [
  { exercise: MOVEMENTS.sphinx, currentPhase: { kind: 'timed', variant: 'standard', duration: 120, cues: [], cue: 'On your stomach, prop up on forearms. Gently extend the lower back.' } },
  transition(),
  { exercise: MOVEMENTS.ninetyNinety, currentPhase: { kind: 'timed', variant: 'standard', duration: 120, cues: [60], cue: 'Lean over the front shin, then rotate to the back at the beep.' } },
  transition(),
  { exercise: MOVEMENTS.goodMorning, currentPhase: { kind: 'timed', variant: 'standard', duration: 120, cues: [], cue: 'Sit wide-legged. Lower back perfectly arched, hinge forward slowly. Bodyweight — chase range of motion, not load.' } },
]

export const DEFAULT_WORKOUTS: Record<DayId, Workout> = {
  a: {
    warmup: WARMUP,
    coreWorkout: [
      { exercise: MOVEMENTS.swing, currentPhase: { kind: 'emom', variant: 'Two-Hand', duration: 10, targetReps: 10, equipment: kettlebell() }, nextPhase: { kind: 'emom', variant: 'Two-Hand', duration: 11, targetReps: 10, equipment: kettlebell() } },
      transition(),
      { exercise: MOVEMENTS.tgu, currentPhase: { kind: 'emom', variant: 'standard', duration: 10, targetReps: 1, equipment: kettlebell(), cue: 'Alternate sides each minute.' }, nextPhase: { kind: 'emom', variant: 'standard', duration: 12, targetReps: 1, equipment: kettlebell(), cue: 'Alternate sides each minute.' } },
      transition(),
      { exercise: MOVEMENTS.pullover, currentPhase: { kind: 'repsAndSets', variant: 'standard', reps: 10, sets: 3, equipment: kettlebell() }, nextPhase: { kind: 'repsAndSets', variant: 'standard', reps: 11, sets: 3, equipment: kettlebell() } },
    ],
    cooldown: COOLDOWN,
  },
  b: {
    warmup: WARMUP,
    coreWorkout: [
      { exercise: MOVEMENTS.cleanPress, currentPhase: { kind: 'ladder', variant: 'standard', ladderTop: 3, ladders: 3, direction: 'down', equipment: kettlebell(), perSide: true }, nextPhase: { kind: 'ladder', variant: 'standard', ladderTop: 3, ladders: 4, direction: 'down', equipment: kettlebell(), perSide: true } },
      transition(),
      { exercise: MOVEMENTS.squat, currentPhase: { kind: 'emom', variant: 'Goblet', duration: 10, targetReps: 6, equipment: kettlebell() }, nextPhase: { kind: 'emom', variant: 'Goblet', duration: 11, targetReps: 6, equipment: kettlebell() } },
      transition(),
      { exercise: MOVEMENTS.splitSquat, currentPhase: { kind: 'repsAndSets', variant: SPLIT_SQUAT_LEVELS[0]!, reps: 5, sets: 5, perSide: true }, nextPhase: { kind: 'repsAndSets', variant: SPLIT_SQUAT_LEVELS[1]!, reps: 5, sets: 5, perSide: true } },
    ],
    cooldown: COOLDOWN,
  },
  recovery: { warmup: WARMUP, coreWorkout: [], cooldown: COOLDOWN },
}
