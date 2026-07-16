import { useEffect, useRef } from 'react'
import { finishBeep, tick, unlockAudio } from '#/lib/audio'
import { formatClock, useStopwatch } from '#/lib/useStopwatch'

export function TransitionBeat({ seconds, nextName, persistenceKey, autoStart = false, onDone }: { seconds: number; nextName: string; persistenceKey?: string; autoStart?: boolean; onDone: () => void }) {
  const { status, elapsedMs, start, finish } = useStopwatch(persistenceKey)
  const done = useRef(false)
  const lastSecond = useRef(-1)
  const remaining = Math.max(0, Math.ceil(seconds - elapsedMs / 1000))

  useEffect(() => {
    if (autoStart && status === 'idle') start()
  }, [autoStart, start, status])

  useEffect(() => {
    if (status !== 'running') return
    if (elapsedMs >= seconds * 1000) {
      if (!done.current) {
        done.current = true
        finishBeep()
        finish()
        onDone()
      }
      return
    }
    if (remaining <= 5 && remaining !== lastSecond.current) {
      lastSecond.current = remaining
      tick()
    }
  }, [elapsedMs, finish, onDone, remaining, seconds, status])

  return <div className="flex flex-col items-center gap-4 py-8 text-center">
    <p className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Up next</p>
    <p className="text-3xl font-bold text-emerald-400">{nextName}</p>
    <p className="text-7xl font-black tabular-nums text-amber-400">{formatClock(status === 'idle' ? seconds : remaining)}</p>
    {status === 'idle' && <button type="button" className="rounded-xl bg-emerald-500 px-10 py-4 text-xl font-bold text-zinc-950 hover:bg-emerald-400" onClick={() => { unlockAudio(); start() }}>Start transition</button>}
  </div>
}
