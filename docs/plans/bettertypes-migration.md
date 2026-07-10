# Migrate the app onto the generic training types

> **Status: settled — 0 open questions** (Jul 10, 2026).
> Reviewed over three rounds via the commentable artifact:
> https://claude.ai/code/artifact/7a1f84f3-27ba-48f3-b987-d49ba11410ab
> This document is the final, implementation-ready version.

## Context

We designed a generic replacement for the app's bespoke per-movement progression
types (`src/lib/types.ts` / `src/lib/progression.ts`). The design shifted twice in
ways that change the app's architecture, not just its types:

- **Equipment moved from a fixed spec to per-phase data**, and Settings becomes a
  place to set and review a specific workout, like Day A — the user edits it
  directly, including equipment, and decides when to progress. So `Workout`
  (warmup/coreWorkout/cooldown) stops being a computed view over a flat
  progression dictionary and becomes the actual persisted, user-editable entity,
  one per day.
- **Transitions became sequence items, not a field**:
  `WorkoutItem = ExerciseTrainingPlan<TrainingFormat> | Transition`.
- **One type file, not two**: `betterTypes.ts` is only a staging area while old
  and new types coexist. Phase 3 folds it into `types.ts` and deletes it.

## Decisions from review (all applied below)

- **One merged type file** — `betterTypes.ts` stages the new shape through
  Phases 0–2; Phase 3 merges it into `types.ts` and deletes it.
- **No backwards compatibility, anywhere** — no storage migrations, no legacy
  bell seeding. Keys keep their names only because there's no reason to touch
  them; stored data that doesn't parse into the new shapes falls back to defaults.
- **Only core exercises are logged** — warm-up and cool-down are ordinary
  editable sections (any movement, any format, equipment or not, swappable
  whenever), but they never produce a `MovementResult`. History and Progress are
  core-only. There is no `COOLDOWN_LOADED`/`COOLDOWN_UNLOADED` pair and no
  toggle; a loaded Good Morning is just an edit you make in the editor.
- **Variant stays a text box; suggestions live on `Movement.variantOptions`** —
  the editor renders a free-text input backed by a native `<datalist>` (type
  anything, or pick from the movement's suggestions: swing/squat styles, TGU
  pauses, the five split-squat levels).
- **`Emom.alternateSides` rejected** — TGU's side-switching lives in words: the
  movement description plus a phase `cue` ("Alternate sides each minute.") shown
  in the session step. `EmomTimer`'s `minuteLabel` prop simply goes unused.
- **Display unit converts** — Progress shows totals in whichever unit the user
  picks, regardless of what each entry was recorded in. `volume.ts` already does
  this (`convertWeight()`); the kg/lb switch lives on the Progress page,
  persisted as `settings.displayUnit`.
- **`nextStepHint` returns as `nextPhase`** — wherever a core exercise's target
  is shown (Home cards, session step), a dim "Next: …" line renders
  `formatTarget(name, plan.nextPhase)` when `nextPhase` exists. Defaults seed
  `nextPhase` from today's rules; the editor maintains it (manual progression).
