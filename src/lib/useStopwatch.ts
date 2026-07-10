import { useCallback, useEffect, useRef, useState } from 'react'

export type StopwatchStatus = 'idle' | 'running' | 'paused' | 'done'

interface StopwatchSnapshot {
  status: StopwatchStatus
  accumulatedMs: number
  startedAt: number
}

function loadSnapshot(persistenceKey: string | undefined): StopwatchSnapshot {
  const fallback: StopwatchSnapshot = { status: 'idle', accumulatedMs: 0, startedAt: 0 }
  if (!persistenceKey || typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(persistenceKey)
    if (!raw) return fallback
    const value = JSON.parse(raw) as Partial<StopwatchSnapshot>
    if ((value.status === 'idle' || value.status === 'running' || value.status === 'paused' || value.status === 'done')
      && typeof value.accumulatedMs === 'number'
      && typeof value.startedAt === 'number') return value as StopwatchSnapshot
  } catch {
    // Ignore missing or invalid persisted timer state.
  }
  return fallback
}

/**
 * Wall-clock based stopwatch (survives tab throttling better than
 * decrementing a counter). Elapsed is recomputed from Date.now().
 */
export function useStopwatch(persistenceKey?: string) {
  const snapshotRef = useRef<StopwatchSnapshot | null>(null)
  if (snapshotRef.current === null) snapshotRef.current = loadSnapshot(persistenceKey)
  const [status, setStatus] = useState<StopwatchStatus>(snapshotRef.current.status)
  const [elapsedMs, setElapsedMs] = useState(() => snapshotRef.current!.accumulatedMs
    + (snapshotRef.current!.status === 'running' ? Date.now() - snapshotRef.current!.startedAt : 0))

  const save = useCallback((snapshot: StopwatchSnapshot) => {
    snapshotRef.current = snapshot
    if (persistenceKey) window.localStorage.setItem(persistenceKey, JSON.stringify(snapshot))
  }, [persistenceKey])

  const currentElapsed = useCallback(() => {
    const snapshot = snapshotRef.current!
    return snapshot.accumulatedMs + (snapshot.status === 'running' ? Date.now() - snapshot.startedAt : 0)
  }, [])

  useEffect(() => {
    if (status !== 'running') return
    const id = window.setInterval(() => {
      setElapsedMs(currentElapsed())
    }, 100)
    return () => window.clearInterval(id)
  }, [currentElapsed, status])

  const start = useCallback(() => {
    save({ status: 'running', accumulatedMs: 0, startedAt: Date.now() })
    setElapsedMs(0)
    setStatus('running')
  }, [save])

  const pause = useCallback(() => {
    const accumulatedMs = currentElapsed()
    save({ status: 'paused', accumulatedMs, startedAt: 0 })
    setElapsedMs(accumulatedMs)
    setStatus('paused')
  }, [currentElapsed, save])

  const resume = useCallback(() => {
    save({ status: 'running', accumulatedMs: currentElapsed(), startedAt: Date.now() })
    setStatus('running')
  }, [currentElapsed, save])

  const seek = useCallback(
    (elapsedMs: number) => {
      const nextElapsedMs = Math.max(0, elapsedMs)
      const current = snapshotRef.current!
      save({ ...current, accumulatedMs: nextElapsedMs, startedAt: current.status === 'running' ? Date.now() : 0 })
      setElapsedMs(nextElapsedMs)
    },
    [save],
  )

  const finish = useCallback(() => {
    const accumulatedMs = currentElapsed()
    save({ status: 'done', accumulatedMs, startedAt: 0 })
    setElapsedMs(accumulatedMs)
    setStatus('done')
  }, [currentElapsed, save])

  const reset = useCallback(() => {
    save({ status: 'idle', accumulatedMs: 0, startedAt: 0 })
    setElapsedMs(0)
    setStatus('idle')
  }, [save])

  return { status, elapsedMs, start, pause, resume, seek, finish, reset }
}

/** Keep the screen awake while a timer runs (best-effort, mobile browsers) */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    navigator.wakeLock
      .request('screen')
      .then((l) => {
        if (cancelled) void l.release()
        else lock = l
      })
      .catch(() => {})
    return () => {
      cancelled = true
      void lock?.release()
    }
  }, [active])
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}
