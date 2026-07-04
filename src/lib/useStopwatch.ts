import { useCallback, useEffect, useRef, useState } from 'react'

export type StopwatchStatus = 'idle' | 'running' | 'paused' | 'done'

/**
 * Wall-clock based stopwatch (survives tab throttling better than
 * decrementing a counter). Elapsed is recomputed from Date.now().
 */
export function useStopwatch() {
  const [status, setStatus] = useState<StopwatchStatus>('idle')
  const [elapsedMs, setElapsedMs] = useState(0)
  const startedAtRef = useRef(0)
  const accumulatedRef = useRef(0)

  useEffect(() => {
    if (status !== 'running') return
    const id = window.setInterval(() => {
      setElapsedMs(accumulatedRef.current + (Date.now() - startedAtRef.current))
    }, 100)
    return () => window.clearInterval(id)
  }, [status])

  const start = useCallback(() => {
    accumulatedRef.current = 0
    startedAtRef.current = Date.now()
    setElapsedMs(0)
    setStatus('running')
  }, [])

  const pause = useCallback(() => {
    accumulatedRef.current += Date.now() - startedAtRef.current
    setElapsedMs(accumulatedRef.current)
    setStatus('paused')
  }, [])

  const resume = useCallback(() => {
    startedAtRef.current = Date.now()
    setStatus('running')
  }, [])

  const finish = useCallback(() => {
    setStatus('done')
  }, [])

  const reset = useCallback(() => {
    accumulatedRef.current = 0
    setElapsedMs(0)
    setStatus('idle')
  }, [])

  return { status, elapsedMs, start, pause, resume, finish, reset }
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
