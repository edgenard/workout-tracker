import type { WeightUnit, WorkoutLogEntry } from './types'

const KG_PER_LB = 0.45359237

export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value
  return from === 'kg' ? value / KG_PER_LB : value * KG_PER_LB
}

/**
 * Total output (tonnage) of a logged workout: Σ reps × weight, in the display
 * unit. Null for legacy entries saved before weight tracking existed.
 */
export function entryVolume(entry: WorkoutLogEntry, displayUnit: WeightUnit): number | null {
  let total = 0
  let hasData = false
  for (const r of entry.results) {
    if (r.repsDone === undefined || r.weight === undefined) continue
    hasData = true
    total += r.repsDone * convertWeight(r.weight, r.unit ?? 'kg', displayUnit)
  }
  return hasData ? total : null
}

/** Per-movement volume rows for tooltips/tables (bodyweight stages show 0) */
export function entryBreakdown(
  entry: WorkoutLogEntry,
  displayUnit: WeightUnit,
): Array<{ movement: string; volume: number }> {
  return entry.results
    .filter((r) => r.repsDone !== undefined && r.weight !== undefined)
    .map((r) => ({
      movement: r.movement,
      volume: r.repsDone! * convertWeight(r.weight!, r.unit ?? 'kg', displayUnit),
    }))
}

export function formatVolume(v: number): string {
  return Math.round(v).toLocaleString()
}
