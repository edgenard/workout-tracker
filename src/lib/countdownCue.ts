export const DEFAULT_COUNTDOWN_PERCENT = 10
export const DEFAULT_COUNTDOWN_MIN_SECONDS = 3

export interface CountdownCueConfig {
  countdownPercent?: number
  countdownMinSeconds?: number
}

export function countdownCueSeconds(durationSeconds: number, config: CountdownCueConfig): number {
  const duration = Math.max(1, Math.ceil(durationSeconds))
  const percent = config.countdownPercent ?? DEFAULT_COUNTDOWN_PERCENT
  const minimum = config.countdownMinSeconds ?? DEFAULT_COUNTDOWN_MIN_SECONDS
  return Math.min(duration, Math.max(minimum, Math.ceil(duration * percent / 100)))
}
