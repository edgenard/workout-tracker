import { useId, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { MOVEMENTS } from '#/lib/movementData'
import { DAY_INFO } from '#/lib/plan'
import { formatTarget } from '#/lib/planText'
import { resetAllData, setWorkout, workoutsStore } from '#/lib/store'
import type { DayId, ExerciseTrainingPlan, TrainingFormat, Workout, WorkoutItem } from '#/lib/types'

export const Route = createFileRoute('/settings')({ component: Settings, ssr: false })

const numberInput = 'w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-center font-semibold'
const textInput = 'min-w-48 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-semibold'
const selectInput = 'rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-semibold'
const sectionTitles: Record<keyof Workout, string> = { warmup: 'Warm-up', coreWorkout: 'Core Workout', cooldown: 'Cool-down' }

function positive(value: number, minimum = 1): number {
  return Math.max(minimum, Math.round(value || minimum))
}

function baseFrom(phase: TrainingFormat) {
  return { variant: phase.variant, cue: phase.cue, equipment: phase.equipment, perSide: phase.perSide }
}

function defaultPhase(kind: TrainingFormat['kind'], previous: TrainingFormat): TrainingFormat {
  const base = baseFrom(previous)
  switch (kind) {
    case 'emom': return { ...base, kind, duration: 10, targetReps: 5 }
    case 'repsAndSets': return { ...base, kind, reps: 10, sets: 3 }
    case 'ladder': return { ...base, kind, ladderTop: 3, ladders: 3, direction: 'down' }
    case 'timed': return { ...base, kind, duration: 60, cues: [] }
  }
}

function Settings() {
  const workouts = useStore(workoutsStore)
  const [day, setDay] = useState<DayId>('a')
  const workout = workouts[day]
  const updateSection = (section: keyof Workout, index: number, next: WorkoutItem) => {
    const items = (workout[section] ?? []).map((item, itemIndex) => itemIndex === index ? next : item)
    setWorkout(day, { ...workout, [section]: items })
  }
  const removeItem = (section: keyof Workout, index: number) => {
    setWorkout(day, { ...workout, [section]: (workout[section] ?? []).filter((_, itemIndex) => itemIndex !== index) })
  }
  const appendItem = (section: keyof Workout, item: WorkoutItem) => {
    setWorkout(day, { ...workout, [section]: [...(workout[section] ?? []), item] })
  }

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-black">Workout Settings</h1><p className="mt-2 text-zinc-400">Edit the workout you want to run. Progression is manual; changes save in this browser.</p></div>
    <div className="flex overflow-hidden rounded-xl border border-zinc-700">
      {(['a', 'b', 'recovery'] as const).map((id) => <button key={id} type="button" className={`flex-1 px-4 py-2 font-semibold ${day === id ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:bg-zinc-800'}`} onClick={() => setDay(id)}>{DAY_INFO[id].title}</button>)}
    </div>
    {(['warmup', 'coreWorkout', 'cooldown'] as const).map((section) => <SectionEditor key={section} title={sectionTitles[section]} items={workout[section] ?? []} swappable={section !== 'coreWorkout'} onChange={(index, next) => updateSection(section, index, next)} onRemove={(index) => removeItem(section, index)} onAddTransition={() => appendItem(section, { kind: 'transition', seconds: 5 })} onAddExercise={section === 'coreWorkout' ? undefined : () => appendItem(section, { exercise: MOVEMENTS.goodMorning, currentPhase: { kind: 'timed', variant: 'standard', duration: 60, cues: [] } })} />)}
    <section className="rounded-2xl border border-rose-900/60 bg-zinc-900 p-4"><p className="font-bold text-rose-400">Danger zone</p><p className="mb-3 text-sm text-zinc-500">Reset workouts and history to defaults.</p><button type="button" className="rounded-lg border border-rose-800 px-4 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-950" onClick={() => { if (window.confirm('Reset all workout settings and history?')) resetAllData() }}>Reset all data</button></section>
  </div>
}

function SectionEditor({ title, items, swappable, onChange, onRemove, onAddTransition, onAddExercise }: { title: string; items: Array<WorkoutItem>; swappable: boolean; onChange: (index: number, next: WorkoutItem) => void; onRemove: (index: number) => void; onAddTransition: () => void; onAddExercise: (() => void) | undefined }) {
  return <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
    <p className="font-bold text-emerald-400">{title}</p>
    {items.length === 0 && <p className="mt-2 text-sm text-zinc-500">No items.</p>}
    {items.map((item, index) => <div key={'currentPhase' in item ? `${item.exercise.id}-${index}` : `transition-${index}`} className="relative pr-16">{'currentPhase' in item
      ? <ExercisePlanEditor plan={item} swappable={swappable} onChange={(next) => onChange(index, next)} />
      : <TransitionEditor seconds={item.seconds} onChange={(seconds) => onChange(index, { kind: 'transition', seconds })} />}<button type="button" className="absolute right-0 top-4 text-xs text-rose-400" onClick={() => onRemove(index)}>Remove</button></div>)}
    <div className="mt-3 flex gap-2"><button type="button" className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm font-semibold hover:bg-zinc-800" onClick={onAddTransition}>Add transition</button>{onAddExercise && <button type="button" className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm font-semibold hover:bg-zinc-800" onClick={onAddExercise}>Add exercise</button>}</div>
  </section>
}

