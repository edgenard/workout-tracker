import { useCallback, useEffect, useRef, useState } from 'react'
import { finishBeep, minuteBeep, tick, unlockAudio } from '#/lib/audio'
import { countdownCueSeconds } from '#/lib/countdownCue'
import { formatClock, useStopwatch, useWakeLock } from '#/lib/useStopwatch'
import type { CountdownCueConfig } from '#/lib/countdownCue'

interface EmomTimerProps {
  totalMinutes: number
  /** Big text shown for the work to do this minute, e.g. "10 reps" */
  repsText: string
  /** Optional per-minute label, e.g. Left/Right for alternating TGU */
  minuteLabel?: (minuteIndex: number) => string
  /** Optional audio sources rotated once per minute. */
  minuteAudioSources?: ReadonlyArray<string>
  persistenceKey?: string
  autoStart?: boolean
  countdownConfig?: CountdownCueConfig
  /** Called with elapsed ms (total on natural finish, elapsed-so-far on early end) */
  onDone: (completedMs: number) => void
}

export function EmomTimer({
  totalMinutes,
  repsText,
  minuteLabel,
  minuteAudioSources,
  persistenceKey,
  autoStart = false,
  countdownConfig = {},
  onDone,
}: EmomTimerProps) {
  const countdownSeconds = countdownCueSeconds(60, countdownConfig)
  const { status, elapsedMs, start, pause, resume, finish } = useStopwatch(persistenceKey)
  useWakeLock(status === 'running')

  const totalMs = totalMinutes * 60_000
  const clamped = Math.min(elapsedMs, totalMs)
  const minuteIdx = Math.min(Math.floor(clamped / 60_000), totalMinutes - 1)
  const secIntoMinute = Math.floor((clamped % 60_000) / 1000)
  const secRemaining = 60 - secIntoMinute

  const lastMinuteRef = useRef(0)
  const lastAudioMinuteRef = useRef(-1)
  const lastTickSecRef = useRef(-1)
  const doneRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioElementsRef = useRef<Array<HTMLAudioElement | null>>([])
  const [audioError, setAudioError] = useState(false)

  const playMinuteAudio = useCallback((index: number, offsetSeconds: number) => {
    if (!minuteAudioSources?.length) return
    const audio = audioElementsRef.current[index % minuteAudioSources.length]
    if (!audio) return
    audioRef.current?.pause()
    audioRef.current = audio
    lastAudioMinuteRef.current = index
    const play = () => {
      if (offsetSeconds > 0) audio.currentTime = Math.min(offsetSeconds, Number.isFinite(audio.duration) ? audio.duration : offsetSeconds)
      const playback = audio.play()
      if (playback) void playback.then(() => setAudioError(false)).catch(() => setAudioError(true))
    }
    if (offsetSeconds > 0 && audio.readyState < 1) audio.addEventListener('loadedmetadata', play, { once: true })
    else play()
  }, [minuteAudioSources])

  useEffect(() => {
    if (autoStart && status === 'idle') start()
  }, [autoStart, start, status])

  useEffect(() => {
    if (status !== 'running' || elapsedMs >= totalMs) {
      audioRef.current?.pause()
      return
    }
    const currentMinute = Math.floor(elapsedMs / 60_000)
    if (currentMinute !== lastAudioMinuteRef.current) playMinuteAudio(currentMinute, (elapsedMs % 60_000) / 1000)
  }, [elapsedMs, playMinuteAudio, status, totalMs])

  useEffect(() => () => audioRef.current?.pause(), [])

  useEffect(() => {
    if (status !== 'running') return
    if (elapsedMs >= totalMs) {
      if (!doneRef.current) {
        doneRef.current = true
        finishBeep()
        audioRef.current?.pause()
        finish()
        onDone(totalMs)
      }
      return
    }
    const m = Math.floor(elapsedMs / 60_000)
    if (m !== lastMinuteRef.current) {
      lastMinuteRef.current = m
      minuteBeep()
    }
    const s = Math.floor((elapsedMs % 60_000) / 1000)
    if (s >= 60 - countdownSeconds && s !== lastTickSecRef.current) {
      lastTickSecRef.current = s
      tick()
    }
  }, [elapsedMs, status, totalMs, countdownSeconds, finish, onDone])

  const endEarly = () => {
    if (doneRef.current) return
    doneRef.current = true
    audioRef.current?.pause()
    finish()
    onDone(elapsedMs)
  }

  const minuteAudioElements = minuteAudioSources?.map((source, index) => (
    <audio
      key={source}
      ref={(element) => { audioElementsRef.current[index] = element }}
      src={source}
      preload="auto"
      playsInline
      hidden
    />
  ))
  const audioErrorMessage = audioError && (
    <div className="text-center text-sm text-amber-400">
      <p>Audio was blocked by the browser.</p>
      <button type="button" className="mt-2 rounded-lg border border-amber-700 px-4 py-2 font-semibold hover:bg-amber-950" onClick={() => playMinuteAudio(minuteIdx, secIntoMinute)}>Play exercise audio</button>
    </div>
  )

  if (status === 'idle') {
    return (
      <>
        {minuteAudioElements}
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="text-5xl font-black tabular-nums">{totalMinutes}:00</p>
          <p className="text-zinc-400">
            {totalMinutes} minutes · beep at the top of every minute
          </p>
          <button
            type="button"
            className="rounded-xl bg-emerald-500 px-10 py-4 text-xl font-bold text-zinc-950 hover:bg-emerald-400"
            onClick={() => {
              unlockAudio()
              playMinuteAudio(0, 0)
              start()
            }}
          >
            Start EMOM
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      {minuteAudioElements}
      <div className="flex flex-col items-center gap-3 py-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
          Minute {minuteIdx + 1} of {totalMinutes}
          {minuteLabel ? ` — ${minuteLabel(minuteIdx)}` : ''}
        </p>
      <p
        className={`text-7xl font-black tabular-nums ${
          status === 'done'
            ? 'text-emerald-400'
            : secRemaining <= countdownSeconds
              ? 'text-amber-400'
              : ''
        }`}
      >
        {status === 'done' ? 'Done' : `0:${String(secRemaining === 60 ? 0 : secRemaining).padStart(2, '0')}`}
      </p>
        <p className="text-3xl font-bold text-emerald-400">{repsText}</p>
        {audioErrorMessage}
      <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full bg-emerald-500 transition-[width]"
          style={{ width: `${(clamped / totalMs) * 100}%` }}
        />
      </div>
      <p className="text-sm text-zinc-500">Total: {formatClock(clamped / 1000)}</p>
      {status !== 'done' && (
        <div className="flex gap-3">
          {status === 'running' ? (
            <button
              type="button"
              className="rounded-lg border border-zinc-700 px-6 py-2 font-semibold hover:bg-zinc-800"
              onClick={pause}
            >
              Pause
            </button>
          ) : (
            <button
              type="button"
              className="rounded-lg bg-emerald-500 px-6 py-2 font-semibold text-zinc-950 hover:bg-emerald-400"
              onClick={() => {
                playMinuteAudio(minuteIdx, secIntoMinute)
                resume()
              }}
            >
              Resume
            </button>
          )}
          <button
            type="button"
            className="rounded-lg border border-zinc-700 px-6 py-2 font-semibold text-zinc-400 hover:bg-zinc-800"
            onClick={endEarly}
          >
            End early
          </button>
        </div>
      )}
      </div>
    </>
  )
}
