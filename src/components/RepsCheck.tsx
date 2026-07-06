interface RepsCheckProps {
  targetReps: number
  value: number | undefined
  onChange: (repsDone: number) => void
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)))
}

/** Editable rep count for what was actually completed, pre-filled from the timer/tracker */
export function RepsCheck({ targetReps, value, onChange }: RepsCheckProps) {
  const current = value ?? targetReps
  const hit = current >= targetReps

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <p className="font-semibold text-zinc-300">How many reps did you actually complete?</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="size-10 rounded-lg border border-zinc-700 text-xl font-bold hover:bg-zinc-800"
          onClick={() => onChange(clamp(current - 1, 0, 9999))}
        >
          −
        </button>
        <input
          type="number"
          min={0}
          className="w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-center text-2xl font-black tabular-nums"
          value={current}
          onChange={(e) => onChange(clamp(e.target.valueAsNumber || 0, 0, 9999))}
        />
        <button
          type="button"
          className="size-10 rounded-lg border border-zinc-700 text-xl font-bold hover:bg-zinc-800"
          onClick={() => onChange(clamp(current + 1, 0, 9999))}
        >
          +
        </button>
      </div>
      <p className="text-sm text-zinc-500">/ {targetReps} goal</p>
      <p className={`font-semibold ${hit ? 'text-emerald-400' : 'text-rose-400'}`}>
        {hit ? '✓ Goal hit' : '✗ Below goal'}
      </p>
    </div>
  )
}
