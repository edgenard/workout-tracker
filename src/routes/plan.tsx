import { createFileRoute } from '@tanstack/react-router'
import { COOLDOWN_SEGMENTS, WARMUP_SEGMENTS } from '#/lib/plan'
import { formatClock } from '#/lib/useStopwatch'

export const Route = createFileRoute('/plan')({ component: PlanPage })

const SCHEDULE = [
  ['Monday', 'Day A', 'Swings + Turkish Get-Ups'],
  ['Tuesday', 'Day B', 'Clean & Press + Squats'],
  ['Wednesday', 'Active Recovery', 'Warm-up and cool-down only'],
  ['Thursday', 'Day A', 'Swings + Turkish Get-Ups'],
  ['Friday', 'Day B', 'Clean & Press + Squats'],
  ['Weekend', 'Rest', 'Total recovery'],
]

const PROGRESSIONS: Array<[string, Array<string>]> = [
  [
    'Swing — EMOM',
    [
      'Phase 1 (Time): start 10 min EMOM at a rep count you own. Add 1 minute every workout, up to 20.',
      'Phase 2 (Density): at 20 min, drop back to 10 min and add 1 rep per minute. Climb back to 20.',
      'Phase 3 (Complexity): around 15–20 reps/min, switch to single-arm swings and restart Phase 1.',
    ],
  ],
  [
    'Turkish Get-Up — alternating EMOM',
    [
      'Phase 1 (Time): 1 rep per minute, alternating sides. Start 10 min (5/side); add 2 minutes each week, up to 20.',
      'Phase 2 (Complexity): at an easy 20 min, add a strict 3-second pause at every transition point.',
    ],
  ],
  [
    'Clean & Press — reverse ladders',
    [
      'Phase 1 (Volume): 3-2-1 ladders (6 reps/arm each). Start at 3 ladders; add 1 ladder per workout up to 5.',
      'Phase 2 (Density): at 5 ladders, drop to 3 ladders of 4-3-2-1 (10 reps/arm). Climb back to 5, then 5-4-3-2-1.',
    ],
  ],
  [
    'Squat — EMOM',
    [
      'Phase 1 (Time): goblet squats, 10 min EMOM at a fixed rep count. Add 1 minute per workout up to 20.',
      'Phase 2 (Density): drop to 10 min, add 1 rep per minute, climb back up.',
      'Then: switch to single-arm front-rack squats and restart.',
    ],
  ],
]

function PlanPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-black">The Program</h1>
        <p className="mt-2 text-zinc-400">
          A 4-day single-kettlebell program built on Mark Wildman’s “Tetris of Training” and
          “Nerd Math” — progress by adding time (volume), then reps (density), then complexity.
          Only progress a movement when you hit the current target with perfect form.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Weekly Schedule</h2>
        <div className="overflow-hidden rounded-2xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <tbody>
              {SCHEDULE.map(([day, focus, detail]) => (
                <tr key={day} className="border-b border-zinc-800 last:border-0">
                  <td className="px-4 py-2.5 font-semibold">{day}</td>
                  <td className="px-4 py-2.5 text-emerald-400">{focus}</td>
                  <td className="px-4 py-2.5 text-zinc-400">{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">The Bookends</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="font-bold text-emerald-400">Warm-up (10 min)</p>
            <ul className="mt-2 space-y-2 text-sm text-zinc-300">
              {WARMUP_SEGMENTS.map((s) => (
                <li key={s.name}>
                  <span className="font-semibold">
                    {s.name} · {formatClock(s.seconds)}
                  </span>
                  <br />
                  <span className="text-zinc-500">{s.cue}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="font-bold text-emerald-400">Cool-down (10 min)</p>
            <ul className="mt-2 space-y-2 text-sm text-zinc-300">
              {COOLDOWN_SEGMENTS.map((s) => (
                <li key={s.name}>
                  <span className="font-semibold">
                    {s.name} · {formatClock(s.seconds)}
                  </span>
                  <br />
                  <span className="text-zinc-500">{s.cue}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Nerd Math Progressions</h2>
        <div className="space-y-3">
          {PROGRESSIONS.map(([name, phases]) => (
            <div key={name} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="font-bold text-emerald-400">{name}</p>
              <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-zinc-300">
                {phases.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          The tracker applies these rules automatically when you save a workout: hit the goal and
          the target advances; miss it and it holds. TGU advances after two consecutive hits
          (≈ one week at two A-days per week).
        </p>
      </section>
    </div>
  )
}
