import type { Equipment, MovementResult, WeightUnit, WorkoutLogEntry } from './types'

const KG_PER_LB = 0.45359237

export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value
  return from === 'kg' ? value / KG_PER_LB : value * KG_PER_LB
}

export type ProgressKind = 'bodyweight' | 'weighted'

export interface ProgressValue {
  key: string
  kind: ProgressKind
  value: number
}

/** Persist enough load information to classify progress without changing workout domain types. */
export function recordedLoad(
  equipment: Equipment | undefined,
): Pick<MovementResult, 'weight' | 'unit'> {
  return { weight: equipment?.weight ?? 0, unit: equipment?.weightUnit }
}

/** Project a logged domain result into the tracking-only identity and metric. */
export function progressValue(
  result: MovementResult,
  displayUnit: WeightUnit,
): ProgressValue | null {
  if (result.repsDone === undefined || result.weight === undefined) return null

  const kind: ProgressKind = result.weight > 0 ? 'weighted' : 'bodyweight'
  return {
    // Split squats change from bodyweight to loaded work as they progress. Keep
    // those incomparable metrics on separate charts without changing movement IDs.
    key: result.movement === 'splitSquat' ? `${result.movement}:${kind}` : result.movement,
    kind,
    value:
      kind === 'bodyweight'
        ? result.repsDone
        : result.repsDone * convertWeight(result.weight, result.unit ?? 'kg', displayUnit),
  }
}

export function progressMetricLabel(kind: ProgressKind, displayUnit: WeightUnit): string {
  return kind === 'bodyweight' ? 'reps' : `${displayUnit}·reps`
}

/**
 * Total output of a logged workout. Weighted work uses reps × weight;
 * bodyweight work uses reps. Null for entries saved before tracking existed.
 */
export function entryVolume(entry: WorkoutLogEntry, displayUnit: WeightUnit): number | null {
  let total = 0
  let hasData = false
  for (const r of entry.results) {
    const progress = progressValue(r, displayUnit)
    if (!progress) continue
    hasData = true
    total += progress.value
  }
  return hasData ? total : null
}

export function entryMetricLabel(entry: WorkoutLogEntry, displayUnit: WeightUnit): string {
  const kinds = new Set(
    entry.results
      .map((result) => progressValue(result, displayUnit)?.kind)
      .filter((kind): kind is ProgressKind => kind !== undefined),
  )
  if (kinds.size !== 1) return 'output'
  return progressMetricLabel([...kinds][0]!, displayUnit)
}

/** Per-movement output rows for tooltips/tables. */
export function entryBreakdown(
  entry: WorkoutLogEntry,
  displayUnit: WeightUnit,
): Array<{ movement: string; volume: number }> {
  return entry.results
    .map((result) => ({ result, progress: progressValue(result, displayUnit) }))
    .filter(
      (item): item is { result: MovementResult; progress: ProgressValue } => item.progress !== null,
    )
    .map(({ result, progress }) => ({
      movement: result.movement,
      volume: progress.value,
    }))
}

export function formatVolume(v: number): string {
  return Math.round(v).toLocaleString()
}