function TransitionEditor({ seconds, onChange }: { seconds: number; onChange: (seconds: number) => void }) {
  return <div className="border-b border-zinc-800 py-3 last:border-b-0"><label className="flex items-center gap-2 text-sm text-zinc-400">Transition <input type="number" min={0} max={300} className={numberInput} value={seconds} onChange={(event) => onChange(Math.min(300, positive(event.target.valueAsNumber, 0)))} /> seconds</label></div>
}

function ExercisePlanEditor({ plan, swappable, onChange }: { plan: ExerciseTrainingPlan<TrainingFormat>; swappable: boolean; onChange: (next: ExerciseTrainingPlan<TrainingFormat>) => void }) {
  const { exercise, currentPhase } = plan
  const replacePhase = (next: TrainingFormat) => onChange({ ...plan, currentPhase: next })
  return <div className="border-b border-zinc-800 py-4 last:border-b-0">
    {swappable ? <div className="flex flex-wrap items-center gap-3"><MovementSelect value={exercise.id} onChange={(id) => { const movement = Object.values(MOVEMENTS).find((candidate) => candidate.id === id); if (movement) onChange({ ...plan, exercise: movement }) }} /><FormatSelect value={currentPhase.kind} onChange={(kind) => replacePhase(defaultPhase(kind, currentPhase))} /></div> : <p className="font-bold">{exercise.name}</p>}
    <p className="mb-3 mt-1 text-sm text-zinc-500">{formatTarget(exercise.name, currentPhase)}</p>
    <PhaseEditor phase={currentPhase} suggestions={exercise.variantOptions} onChange={replacePhase} />
    <details className="mt-4 rounded-lg border border-zinc-800 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-zinc-300">Edit next phase</summary>
      <div className="mt-3">
        {plan.nextPhase ? <><div className="mb-3 flex flex-wrap items-center gap-3"><FormatSelect value={plan.nextPhase.kind} onChange={(kind) => onChange({ ...plan, nextPhase: defaultPhase(kind, plan.nextPhase!) })} /><button type="button" className="text-sm text-rose-400" onClick={() => { const { nextPhase: _removed, ...rest } = plan; onChange(rest) }}>Clear next phase</button></div><PhaseEditor phase={plan.nextPhase} suggestions={exercise.variantOptions} onChange={(nextPhase) => onChange({ ...plan, nextPhase })} /></> : <button type="button" className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm font-semibold hover:bg-zinc-800" onClick={() => onChange({ ...plan, nextPhase: { ...currentPhase, equipment: currentPhase.equipment ? { ...currentPhase.equipment } : undefined } })}>Add next phase</button>}
      </div>
    </details>
  </div>
}

function MovementSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return <label className="flex items-center gap-2 text-sm">Exercise <select className={selectInput} value={value} onChange={(event) => onChange(event.target.value)}>{Object.values(MOVEMENTS).map((movement) => <option key={movement.id} value={movement.id}>{movement.name}</option>)}</select></label>
}

function FormatSelect({ value, onChange }: { value: TrainingFormat['kind']; onChange: (kind: TrainingFormat['kind']) => void }) {
  return <label className="flex items-center gap-2 text-sm">Format <select className={selectInput} value={value} onChange={(event) => onChange(event.target.value as TrainingFormat['kind'])}><option value="timed">Timed</option><option value="emom">EMOM</option><option value="repsAndSets">Reps & sets</option><option value="ladder">Ladder</option></select></label>
}

