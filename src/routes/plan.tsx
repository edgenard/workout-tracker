import { createFileRoute } from '@tanstack/react-router'
import { WARMUP_SEGMENTS, cooldownSegments } from '#/lib/plan'
import { formatClock } from '#/lib/useStopwatch'

export const Route = createFileRoute('/plan')({ component: PlanPage })

const SCHEDULE = [
  ['Monday', 'Day A', 'Swings + Turkish Get-Ups + Floor Pullovers'],
  ['Tuesday', 'Day B', 'Clean & Press + Squats + ATG Split Squats'],
  ['Wednesday', 'Active Recovery', 'Warm-up and cool-down only'],
  ['Thursday', 'Day A', 'Swings + Turkish Get-Ups + Floor Pullovers'],
  ['Friday', 'Day B', 'Clean & Press + Squats + ATG Split Squats'],
  ['Weekend', 'Rest', 'Complete recovery'],
]

const PROGRESSIONS: Array<[string, Array<string>]> = [
  [
    'Swing — EMOM (Day A)',
    [
      'Phase 1 (Time): start 10 min EMOM at a rep count you own. Add 1 minute every workout, up to 20.',
      'Phase 2 (Density): at 20 min, drop back to 10 min and add 1 rep per minute. Climb back to 20.',
      'Phase 3 (Complexity): when 2-handed reps exceed 15–20/min, switch to single-arm swings and restart Phase 1.',
    ],
  ],
  [
    'Turkish Get-Up — alternating EMOM (Day A)',
    [
      'Phase 1 (Time): 1 rep per minute, alternating sides. Start 10 min (5/side); add 2 minutes each week, up to 20.',
      'Phase 2 (Time Under Tension): at an effortless 20 min, add a strict 3-second pause at every transition point.',
    ],
  ],
  [
    'Floor Pullovers — ATG shoulder armor (Day A)',
    [
      'Lie on your back, bell held by the horns over your chest. Lower it straight back until it taps the floor behind your head, then pull it back over.',
      '3 sets of 10–15 reps. Focus on a deep, controlled stretch in the lats and shoulders — add a rep when you own all three sets.',
    ],
  ],
  [
    'Clean & Press — reverse ladders (Day B)',
    [
      'Phase 1 (Volume): 3-2-1 ladders (3 reps L/R, rest; 2 L/R, rest; 1 L/R, rest). Start at 3 ladders; add 1 per workout up to 5.',
      'Phase 2 (Density): at 5 ladders, drop to 3 ladders of 4-3-2-1 and climb back to 5, then 5-4-3-2-1.',
    ],
  ],
  [
    'Goblet Squat — EMOM (Day B)',
    [
      'Phase 1 (Time): 10 min EMOM at a fixed rep count. Add 1 minute per workout up to 20.',
      'Phase 2 (Density & Complexity): drop to 10 min, add 1 rep per minute, climb back up. When goblet squats get too light, switch to single-arm front-rack squats and restart.',
    ],
  ],
  [
    'ATG Split Squat — knee armor (Day B)',
    [
      'Long lunge stance, back leg straight. Drive the front knee forward over the toes until your hamstring covers your calf. 5 sets of 5 per leg.',
      'Progression 1 (Elevation): front foot elevated on a chair or block, bodyweight only.',
      'Progression 2 (Depth): over weeks, gradually lower the elevation until the front foot is flat on the floor.',
      'Progression 3 (Load): only with full, pain-free range on the floor, hold the bell in the goblet position.',
    ],
  ],
  [
    'Seated Good Mornings — lower back armor (in the cool-down)',
    [
      'Sit wide-legged. Keep the lower back perfectly arched and hinge forward slowly.',
      'Progression 1 (Range of Motion): bodyweight until you can hinge deeply between your legs without rounding.',
      'Progression 2 (Load): hug the bell to your chest — 3 sets of 10 slow, controlled reps at the end of the session. Enable this in Settings when you are ready.',
    ],
  ],
]

function PlanPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-black">The Program</h1>
        <p className="mt-2 text-zinc-400">
          A 4-day single-kettlebell program merging Mark Wildman’s “Tetris of Training” and
          “Nerd Math” with Ben Patrick’s ATG (Knees Over Toes) joint-armor system. Wildman’s
          progressions build the engine and work capacity; the ATG movements bulletproof the
          chassis — knees, ankles, shoulders, and lower back — at extreme ranges of motion.
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
            <p className="font-bold text-emerald-400">Warm-up · Prep & Ankle/Hamstring Armor</p>
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
            <p className="font-bold text-emerald-400">Cool-down · Restore & Lower Back Armor</p>
            <ul className="mt-2 space-y-2 text-sm text-zinc-300">
              {cooldownSegments(false).map((s) => (
                <li key={s.name}>
                  <span className="font-semibold">
                    {s.name} · {formatClock(s.seconds)}
                  </span>
                  <br />
                  <span className="text-zinc-500">{s.cue}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-zinc-500">
              Once loaded Seated Good Mornings are enabled in Settings, the segment extends to 3
              sets of 10 with the bell hugged to your chest.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Progressions</h2>
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
          the target advances; miss it and it holds. TGU and the ATG Split Squat advance after
          two consecutive hits (≈ one week at two sessions per week).
        </p>
      </section>
    </div>
  )
}
