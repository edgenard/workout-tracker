let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, durationMs: number, delayMs = 0, volume = 0.4): void {
  const ac = getContext()
  if (!ac) return
  const start = ac.currentTime + delayMs / 1000
  const end = start + durationMs / 1000
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, start)
  gain.gain.exponentialRampToValueAtTime(0.001, end)
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.start(start)
  osc.stop(end)
}

/** Short click for 3-2-1 countdown into a new minute */
export function tick(): void {
  tone(880, 90)
}

/** A timed movement reached zero — lower double tone, distinct from countdown ticks. */
export function zeroBeep(): void {
  tone(520, 180)
  tone(520, 180, 220)
}

/** Top of a new EMOM minute / next warm-up segment */
export function minuteBeep(): void {
  tone(1200, 160)
  tone(1200, 160, 220)
}

/** Mid-segment switch (change sides / next set) — low-high two-tone, distinct from the minute beep */
export function switchBeep(): void {
  tone(650, 300)
  tone(975, 300, 350)
}

/** Timer finished */
export function finishBeep(): void {
  tone(1000, 180)
  tone(1200, 180, 220)
  tone(1500, 450, 440)
}

/** Call from a user gesture (Start button) so iOS/Safari allows audio later */
export function unlockAudio(): void {
  getContext()
}
