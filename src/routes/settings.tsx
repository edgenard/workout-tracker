import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { LIMITS, SPLIT_SQUAT_LEVELS, movementTarget } from '#/lib/progression'
import { bellStore, progressionStore, resetAllData, setBell, setProgression } from '#/lib/store'
import { convertWeight } from '#/lib/volume'
import type { MovementId, WeightUnit } from '#/lib/types'

export const Route = createFileRoute('/settings')({ component: Settings, ssr: false })

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)))
}

const numberInput =
  'w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-center font-semibold'
const selectInput =
  'rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-semibold'

function Settings() {
  const p = useStore(progressionStore)
  const bell = useStore(bellStore)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Settings</h1>
        <p className="mt-2 text-zinc-400">
          Targets normally advance on their own when you save workouts. Adjust them here to set
          your starting points (e.g. the swing rep count you can do perfectly) or to correct a
          mistake. All data lives in this browser’s local storage.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="font-bold text-emerald-400">Your Kettlebell</p>
        <p className="mb-3 text-sm text-zinc-500">
          Recorded with every workout you save — the Progress chart multiplies it by total reps.
          Update it here when you move to a heavier bell.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            Weight
            <input
              type="number"
              min={1}
              max={100}
              step={bell.unit === 'kg' ? 2 : 5}
              className={numberInput}
              value={bell.weight}
              onChange={(e) =>
                setBell({ ...bell, weight: clamp(e.target.valueAsNumber || 1, 1, 100) })
              }
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            Unit
            <select
              className={selectInput}
              value={bell.unit}
              onChange={(e) => {
                const unit = e.target.value as WeightUnit
                setBell({ weight: Math.round(convertWeight(bell.weight, bell.unit, unit)), unit })
              }}
            >
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="font-bold text-emerald-400">Swing</p>
        <p className="mb-3 text-sm text-zinc-500">{movementTarget(p, 'swing' as MovementId)}</p>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            Style
            <select
              className={selectInput}
              value={p.swing.style}
              onChange={(e) =>
                setProgression({
                  ...p,
                  swing: { ...p.swing, style: e.target.value as 'two-hand' | 'single-arm' },
                })
              }
            >
              <option value="two-hand">Two-hand</option>
              <option value="single-arm">Single-arm</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            Reps/min
            <input
              type="number"
              min={1}
              max={LIMITS.swingMaxReps}
              className={numberInput}
              value={p.swing.repsPerMinute}
              onChange={(e) =>
                setProgression({
                  ...p,
                  swing: {
                    ...p.swing,
                    repsPerMinute: clamp(e.target.valueAsNumber || 1, 1, LIMITS.swingMaxReps),
                  },
                })
              }
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            Minutes
            <input
              type="number"
              min={LIMITS.emomMinMinutes}
              max={LIMITS.emomMaxMinutes}
              className={numberInput}
              value={p.swing.minutes}
              onChange={(e) =>
                setProgression({
                  ...p,
                  swing: {
                    ...p.swing,
                    minutes: clamp(
                      e.target.valueAsNumber || LIMITS.emomMinMinutes,
                      LIMITS.emomMinMinutes,
                      LIMITS.emomMaxMinutes,
                    ),
                  },
                })
              }
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="font-bold text-emerald-400">Turkish Get-Up</p>
        <p className="mb-3 text-sm text-zinc-500">{movementTarget(p, 'tgu' as MovementId)}</p>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            Minutes (even)
            <input
              type="number"
              min={LIMITS.emomMinMinutes}
              max={LIMITS.emomMaxMinutes}
              step={2}
              className={numberInput}
              value={p.tgu.minutes}
              onChange={(e) => {
                const v = clamp(
                  e.target.valueAsNumber || LIMITS.emomMinMinutes,
                  LIMITS.emomMinMinutes,
                  LIMITS.emomMaxMinutes,
                )
                setProgression({ ...p, tgu: { ...p.tgu, minutes: v - (v % 2) } })
              }}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-emerald-500"
              checked={p.tgu.pauses}
              onChange={(e) =>
                setProgression({ ...p, tgu: { ...p.tgu, pauses: e.target.checked } })
              }
            />
            3-second pauses at transitions
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="font-bold text-emerald-400">Clean & Press</p>
        <p className="mb-3 text-sm text-zinc-500">
          {movementTarget(p, 'cleanPress' as MovementId)}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            Ladder top
            <select
              className={selectInput}
              value={p.cleanPress.ladderTop}
              onChange={(e) =>
                setProgression({
                  ...p,
                  cleanPress: { ...p.cleanPress, ladderTop: Number(e.target.value) },
                })
              }
            >
              <option value={3}>3-2-1</option>
              <option value={4}>4-3-2-1</option>
              <option value={5}>5-4-3-2-1</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            Ladders
            <input
              type="number"
              min={1}
              max={LIMITS.maxLadders}
              className={numberInput}
              value={p.cleanPress.ladders}
              onChange={(e) =>
                setProgression({
                  ...p,
                  cleanPress: {
                    ...p.cleanPress,
                    ladders: clamp(e.target.valueAsNumber || 1, 1, LIMITS.maxLadders),
                  },
                })
              }
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="font-bold text-emerald-400">Squat</p>
        <p className="mb-3 text-sm text-zinc-500">{movementTarget(p, 'squat' as MovementId)}</p>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            Style
            <select
              className={selectInput}
              value={p.squat.style}
              onChange={(e) =>
                setProgression({
                  ...p,
                  squat: { ...p.squat, style: e.target.value as 'goblet' | 'front-rack' },
                })
              }
            >
              <option value="goblet">Goblet</option>
              <option value="front-rack">Single-arm front rack</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            Reps/min
            <input
              type="number"
              min={1}
              max={LIMITS.squatMaxReps}
              className={numberInput}
              value={p.squat.repsPerMinute}
              onChange={(e) =>
                setProgression({
                  ...p,
                  squat: {
                    ...p.squat,
                    repsPerMinute: clamp(e.target.valueAsNumber || 1, 1, LIMITS.squatMaxReps),
                  },
                })
              }
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            Minutes
            <input
              type="number"
              min={LIMITS.emomMinMinutes}
              max={LIMITS.emomMaxMinutes}
              className={numberInput}
              value={p.squat.minutes}
              onChange={(e) =>
                setProgression({
                  ...p,
                  squat: {
                    ...p.squat,
                    minutes: clamp(
                      e.target.valueAsNumber || LIMITS.emomMinMinutes,
                      LIMITS.emomMinMinutes,
                      LIMITS.emomMaxMinutes,
                    ),
                  },
                })
              }
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="font-bold text-emerald-400">Floor Pullovers</p>
        <p className="mb-3 text-sm text-zinc-500">{movementTarget(p, 'pullover' as MovementId)}</p>
        <label className="flex items-center gap-2 text-sm">
          Reps per set
          <input
            type="number"
            min={LIMITS.pulloverMinReps}
            max={LIMITS.pulloverMaxReps}
            className={numberInput}
            value={p.pullover.reps}
            onChange={(e) =>
              setProgression({
                ...p,
                pullover: {
                  reps: clamp(
                    e.target.valueAsNumber || LIMITS.pulloverMinReps,
                    LIMITS.pulloverMinReps,
                    LIMITS.pulloverMaxReps,
                  ),
                },
              })
            }
          />
        </label>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="font-bold text-emerald-400">ATG Split Squat</p>
        <p className="mb-3 text-sm text-zinc-500">
          {movementTarget(p, 'splitSquat' as MovementId)}
        </p>
        <label className="flex flex-wrap items-center gap-2 text-sm">
          Stage
          <select
            className={selectInput}
            value={p.splitSquat.level}
            onChange={(e) =>
              setProgression({
                ...p,
                splitSquat: { level: Number(e.target.value), successStreak: 0 },
              })
            }
          >
            {SPLIT_SQUAT_LEVELS.map((label, i) => (
              <option key={label} value={i}>
                {i + 1}. {label}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-sm text-zinc-500">
          Only move to the loaded stage once the full floor range is pain-free.
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="font-bold text-emerald-400">Seated Good Mornings (cool-down)</p>
        <label className="mt-1 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-emerald-500"
            checked={p.goodMorning.loaded}
            onChange={(e) =>
              setProgression({ ...p, goodMorning: { loaded: e.target.checked } })
            }
          />
          Loaded: hug the bell to the chest, 3 × 10 slow reps
        </label>
        <p className="mt-2 text-sm text-zinc-500">
          Stay bodyweight until you can hinge deeply between your legs without rounding the
          lower back.
        </p>
      </section>

      <section className="rounded-2xl border border-rose-900/50 bg-rose-950/20 p-4">
        <p className="font-bold text-rose-400">Danger zone</p>
        <p className="mt-1 text-sm text-zinc-400">
          Wipes all history and resets every target to the program defaults.
        </p>
        <button
          type="button"
          className="mt-3 rounded-lg border border-rose-500 px-5 py-2 font-semibold text-rose-400 hover:bg-rose-500/10"
          onClick={() => {
            if (window.confirm('Really delete all workout history and reset targets?')) {
              resetAllData()
            }
          }}
        >
          Reset all data
        </button>
      </section>
    </div>
  )
}
