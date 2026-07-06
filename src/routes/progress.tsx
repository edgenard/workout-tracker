import { useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { DAY_INFO } from '#/lib/plan'
import { MOVEMENT_NAMES } from '#/lib/progression'
import { bellStore, historyStore } from '#/lib/store'
import { convertWeight, entryVolume, formatVolume } from '#/lib/volume'
import type { MovementId, WorkoutLogEntry } from '#/lib/types'

export const Route = createFileRoute('/progress')({ component: Progress, ssr: false })

// Categorical slots 1–2, validated for CVD + 3:1 contrast on the zinc-900 surface
const SERIES_COLORS: Record<'a' | 'b', string> = { a: '#3987e5', b: '#199e70' }
const SURFACE = '#18181b' // zinc-900, the chart card surface

interface Point {
  x: number // ms epoch
  y: number
  /** In cumulative view, this workout's own contribution to y */
  session?: number
  hit: boolean
  entry: WorkoutLogEntry
}

interface Series {
  id: string
  label: string
  color: string
  points: Array<Point>
}

const BELL_MOVEMENTS: Array<MovementId> = [
  'swing',
  'tgu',
  'pullover',
  'cleanPress',
  'squat',
  'splitSquat',
]

function Progress() {
  const history = useStore(historyStore)
  const bell = useStore(bellStore)
  const [movement, setMovement] = useState<MovementId | 'all'>('all')
  const [view, setView] = useState<'perWorkout' | 'cumulative'>('perWorkout')

  const { series, runningTotals } = useMemo(() => {
    const entries = [...history]
      .filter((e) => e.day !== 'recovery')
      .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))

    const pointFor = (e: WorkoutLogEntry): Point | null => {
      if (movement === 'all') {
        const v = entryVolume(e, bell.unit)
        if (v === null) return null
        return { x: Date.parse(e.date), y: v, hit: e.results.every((r) => r.hit), entry: e }
      }
      const r = e.results.find(
        (res) =>
          res.movement === movement && res.repsDone !== undefined && res.weight !== undefined,
      )
      if (!r) return null
      return {
        x: Date.parse(e.date),
        y: r.repsDone! * convertWeight(r.weight!, r.unit ?? 'kg', bell.unit),
        hit: r.hit,
        entry: e,
      }
    }

    const allPoints = entries.map(pointFor).filter((p): p is Point => p !== null)

    // Running total per entry (date order), for the cumulative view and table
    const runningTotals = new Map<string, number>()
    let sum = 0
    for (const p of allPoints) {
      sum += p.y
      runningTotals.set(p.entry.id, sum)
    }

    let series: Array<Series>
    if (view === 'cumulative') {
      series = [
        {
          id: 'cumulative',
          label: 'Cumulative volume',
          color: SERIES_COLORS.a,
          points: allPoints.map((p) => ({
            ...p,
            session: p.y,
            y: runningTotals.get(p.entry.id)!,
          })),
        },
      ].filter((s) => s.points.length > 0)
    } else {
      series = (['a', 'b'] as const)
        .map((day) => ({
          id: day,
          label: DAY_INFO[day].title,
          color: SERIES_COLORS[day],
          points: allPoints.filter((p) => p.entry.day === day),
        }))
        .filter((s) => s.points.length > 0)
    }
    return { series, runningTotals }
  }, [history, movement, view, bell.unit])

  const hasData = series.length > 0
  const legacyCount = history.filter(
    (e) => e.day !== 'recovery' && entryVolume(e, bell.unit) === null,
  ).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Progress</h1>
        <p className="mt-2 text-zinc-400">
          Total output per workout — reps × bell weight ({bell.weight} {bell.unit} today), summed
          across the session's kettlebell movements. Movements still at a bodyweight stage count
          as zero until you load them.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-400" htmlFor="movement-filter">
            Movement
          </label>
          <select
            id="movement-filter"
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm font-semibold"
            value={movement}
            onChange={(e) => setMovement(e.target.value as MovementId | 'all')}
          >
            <option value="all">All (session total)</option>
            {BELL_MOVEMENTS.map((m) => (
              <option key={m} value={m}>
                {MOVEMENT_NAMES[m]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex overflow-hidden rounded-lg border border-zinc-700 text-sm font-semibold">
          {(
            [
              ['perWorkout', 'Per workout'],
              ['cumulative', 'Cumulative total'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`px-3 py-1.5 ${
                view === id ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-400 hover:bg-zinc-800'
              }`}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        {hasData ? (
          <VolumeChart key={`${movement}:${view}`} series={series} unit={bell.unit} />
        ) : (
          <p className="py-12 text-center text-zinc-500">
            No charted workouts yet. Finish and save a session and it will appear here.
          </p>
        )}
        {legacyCount > 0 && (
          <p className="mt-2 text-xs text-zinc-500">
            {legacyCount} older workout{legacyCount > 1 ? 's' : ''} saved before weight tracking
            {legacyCount > 1 ? ' are' : ' is'} not charted.
          </p>
        )}
      </section>

      {hasData && (
        <section>
          <h2 className="mb-2 text-lg font-bold">Logged output</h2>
          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="px-4 py-2 font-semibold">Date</th>
                  <th className="px-4 py-2 font-semibold">Day</th>
                  <th className="px-4 py-2 text-right font-semibold">
                    Volume ({bell.unit}·reps)
                  </th>
                  <th className="px-4 py-2 text-right font-semibold">Running total</th>
                  <th className="px-4 py-2 text-right font-semibold">Goals</th>
                </tr>
              </thead>
              <tbody>
                {series
                  .flatMap((s) => s.points.map((p) => ({ ...p, label: s.label })))
                  .sort((a, b) => b.x - a.x)
                  .map((p) => (
                    <tr key={p.entry.id} className="border-b border-zinc-800 last:border-0">
                      <td className="px-4 py-2">
                        {new Date(p.x).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-2">{DAY_INFO[p.entry.day].title}</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {formatVolume(p.session ?? p.y)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-zinc-400">
                        {formatVolume(runningTotals.get(p.entry.id) ?? p.y)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {p.entry.results.filter((r) => r.hit).length}/{p.entry.results.length}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

const W = 720
const H = 300
const M = { top: 16, right: 16, bottom: 28, left: 52 }

function niceTicks(max: number): Array<number> {
  if (max <= 0) return [0]
  const rough = max / 4
  const pow = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((s) => s * pow).find((s) => s >= rough) ?? pow * 10
  const ticks: Array<number> = []
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(v)
  return ticks
}

function VolumeChart({ series, unit }: { series: Array<Series>; unit: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<{ point: Point; series: Series } | null>(null)

  const allPoints = series.flatMap((s) => s.points.map((p) => ({ point: p, series: s })))
  const xs = allPoints.map((a) => a.point.x)
  const ys = allPoints.map((a) => a.point.y)
  const xMin = Math.min(...xs)
  const xMax = Math.max(...xs)
  const xSpan = Math.max(xMax - xMin, 86_400_000) // at least a day so lone points center
  const yTicks = niceTicks(Math.max(...ys) * 1.05)
  const yMax = yTicks[yTicks.length - 1] || 1

  const px = (x: number) => M.left + ((x - (xMin + xMax) / 2 + xSpan / 2) / xSpan) * (W - M.left - M.right)
  const py = (y: number) => H - M.bottom - (y / yMax) * (H - M.top - M.bottom)

  const xTickCount = Math.min(5, new Set(xs).size)
  const xTicks = Array.from({ length: xTickCount }, (_, i) =>
    xMin + ((xMax - xMin) * i) / Math.max(xTickCount - 1, 1),
  )

  const findNearest = (clientX: number) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect || allPoints.length === 0) return null
    const mx = ((clientX - rect.left) / rect.width) * W
    let best = allPoints[0]
    let bestDist = Infinity
    for (const a of allPoints) {
      const d = Math.abs(px(a.point.x) - mx)
      if (d < bestDist) {
        bestDist = d
        best = a
      }
    }
    return best
  }

  const fmtDate = (ms: number) =>
    new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {series.length > 1 &&
          series.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 text-zinc-300">
              <span className="inline-block h-0.5 w-4 rounded" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        <span className="text-xs text-zinc-500">Hollow point = goal missed</span>
      </div>

      <div ref={wrapRef} className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none select-none"
          role="img"
          aria-label={`Workout volume over time in ${unit} times reps`}
          onPointerMove={(e) => setHover(findNearest(e.clientX))}
          onPointerLeave={() => setHover(null)}
        >
          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={M.left}
                x2={W - M.right}
                y1={py(t)}
                y2={py(t)}
                stroke="#27272a"
                strokeWidth="1"
              />
              <text
                x={M.left - 8}
                y={py(t) + 4}
                textAnchor="end"
                fontSize="11"
                fill="#71717a"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {t.toLocaleString()}
              </text>
            </g>
          ))}
          {xTicks.map((t, i) => (
            <text
              key={t}
              x={px(t)}
              y={H - M.bottom + 18}
              textAnchor={i === xTicks.length - 1 && xTicks.length > 1 ? 'end' : 'middle'}
              fontSize="11"
              fill="#71717a"
            >
              {fmtDate(t)}
            </text>
          ))}
          <line
            x1={M.left}
            x2={W - M.right}
            y1={H - M.bottom}
            y2={H - M.bottom}
            stroke="#3f3f46"
            strokeWidth="1"
          />

          {hover && (
            <line
              x1={px(hover.point.x)}
              x2={px(hover.point.x)}
              y1={M.top}
              y2={H - M.bottom}
              stroke="#52525b"
              strokeWidth="1"
            />
          )}

          {series.map((s) => (
            <g key={s.id}>
              {s.points.length > 1 && (
                <path
                  d={s.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p.x)},${py(p.y)}`).join(' ')}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              {s.points.map((p) => (
                <circle
                  key={p.entry.id}
                  cx={px(p.x)}
                  cy={py(p.y)}
                  r={hover?.point.entry.id === p.entry.id ? 6 : 4.5}
                  fill={p.hit ? s.color : SURFACE}
                  stroke={p.hit ? SURFACE : s.color}
                  strokeWidth="2"
                />
              ))}
            </g>
          ))}
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute top-2 z-10 w-52 rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm shadow-xl"
            style={{
              left: `${Math.min(Math.max((px(hover.point.x) / W) * 100, 0), 68)}%`,
            }}
          >
            <p className="text-xs text-zinc-500">
              {new Date(hover.point.x).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <p className="mt-1 flex items-center gap-1.5">
              <span
                className="inline-block h-0.5 w-3 rounded"
                style={{ background: hover.series.color }}
              />
              <span className="font-bold tabular-nums">{formatVolume(hover.point.y)}</span>
              <span className="text-zinc-400">
                {unit}·reps · {hover.series.label}
              </span>
            </p>
            {hover.point.session !== undefined && (
              <p className="mt-0.5 text-xs text-zinc-400">
                +{formatVolume(hover.point.session)} this workout ({DAY_INFO[hover.point.entry.day].title})
              </p>
            )}
            <ul className="mt-2 space-y-0.5 text-xs text-zinc-400">
              {hover.point.entry.results
                .filter((r) => r.repsDone !== undefined && r.weight !== undefined)
                .map((r) => (
                  <li key={r.movement} className="flex justify-between gap-2">
                    <span>
                      {MOVEMENT_NAMES[r.movement]}
                      {!r.hit && ' (missed)'}
                    </span>
                    <span className="tabular-nums">
                      {formatVolume(
                        r.repsDone! * convertWeight(r.weight!, r.unit ?? 'kg', unit as 'kg' | 'lb'),
                      )}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
