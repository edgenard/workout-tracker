interface GoalCheckProps {
  value: boolean | undefined
  onChange: (hit: boolean) => void
}

/** Hit / missed input for a movement's rep & time goal */
export function GoalCheck({ value, onChange }: GoalCheckProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <p className="font-semibold text-zinc-300">Did you hit the goal with perfect form?</p>
      <div className="flex gap-3">
        <button
          type="button"
          className={`rounded-xl px-8 py-3 text-lg font-bold ${
            value === true
              ? 'bg-emerald-500 text-zinc-950'
              : 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
          }`}
          onClick={() => onChange(true)}
        >
          ✓ Hit it
        </button>
        <button
          type="button"
          className={`rounded-xl px-8 py-3 text-lg font-bold ${
            value === false
              ? 'bg-rose-500 text-zinc-950'
              : 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
          }`}
          onClick={() => onChange(false)}
        >
          ✗ Missed
        </button>
      </div>
    </div>
  )
}