- **`countdownSeconds` removed alongside `transitionSeconds`** —
  `WorkoutSettingsState` shrinks to `{ displayUnit }`. The beep lead time is
  fixed at 5 seconds (the timer components' existing default); playback just
  stops passing the prop.
- **`formatTarget` keeps variant-as-prefix rendering**, even for sentence-length
  split-squat variants (explicit call; no suffix mode).

## Verified against the codebase

Checked against current source, not taken on faith:

- **All parity numbers match `progression.test.ts`**: swing 100, tgu 10,
  pullover 30, cleanPress 36, squat 60, splitSquat 50. `perSide` ×2 reproduces
  `cleanPressRepsDone`/`splitSquatRepsDone`, and `direction: "down"` matches
  today's descending 3-2-1 `ladderRungs` exactly.
- **The components already fit.** `EmomTimer`/`SetTracker`/`LadderTracker`/
  `RepsCheck` props match the plan's usage exactly — and both timer components
  already default `countdownSeconds` to 5, which is what lets that setting be
  deleted without touching their beep logic.
- **Baseline verified**: `tsc` reports exactly one error (the unused
  `KbSwingsRepsPlan` sample Phase 0 deletes) and all 40 tests pass.
- **`chunkWorkoutItems` traced** against the real Day A / Day B / recovery
  sequences plus a cool-down ending in a self-paced reps&sets item (the
  loaded-Good-Morning shape) — correct, including the `upNext` transition
  extraction.
- **`volume.ts` already converts, not just labels**: `convertWeight()` maps
  every logged result from its recorded unit to the display unit before summing.

## Type fields — settled

| Field | Outcome |
| --- | --- |
| `Movement.id: string` | Confirmed — join key for `WorkoutLogEntry` (History/Progress), replacing the closed `MovementId` union |
| `Movement.variantOptions?: Array<string>` | Moved to `Movement` (was proposed on the phase) — datalist suggestions under the free-text variant input |
| `BaseTrainingFormat.perSide?: boolean` | Confirmed — raw rep count doubles for target/volume math (Split Squat, Clean & Press) |
| `Emom.alternateSides?: boolean` | Rejected — not added; description + cue carry TGU's alternation |
| `WorkoutSettingsState.displayUnit: WeightUnit` | Confirmed, with conversion semantics — lives in the merged `types.ts` |

One coupling change accepted with `variantOptions`: reaching the loaded
split-squat stage no longer auto-adds the bell (`movementUsesBell` did that) —
you tick "Uses kettlebell" yourself, consistent with progression being manual.

## Architectural consequences

1. **No more hardcoded per-day movement lists.** `stepsForDay` currently
   hardcodes `['swing','tgu','pullover']` for Day A. Under the new model, Day A
   *is* a `Workout` object — its `coreWorkout` array defines which movements, in
   what order, with what transitions.
2. **One generic playback mechanism, chunked per section.** Split each of
   warmup/coreWorkout/cooldown into consecutive **timed runs** (`Timed` plans +
   `Transition`s, one continuous countdown, same as today's `SegmentTimer`) and
   **self-paced steps** (`Emom`/`RepsAndSets`/`Ladder`, each its own step, with
   any adjacent `Transition` shown as an "up next" beat). Chunking runs per
   section, not over one flattened array — recovery day keeps two separate runs,
   and progress dots keep their "Warm-up"/"Cool-down" titles.
3. **Settings becomes the workout editor — all three sections.** Core exercises
   keep per-format field editors (progressing = editing `currentPhase` +
   `nextPhase`; no automatic advancement). Warm-up/cool-down items additionally
   get an exercise picker (any movement from `MOVEMENTS`) and a format picker,
   so a cool-down item can become a loaded Good Morning — or a different
   exercise — whenever. None of it is logged.
4. **Movement identity for History/Progress**: `Movement.id` everywhere —
   renaming a movement in the editor no longer orphans its history.
5. **`transitionSeconds` and `countdownSeconds` both go away.** Per-item
   `Transition`s are authored in the default `Workout` data, editable
   per-workout; the beep lead is fixed at the components' 5s default.
   `WorkoutSettingsState` ends up as just `{ displayUnit }`.

## Movement-by-movement remap

| Movement | Format | variant | equipment | perSide | Notes |
| --- | --- | --- | --- | --- | --- |
| Swing | `Emom` | "Two-Hand" / "Single-Arm" | kettlebell | – | duration = minutes, targetReps = reps/min |
| TGU | `Emom` | "standard" / "3-second pause" | kettlebell | – | targetReps = 1; side-switching noted in description + cue, no flag |
| Pullover | `RepsAndSets` | "standard" | kettlebell | – | reps 10→15, sets fixed at 3 |
| Clean & Press | `Ladder` | "standard" | kettlebell | **true** | direction "down" |
| Squat | `Emom` | "Goblet" / "Single-Arm Front Rack" | kettlebell | – | same shape as Swing |
| Split Squat | `RepsAndSets` | one of 5 support-level strings | unset until final stage, then kettlebell | **true** | `phase.equipment !== undefined` replaces `movementUsesBell` |
| Warmup drills (5) | `Timed` | "standard" | none | – | no cues, coaching text in `phase.cue` |
| Sphinx (cooldown) | `Timed` | "standard" | none | – | no cues |
| 90/90 (cooldown) | `Timed` | "standard" | none | – | `cues: [60]` |
| Good Morning, unloaded | `Timed` | "standard" | none | – | part of the cooldown's timed run |
| Good Morning, loaded | `RepsAndSets` | "loaded" | kettlebell | – | not a default — author it in the editor when wanted; cool-down items are never logged |

Sentinel for "no real variant": `"standard"`. The variant strings shown per row
are that movement's `variantOptions` suggestions — stored on `Movement`, offered
under the editor's free-text variant input.

## Phases — typecheck + test after each

### Phase 0 — Lock the type shape

Final shape: `id` and `variantOptions` live on `Movement`, `perSide` on the base
format, no `alternateSides`. Staged in `betterTypes.ts` through Phases 0–2, then
merged into `types.ts` (single file, where `displayUnit` also lands) in Phase 3:

```ts
export interface Movement {
  id: string
  name: string
  description: string
  /** Variant suggestions (swing/squat styles, TGU pauses, split-squat levels) —
   *  offered under the editor's free-text variant input via a datalist */
  variantOptions?: Array<string>
}

export interface Equipment {
  name: string
  weightUnit: "lb" | "kg"
  weight: number
}

export interface BaseTrainingFormat {
  /** Technique/difficulty variant, e.g. "single-arm", "front-rack", "paused", or a split-squat support level */
  variant: string
  /** Coaching cue text for this specific variant */
  cue?: string
  equipment?: Equipment
  /** Raw rep count is doubled for target/volume math — done once per side/limb (e.g. ladder rungs, split-squat sets) */
  perSide?: boolean
}

export interface RepsAndSets extends BaseTrainingFormat {
  kind: "repsAndSets"
  reps: number
  sets: number
}

export interface Emom extends BaseTrainingFormat {
  kind: "emom"
  duration: number // whole minutes
  targetReps: number
}

export interface Timed extends BaseTrainingFormat {
  kind: "timed"
  duration: number // seconds
  cues: Array<number> // seconds into the duration to fire a switch/cue beep
}

export interface Ladder extends BaseTrainingFormat {
  kind: "ladder"
  ladderTop: number
  ladders: number
  direction: "up" | "down"
}

export type TrainingFormat = RepsAndSets | Emom | Timed | Ladder

export interface Transition {
  kind: "transition"
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
```

Also removes the `KbSwings`/`KbSwingsRepsPlan` illustrative sample — fixes the
pre-existing `tsc` error for free, since real data replaces it in Phase 1.

### Phase 1 — Additive data: `src/lib/movementData.ts`, touches nothing else

```ts
import { SPLIT_SQUAT_LEVELS } from './progression'
import type { DayId } from './types'
import type { Equipment, Movement, Transition, WorkoutItem, Workout } from './betterTypes'

/** Fresh object every call — equipment must not be a shared reference, since
 *  the workout editor (Phase 3) replaces it wholesale on every edit and two
 *  plans must never accidentally point at the same object. */
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

// One default cool-down (no loaded/unloaded pair) — making the Good Morning
// loaded, or swapping any warm-up/cool-down exercise for another, is an ordinary
// edit in Phase 3's editor. Cool-down items are never logged either way.
const COOLDOWN: Array<WorkoutItem> = [
  { exercise: MOVEMENTS.sphinx, currentPhase: { kind: 'timed', variant: 'standard', duration: 120, cues: [], cue: 'On your stomach, prop up on forearms. Gently extend the lower back.' } },
  transition(),
  { exercise: MOVEMENTS.ninetyNinety, currentPhase: { kind: 'timed', variant: 'standard', duration: 120, cues: [60], cue: 'Lean over the front shin, then rotate to the back at the beep.' } },
  transition(),
  { exercise: MOVEMENTS.goodMorning, currentPhase: { kind: 'timed', variant: 'standard', duration: 120, cues: [], cue: 'Sit wide-legged. Lower back perfectly arched, hinge forward slowly. Bodyweight — chase range of motion, not load.' } },
]

// nextPhase seeds reproduce what today's nextStepHint rules say comes next from
// the starting state; after that they're yours to maintain in the editor.
export const DEFAULT_WORKOUTS: Record<DayId, Workout> = {
  a: {
    warmup: WARMUP,
    coreWorkout: [
      {
        exercise: MOVEMENTS.swing,
        currentPhase: { kind: 'emom', variant: 'Two-Hand', duration: 10, targetReps: 10, equipment: kettlebell() },
        nextPhase: { kind: 'emom', variant: 'Two-Hand', duration: 11, targetReps: 10, equipment: kettlebell() },
      },
      transition(),
      {
        exercise: MOVEMENTS.tgu,
        currentPhase: { kind: 'emom', variant: 'standard', duration: 10, targetReps: 1, equipment: kettlebell(), cue: 'Alternate sides each minute.' },
        nextPhase: { kind: 'emom', variant: 'standard', duration: 12, targetReps: 1, equipment: kettlebell(), cue: 'Alternate sides each minute.' },
      },
      transition(),
      {
        exercise: MOVEMENTS.pullover,
        currentPhase: { kind: 'repsAndSets', variant: 'standard', reps: 10, sets: 3, equipment: kettlebell() },
        nextPhase: { kind: 'repsAndSets', variant: 'standard', reps: 11, sets: 3, equipment: kettlebell() },
      },
    ],
    cooldown: COOLDOWN,
  },
  b: {
    warmup: WARMUP,
    coreWorkout: [
      {
        exercise: MOVEMENTS.cleanPress,
        currentPhase: { kind: 'ladder', variant: 'standard', ladderTop: 3, ladders: 3, direction: 'down', equipment: kettlebell(), perSide: true },
        nextPhase: { kind: 'ladder', variant: 'standard', ladderTop: 3, ladders: 4, direction: 'down', equipment: kettlebell(), perSide: true },
      },
      transition(),
      {
        exercise: MOVEMENTS.squat,
        currentPhase: { kind: 'emom', variant: 'Goblet', duration: 10, targetReps: 6, equipment: kettlebell() },
        nextPhase: { kind: 'emom', variant: 'Goblet', duration: 11, targetReps: 6, equipment: kettlebell() },
      },
      transition(),
      {
        exercise: MOVEMENTS.splitSquat,
        currentPhase: { kind: 'repsAndSets', variant: SPLIT_SQUAT_LEVELS[0]!, reps: 5, sets: 5, perSide: true },
        nextPhase: { kind: 'repsAndSets', variant: SPLIT_SQUAT_LEVELS[1]!, reps: 5, sets: 5, perSide: true },
      },
    ],
    cooldown: COOLDOWN,
  },
  recovery: {
    warmup: WARMUP,
    coreWorkout: [],
    cooldown: COOLDOWN,
  },
}
```

`transition()` defaults to 5s, matching today's `transitionSeconds` default —
now baked into the data instead of a global setting, editable per-item in Phase
3's editor. Core movements get 5s transitions between them here too, shown as an
"up next" beat, even though today's app has no forced countdown there — cheap to
delete from the array in the editor if unwanted. The parity-test indices
(`coreWorkout[0]/[2]/[4]`) are unchanged.

### Phase 2 — Generic helpers: `src/lib/planText.ts`

```ts
import type { Emom, Ladder, RepsAndSets, TrainingFormat } from './betterTypes'

function ladderSequence(phase: Ladder): Array<number> {
  const asc = Array.from({ length: phase.ladderTop }, (_, i) => i + 1)
  return phase.direction === 'down' ? [...asc].reverse() : asc
}

export function ladderRungs(phase: Ladder): Array<{ ladder: number; reps: number }> {
  const sequence = ladderSequence(phase)
  const rungs: Array<{ ladder: number; reps: number }> = []
  for (let l = 1; l <= phase.ladders; l++) {
    for (const reps of sequence) rungs.push({ ladder: l, reps })
  }
  return rungs
}

/** Total reps the current phase asks for. Timed phases have no rep goal. */
export function targetReps(phase: TrainingFormat): number {
  const raw = (() => {
    switch (phase.kind) {
      case 'repsAndSets': return phase.reps * phase.sets
      case 'emom': return phase.targetReps * phase.duration
      case 'ladder': return ladderRungs(phase).reduce((sum, r) => sum + r.reps, 0)
      case 'timed': return 0
    }
  })()
  return phase.perSide ? raw * 2 : raw
}

export function formatTarget(movementName: string, phase: TrainingFormat): string {
  const prefix = phase.variant !== 'standard' ? `${phase.variant} ` : ''
  switch (phase.kind) {
    case 'repsAndSets':
      return `${prefix}${movementName} — ${phase.sets} sets × ${phase.reps} reps${phase.perSide ? ' per side' : ''}`
    case 'emom':
      return `${prefix}${movementName} — ${phase.targetReps} reps EMOM × ${phase.duration} min (${targetReps(phase)} total)`
    case 'ladder': {
      const shape = ladderSequence(phase).join('-')
      return `${prefix}${movementName} — ${shape} ladder × ${phase.ladders}${phase.perSide ? ' per side' : ''} (${targetReps(phase)} total)`
    }
    case 'timed':
      return `${prefix}${movementName} — ${phase.duration}s`
  }
}

export function emomRepsDone(phase: Emom, completedMs: number): number {
  const completedMinutes = Math.min(phase.duration, Math.floor(completedMs / 60_000))
  const raw = completedMinutes * phase.targetReps
  return phase.perSide ? raw * 2 : raw
}

export function repsAndSetsRepsDone(phase: RepsAndSets, completedSets: number): number {
  const raw = completedSets * phase.reps
  return phase.perSide ? raw * 2 : raw
}

export function ladderRepsDone(phase: Ladder, completedRungs: number): number {
  const raw = ladderRungs(phase).slice(0, completedRungs).reduce((sum, r) => sum + r.reps, 0)
  return phase.perSide ? raw * 2 : raw
}
```

Playback chunking (Consequence #2):

```ts
import type { Emom, ExerciseTrainingPlan, Ladder, RepsAndSets, Transition, WorkoutItem } from './betterTypes'

export interface TimedRunChunk {
  kind: 'timedRun'
  items: Array<WorkoutItem> // Timed plans + Transitions, in order
}

export interface SelfPacedChunk {
  kind: 'selfPaced'
  plan: ExerciseTrainingPlan<Emom | RepsAndSets | Ladder>
  /** A Transition immediately before this step, pulled out of the timed run to show as an "up next" beat */
  upNext?: Transition
}

export type PlaybackChunk = TimedRunChunk | SelfPacedChunk

export function chunkWorkoutItems(items: Array<WorkoutItem>): Array<PlaybackChunk> {
  const chunks: Array<PlaybackChunk> = []
  let run: Array<WorkoutItem> = []

  const flushRun = () => {
    if (run.length > 0) chunks.push({ kind: 'timedRun', items: run })
    run = []
  }

  for (const item of items) {
    const isSelfPaced = 'currentPhase' in item && item.currentPhase.kind !== 'timed'
    if (!isSelfPaced) {
      run.push(item)
      continue
    }
    const last = run[run.length - 1]
    const upNext = last && !('currentPhase' in last) ? (run.pop() as Transition) : undefined
    flushRun()
    chunks.push({ kind: 'selfPaced', plan: item as ExerciseTrainingPlan<Emom | RepsAndSets | Ladder>, upNext })
  }
  flushRun()
  return chunks
}
```

`'currentPhase' in item` distinguishes `ExerciseTrainingPlan` from `Transition`
without a shared discriminant — the two shapes don't overlap, so TypeScript
narrows cleanly on that check.

Parity test — `src/lib/planText.test.ts`. Proves the numbers match
`progression.test.ts`'s known-good values before Phase 4 deletes the old code.
Scope is numeric parity only; display strings are allowed to read differently:

```ts
import { describe, expect, it } from 'vitest'
import { emomRepsDone, ladderRepsDone, repsAndSetsRepsDone, targetReps } from './planText'
import { DEFAULT_WORKOUTS } from './movementData'
import type { Emom, Ladder, RepsAndSets } from './betterTypes'

const swing = DEFAULT_WORKOUTS.a.coreWorkout[0]!.currentPhase as Emom // 10 reps/min × 10 min
const tgu = DEFAULT_WORKOUTS.a.coreWorkout[2]!.currentPhase as Emom // 1 rep/min × 10 min
const pullover = DEFAULT_WORKOUTS.a.coreWorkout[4]!.currentPhase as RepsAndSets // 3 × 10
const cleanPress = DEFAULT_WORKOUTS.b.coreWorkout[0]!.currentPhase as Ladder // 3-2-1 × 3, perSide
const squat = DEFAULT_WORKOUTS.b.coreWorkout[2]!.currentPhase as Emom // 6 reps/min × 10 min
const splitSquat = DEFAULT_WORKOUTS.b.coreWorkout[4]!.currentPhase as RepsAndSets // 5×5, perSide

describe('targetReps parity with progression.test.ts DEFAULT_PROGRESSION', () => {
  it('swing: 10 × 10 = 100', () => expect(targetReps(swing)).toBe(100))
  it('tgu: 1 × 10 = 10', () => expect(targetReps(tgu)).toBe(10))
  it('pullover: 10 × 3 = 30', () => expect(targetReps(pullover)).toBe(30))
  it('cleanPress: (3+2+1) × 3 × 2 = 36', () => expect(targetReps(cleanPress)).toBe(36))
  it('squat: 6 × 10 = 60', () => expect(targetReps(squat)).toBe(60))
  it('splitSquat: 5 × 5 × 2 = 50', () => expect(targetReps(splitSquat)).toBe(50))
})

describe('reps-done parity', () => {
  it('emomRepsDone: 8 completed minutes of a 10/min EMOM = 80', () => {
    expect(emomRepsDone(swing, 8 * 60_000)).toBe(80)
  })
  it('ladderRepsDone: first 2 rungs of 3-2-1 (perSide) = (3+2) × 2 = 10', () => {
    expect(ladderRepsDone(cleanPress, 2)).toBe(10)
  })
  it('repsAndSetsRepsDone: 3 completed sets of splitSquat (perSide) = 3 × 5 × 2 = 30', () => {
    expect(repsAndSetsRepsDone(splitSquat, 3)).toBe(30)
  })
})
```

### Phase 3 — Swap the store + update every consumer together

One atomic milestone (TS is whole-program) — green at the end.

**types.ts — becomes the single merged type file.** Phase 0's locked shape moves
in verbatim (Movement, Equipment, the four formats, Transition,
ExerciseTrainingPlan, WorkoutItem, Workout); imports in
`movementData.ts`/`planText.ts` flip from `./betterTypes` to `./types`; and
`betterTypes.ts` is deleted — one type file from here on. Plus the app types:

```ts
export type DayId = 'a' | 'b' | 'recovery'
export type WeightUnit = 'kg' | 'lb'

export interface WorkoutSettingsState {
  /** Progress display unit — totals convert from each entry's recorded unit.
   *  (countdownSeconds is gone; the beep lead is fixed at the components' 5s default.) */
  displayUnit: WeightUnit
}

export interface MovementResult {
  /** Movement.id, not a closed union anymore */
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
```

**store.ts**

```ts
import { Store } from '@tanstack/store'
import { DEFAULT_WORKOUTS } from './movementData'
import { formatTarget, targetReps } from './planText'
import type { DayId, Emom, Ladder, RepsAndSets, Workout, WorkoutLogEntry, WorkoutSettingsState } from './types'

// No back-compat: keys keep their names only because there's no reason to touch
// them — no migrations, no legacy bell seeding. Stored data that doesn't parse
// into the new shapes falls back to defaults.
const WORKOUTS_KEY = 'workout-tracker:workouts:v1'
const HISTORY_KEY = 'workout-tracker:history:v1'
const SETTINGS_KEY = 'workout-tracker:settings:v1'

export const DEFAULT_WORKOUT_SETTINGS: WorkoutSettingsState = { displayUnit: 'kg' }

// load()/loadHistory() unchanged from today's implementation

export const workoutsStore = new Store<Record<DayId, Workout>>(load(WORKOUTS_KEY, DEFAULT_WORKOUTS))
export const historyStore = new Store<Array<WorkoutLogEntry>>(loadHistory())
export const settingsStore = new Store<WorkoutSettingsState>(load(SETTINGS_KEY, DEFAULT_WORKOUT_SETTINGS))

// subscribe() persistence blocks unchanged, minus bellStore

export function setWorkout(day: DayId, workout: Workout): void {
  workoutsStore.setState((w) => ({ ...w, [day]: workout }))
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

/** Results only ever come from core-workout steps — warm-up/cool-down are never logged. */
export function saveWorkout(day: DayId, results: Array<LoggedResult>): void {
  const entry: WorkoutLogEntry = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    day,
    results: results.map((r) => {
      const goal = targetReps(r.phase)
      return {
        movement: r.movementId,
        target: formatTarget(r.movementName, r.phase),
        hit: r.repsDone >= goal,
        targetReps: goal,
        repsDone: r.repsDone,
        weight: r.phase.equipment?.weight ?? 0,
        unit: r.phase.equipment?.weightUnit,
      }
    }),
  }
  historyStore.setState((h) => [entry, ...h])
  // No auto-advance — progression is edited directly on /settings.
}

export function deleteWorkout(id: string): void {
  historyStore.setState((h) => h.filter((e) => e.id !== id))
}

export function resetAllData(): void {
  workoutsStore.setState(() => DEFAULT_WORKOUTS)
  historyStore.setState(() => [])
}
```

**session.$day.tsx — steps come from chunking the day's Workout**

```tsx
type SectionLabel = 'Warm-up' | 'Core Workout' | 'Cool-down'

/** Chunk each section separately — flattening first merged recovery day's
 *  warm-up + cool-down into one run and lost the section titles on the progress dots. */
function sectionChunks(workout: Workout): Array<{ section: SectionLabel; chunk: PlaybackChunk }> {
  const sections: Array<[SectionLabel, Array<WorkoutItem>]> = [
    ['Warm-up', workout.warmup ?? []],
    ['Core Workout', workout.coreWorkout],
    ['Cool-down', workout.cooldown ?? []],
  ]
  return sections.flatMap(([section, items]) =>
    chunkWorkoutItems(items).map((chunk) => ({ section, chunk })),
  )
}

type Step = { kind: 'chunk'; section: SectionLabel; chunk: PlaybackChunk } | { kind: 'save' }

function Session({ day }: { day: DayId }) {
  const navigate = useNavigate()
  const workouts = useStore(workoutsStore)
  const workout = workouts[day]
  const steps: Array<Step> = [
    ...sectionChunks(workout).map(({ section, chunk }) => ({ kind: 'chunk' as const, section, chunk })),
    { kind: 'save' as const },
  ]

  const [stepIdx, setStepIdx] = useState(0)
  const [results, setResults] = useState<Record<string, LoggedResult>>({})
  const [timerDone, setTimerDone] = useState<Record<number, boolean>>({})
  const [saved, setSaved] = useState(false)
  const step = steps[stepIdx]!
  const markTimerDone = () => setTimerDone((t) => ({ ...t, [stepIdx]: true }))

  // Only core steps record reps — warm-up/cool-down run their tracker
  // but never log, so they don't gate Next on entering a result either.
  const canAdvance = (() => {
    if (step.kind === 'save') return false
    if (step.chunk.kind === 'selfPaced' && step.section === 'Core Workout')
      return results[step.chunk.plan.exercise.id] !== undefined
    return true
  })()

  return (
    <div className="space-y-6">
      {/* header + progress dots: same structure as today — timed runs titled by their
          section label ('Warm-up' / 'Cool-down'), self-paced steps by exercise name */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        {step.kind === 'chunk' && step.chunk.kind === 'timedRun' && (
          <TimedRun items={step.chunk.items} onDone={markTimerDone} />
        )}
        {step.kind === 'chunk' && step.chunk.kind === 'selfPaced' && (
          <SelfPacedStep
            plan={step.chunk.plan}
            logged={step.section === 'Core Workout'}
            result={results[step.chunk.plan.exercise.id]?.repsDone}
            timerDone={!!timerDone[stepIdx]}
            onTimerDone={markTimerDone}
            onResult={(repsDone) =>
              setResults((r) => ({
                ...r,
                [step.chunk.plan.exercise.id]: {
                  movementId: step.chunk.plan.exercise.id,
                  movementName: step.chunk.plan.exercise.name,
                  phase: step.chunk.plan.currentPhase,
                  repsDone,
                },
              }))
            }
          />
        )}
        {step.kind === 'save' && (
          <SaveStep
            day={day}
            results={results}
            saved={saved}
            onSave={() => {
              saveWorkout(day, Object.values(results))
              setSaved(true)
              void navigate({ to: '/' })
            }}
          />
        )}
      </section>
      {/* footer Back/Next: unchanged */}
    </div>
  )
}

function SelfPacedStep({ plan, logged, result, timerDone, onTimerDone, onResult }: {
  plan: ExerciseTrainingPlan<Emom | RepsAndSets | Ladder>
  /** Core-workout steps record reps; warm-up/cool-down steps just run their tracker */
  logged: boolean
  result: number | undefined
  timerDone: boolean
  onTimerDone: () => void
  onResult: (repsDone: number) => void
}) {
  const { exercise, currentPhase, nextPhase } = plan
  const goal = targetReps(currentPhase)
  const record = (repsDone: number) => { if (logged) onResult(repsDone); onTimerDone() }

  return (
    <div>
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">{exercise.name}</p>
        <p className="mt-1 text-lg font-bold">{formatTarget(exercise.name, currentPhase)}</p>
        {currentPhase.cue && <p className="text-sm text-zinc-500">{currentPhase.cue}</p>}
        {/* the nextStepHint replacement — shows only when a next phase is authored */}
        {nextPhase && <p className="text-sm text-zinc-500">Next: {formatTarget(exercise.name, nextPhase)}</p>}
      </div>

      {currentPhase.kind === 'emom' && (
        <EmomTimer
          totalMinutes={currentPhase.duration}
          repsText={`${currentPhase.targetReps} reps`}
          onDone={(ms) => record(emomRepsDone(currentPhase, ms))}
        />
      )}
      {currentPhase.kind === 'repsAndSets' && (
        <SetTracker
          sets={currentPhase.sets}
          repsText={`${currentPhase.reps} reps${currentPhase.perSide ? ' per side' : ''}`}
          onDone={(completed) => record(repsAndSetsRepsDone(currentPhase, completed))}
        />
      )}
      {currentPhase.kind === 'ladder' && (
        <LadderTracker
          rungs={ladderRungs(currentPhase)}
          onDone={(completed) => record(ladderRepsDone(currentPhase, completed))}
        />
      )}

      {logged && (timerDone || result !== undefined ? (
        <RepsCheck targetReps={goal} value={result} onChange={onResult} />
      ) : (
        <p className="pt-2 text-center text-sm text-zinc-500">
          Finish (or end) the timer to record how many reps you completed.
        </p>
      ))}
    </div>
  )
}
```

`TimedRun` (new component, replaces `SegmentTimer`) is a mostly mechanical port —
but not of `buildSegmentPhases` itself: that function inserts one uniform, global
`transitionSeconds` between every pair of segments, while the new model has
explicit per-item `Transition`s with their own durations. It's replaced by an
item-driven builder — `buildItemPhases(items)`: `Timed` → work phase,
`Transition` → transition phase, same output shape. `phaseAtElapsedSeconds`,
`buildSegmentSwitchPoints`, and SegmentTimer's beep/countdown/skip/render logic
port unchanged (minus the `countdownSeconds` prop — the 5s default becomes the
only behavior). Field mapping:

| Old (TimerSegment) | New (WorkoutItem, filtered to Timed + Transition) |
| --- | --- |
| `name` | `exercise.name` (Transitions get no name — shown as "Get ready") |
| `cue` | `currentPhase.cue` |
| `seconds` | `currentPhase.duration` (Timed) / `seconds` (Transition) |
| `switchTimes` | `currentPhase.cues` |
| `switchLabel` | dropped — generic "Part N of M" wording, no per-segment override |

**settings.tsx — becomes a per-day workout editor, all three sections.** Base
fields (variant + equipment) render once per exercise since every format shares
them; per-format components handle only their own numbers. Warm-up/cool-down
items add exercise and format pickers on top — that's the whole "loaded Good
Morning" story now:

```tsx
function Settings() {
  const workouts = useStore(workoutsStore)
  const [day, setDay] = useState<DayId>('a')
  const workout = workouts[day]

  const updateSection = (section: keyof Workout, index: number, next: WorkoutItem) => {
    const items = (workout[section] ?? []).map((item, i) => (i === index ? next : item))
    setWorkout(day, { ...workout, [section]: items })
  }

  return (
    <div className="space-y-6">
      <DayTabs value={day} onChange={setDay} />
      {/* All three sections are editable. Warm-up/cool-down items are swappable —
          any movement, any format; core items keep phase editing only. Logging is
          unaffected either way: core-only. */}
      {(['warmup', 'coreWorkout', 'cooldown'] as const).map((section) => (
        <SectionEditor
          key={section}
          title={SECTION_TITLES[section]}
          items={workout[section] ?? []}
          swappable={section !== 'coreWorkout'}
          onChange={(i, next) => updateSection(section, i, next)}
        />
      ))}
      {/* danger zone: unchanged. countdownSeconds is gone; displayUnit lives on Progress */}
    </div>
  )
}

function SectionEditor({ title, items, swappable, onChange }: {
  title: string
  items: Array<WorkoutItem>
  swappable: boolean
  onChange: (index: number, next: WorkoutItem) => void
}) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="font-bold text-emerald-400">{title}</p>
      {items.map((item, i) =>
        'currentPhase' in item ? (
          <ExercisePlanEditor key={`${item.exercise.id}-${i}`} plan={item} swappable={swappable}
            onChange={(next) => onChange(i, next)} />
        ) : (
          <TransitionEditor key={`t${i}`} transition={item} onChange={(next) => onChange(i, next)} />
        ),
      )}
    </section>
  )
}

function ExercisePlanEditor({ plan, swappable, onChange }: {
  plan: ExerciseTrainingPlan<TrainingFormat>
  swappable: boolean
  onChange: (next: ExerciseTrainingPlan<TrainingFormat>) => void
}) {
  const { exercise, currentPhase } = plan
  const replacePhase = (next: TrainingFormat) => onChange({ ...plan, currentPhase: next })

  return (
    <div className="border-b border-zinc-800 py-3 last:border-b-0">
      {swappable ? (
        <div className="flex flex-wrap items-center gap-3">
          <MovementSelect value={exercise.id}
            onChange={(id) => onChange({ ...plan, exercise: MOVEMENTS[id]! })} />
          <FormatSelect value={currentPhase.kind}
            onChange={(kind) => replacePhase(defaultPhase(kind, currentPhase))} />
        </div>
      ) : (
        <p className="font-bold">{exercise.name}</p>
      )}
      <p className="mb-3 text-sm text-zinc-500">{formatTarget(exercise.name, currentPhase)}</p>

      {/* base fields shared by all formats */}
      <VariantInput value={currentPhase.variant} suggestions={exercise.variantOptions}
        onChange={(variant) => replacePhase({ ...currentPhase, variant })} />
      <EquipmentFields phase={currentPhase} onChange={replacePhase} />

      {/* per-format numeric fields */}
      {currentPhase.kind === 'emom' && <EmomPhaseFields phase={currentPhase} onChange={replacePhase} />}
      {currentPhase.kind === 'repsAndSets' && <RepsAndSetsPhaseFields phase={currentPhase} onChange={replacePhase} />}
      {currentPhase.kind === 'ladder' && <LadderPhaseFields phase={currentPhase} onChange={replacePhase} />}
      {currentPhase.kind === 'timed' && <TimedPhaseFields phase={currentPhase} onChange={replacePhase} />}

      {/* the next-step hint's source of truth — same field components, bound to nextPhase */}
      <NextPhaseFields plan={plan} onChange={onChange} />
    </div>
  )
}

/** Free text with suggestions (not a dropdown) — a datalist keeps it typeable */
function VariantInput({ value, suggestions, onChange }: {
  value: string
  suggestions: Array<string> | undefined
  onChange: (variant: string) => void
}) {
  const listId = useId()
  return (
    <label className="flex items-center gap-2 text-sm">
      Variant
      <input className={textInput} value={value} list={suggestions ? listId : undefined}
        onChange={(e) => onChange(e.target.value)} />
      {suggestions && (
        <datalist id={listId}>
          {suggestions.map((v) => <option key={v} value={v} />)}
        </datalist>
      )}
    </label>
  )
}

function EmomPhaseFields({ phase, onChange }: { phase: Emom; onChange: (next: Emom) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <label className="flex items-center gap-2 text-sm">
        Reps/min
        <input type="number" min={1} className={numberInput} value={phase.targetReps}
          onChange={(e) => onChange({ ...phase, targetReps: clampMin(e.target.valueAsNumber || 1, 1) })} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        Minutes
        <input type="number" min={1} className={numberInput} value={phase.duration}
          onChange={(e) => onChange({ ...phase, duration: clampMin(e.target.valueAsNumber || 1, 1) })} />
      </label>
    </div>
  )
}
```

Helpers not shown: `MovementSelect` is a select over the `MOVEMENTS` table;
`FormatSelect` switches `currentPhase.kind`, with `defaultPhase(kind, prev)`
keeping `variant`/`cue`/`equipment` and filling the new format's numeric fields
with sensible starters — picking "reps & sets" on the cool-down Good Morning and
ticking "Uses kettlebell" *is* the old loaded toggle; `EquipmentFields` is the
"Uses kettlebell" checkbox + weight input, hoisted out of the per-format
components since `equipment` is a base field; `NextPhaseFields` renders the same
per-format fields bound to `plan.nextPhase` behind an "Edit next phase"
disclosure (with a clear button to unset it) — that's where the "Next: …" hint
comes from. `RepsAndSetsPhaseFields`/`LadderPhaseFields`/`TimedPhaseFields`
follow `EmomPhaseFields`' ~15-line pattern.

**Smaller, brief diffs**

- **index.tsx** — "Current Targets" cards walk *both* days' `coreWorkout`
  (Day A and Day B as two labeled groups) and call `formatTarget` per item — not
  just today's day: `suggestedDay()` returns `'rest'` on Sat/Sun, so indexing
  `workoutsStore.state[today]` would crash on weekends, and today's Home shows
  all six movements anyway. Each card shows a dim "Next: …" via
  `formatTarget(name, plan.nextPhase)` when a next phase exists.
- **progress.tsx / history.tsx** — `BELL_MOVEMENTS`/`MOVEMENT_NAMES` lookups
  replaced by reading `MOVEMENTS` from `movementData.ts`, with an id fallback
  (`MOVEMENTS[id]?.name ?? id`); `bell.unit` replaced by `settings.displayUnit`,
  with a kg/lb toggle right on the Progress page (persisted via
  `setWorkoutSettings`) — totals convert from each entry's recorded unit through
  the existing `convertWeight()`, verified, no `volume.ts` changes; grouping key
  becomes `result.movement`. The movement filter offers only ids that actually
  appear in history, and the header copy drops "reps × bell weight (16 kg
  today)" since there's no single current bell.
- **plan.tsx** — `WARMUP_SEGMENTS`/`cooldownSegments(false)` replaced by reading
  `DEFAULT_WORKOUTS`'s warmup/cooldown arrays directly (read-only reference
  content, no store needed).

### Phase 4 — Delete dead code

Old per-movement state interfaces, `ProgressionState`, `TimerSegment`,
`progression.ts`'s bespoke functions (including `nextStepHint`, replaced by
`nextPhase` rendering, and `movementUsesBell`), `bellStore`, the
`countdownSeconds` setting UI and `countdownSeconds` props at call sites,
`WARMUP_SEGMENTS`/`cooldownSegments`, `switchLabel` from
`SegmentTimer`/`segmentPhases.ts`, `MovementId` union, stale
`progression.test.ts` assertions (superseded by `planText.test.ts`).
`betterTypes.ts` is already gone — Phase 3 merged it into `types.ts`. Also
`segmentPhases.test.ts`: its `buildSegmentPhases` cases are rewritten against
`buildItemPhases`; the `phaseAtElapsedSeconds`/switch-point cases keep passing
as-is.

### Phase 5 — Manual smoke test

`npm run dev`; walk Day A, Day B, and Recovery sessions (including a transition
between two core movements, to exercise the new chunking path); in the editor,
change a core phase and swap a cool-down exercise's movement and format (e.g.
make the Good Morning a loaded reps&sets with the bell) — then run that
cool-down and confirm it plays as a self-paced step and does *not* appear in
History/Progress; check the "Next: …" hint on Home; flip the Progress kg/lb
toggle and confirm totals convert.

## Verification

- Baseline before Phase 0 (verified): `tsc` reports exactly one error (the
  unused `KbSwingsRepsPlan` sample Phase 0 deletes) and all 40 tests pass — so
  any new error or failure during the migration is the migration's.
- `npx tsc --noEmit` and `npx vitest run` green at the end of every phase.
- Phase 2's `planText.test.ts` is the safety net before Phase 4 deletes the old
  implementation — numeric parity only, not string parity.
- Phase 5 manual walkthrough (no automated UI tests in this repo).