function VariantInput({ value, suggestions, onChange }: { value: string; suggestions: readonly string[] | undefined; onChange: (variant: string) => void }) {
  const listId = useId()
  return <label className="flex items-center gap-2 text-sm">Variant <input className={textInput} value={value} list={suggestions ? listId : undefined} onChange={(event) => onChange(event.target.value)} />{suggestions && <datalist id={listId}>{suggestions.map((variant) => <option key={variant} value={variant} />)}</datalist>}</label>
}

function PhaseEditor({ phase, suggestions, onChange }: { phase: TrainingFormat; suggestions: readonly string[] | undefined; onChange: (next: TrainingFormat) => void }) {
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-4"><VariantInput value={phase.variant} suggestions={suggestions} onChange={(variant) => onChange({ ...phase, variant })} /><label className="flex min-w-72 flex-1 items-center gap-2 text-sm">Cue <input className={`${textInput} flex-1`} value={phase.cue ?? ''} onChange={(event) => onChange({ ...phase, cue: event.target.value || undefined })} /></label></div>
    <EquipmentFields phase={phase} onChange={onChange} />
    <div className="flex flex-wrap items-center gap-4">
      {phase.kind === 'emom' && <><NumberField label="Reps/min" value={phase.targetReps} onChange={(targetReps) => onChange({ ...phase, targetReps })} /><NumberField label="Minutes" value={phase.duration} onChange={(duration) => onChange({ ...phase, duration })} /></>}
      {phase.kind === 'repsAndSets' && <><NumberField label="Reps" value={phase.reps} onChange={(reps) => onChange({ ...phase, reps })} /><NumberField label="Sets" value={phase.sets} onChange={(sets) => onChange({ ...phase, sets })} /></>}
      {phase.kind === 'ladder' && <><NumberField label="Ladder top" value={phase.ladderTop} onChange={(ladderTop) => onChange({ ...phase, ladderTop })} /><NumberField label="Ladders" value={phase.ladders} onChange={(ladders) => onChange({ ...phase, ladders })} /><label className="flex items-center gap-2 text-sm">Direction <select className={selectInput} value={phase.direction} onChange={(event) => onChange({ ...phase, direction: event.target.value as 'up' | 'down' })}><option value="down">Down</option><option value="up">Up</option></select></label></>}
      {phase.kind === 'timed' && <><NumberField label="Seconds" value={phase.duration} onChange={(duration) => onChange({ ...phase, duration })} /><label className="flex items-center gap-2 text-sm">Cue beeps <input className={textInput} placeholder="e.g. 30, 60" value={phase.cues.join(', ')} onChange={(event) => onChange({ ...phase, cues: event.target.value.split(',').map(Number).filter((value) => Number.isFinite(value) && value > 0) })} /></label></>}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!phase.perSide} onChange={(event) => onChange({ ...phase, perSide: event.target.checked || undefined })} /> Per side</label>
    </div>
  </div>
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="flex items-center gap-2 text-sm">{label}<input type="number" min={1} className={numberInput} value={value} onChange={(event) => onChange(positive(event.target.valueAsNumber))} /></label>
}

function EquipmentFields({ phase, onChange }: { phase: TrainingFormat; onChange: (next: TrainingFormat) => void }) {
  const equipment = phase.equipment
  return <div className="flex flex-wrap items-center gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!equipment} onChange={(event) => onChange({ ...phase, equipment: event.target.checked ? { name: 'Kettlebell', weight: 16, weightUnit: 'kg' } : undefined })} /> Uses kettlebell</label>{equipment && <><label className="flex items-center gap-2 text-sm">Weight <input type="number" min={1} className={numberInput} value={equipment.weight} onChange={(event) => onChange({ ...phase, equipment: { ...equipment, weight: positive(event.target.valueAsNumber) } })} /></label><label className="flex items-center gap-2 text-sm">Unit <select className={selectInput} value={equipment.weightUnit} onChange={(event) => onChange({ ...phase, equipment: { ...equipment, weightUnit: event.target.value as 'kg' | 'lb' } })}><option value="kg">kg</option><option value="lb">lb</option></select></label></>}</div>
}
