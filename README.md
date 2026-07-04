# Kettlebell Tracker

A local-first web app for a 4-day single-kettlebell program merging Mark Wildman's
"Tetris of Training" / "Nerd Math" system with Ben Patrick's ATG (Knees Over Toes)
joint-armor work. All data stays in your browser's localStorage — no accounts, no server.

## What it does

- **Guided sessions** — Day A (Swings + Turkish Get-Ups + Floor Pullovers), Day B
  (Clean & Press + Squats + ATG Split Squats), and Active Recovery, each bookended by the
  ATG-integrated warm-up (tibialis raises, elephant walks) and cool-down (seated good
  mornings) sequences.
- **Built-in timers** — EMOM timers with beeps at the top of every minute (and a 3-2-1
  countdown into each one), a guided interval timer for warm-up/cool-down, a self-paced
  rung tracker with rest clock for Clean & Press reverse ladders, and a sets tracker for
  the ATG movements.
- **Hit / missed inputs** — after each movement you record whether you hit the rep/time
  goal with perfect form.
- **Automatic progression** — hit a goal and the target advances (time → density →
  complexity for the Wildman lifts; reps and elevation→depth→load for the ATG armor);
  miss and it holds. The TGU and ATG Split Squat advance after two consecutive hits
  (≈ one week at two sessions per week).
- **History** — every saved workout is logged with the exact target attempted.
- **Settings** — set your starting rep counts or correct a target manually; reset everything.

## Stack

- [TanStack Start](https://tanstack.com/start) in SPA mode (fully static build)
- [TanStack Router](https://tanstack.com/router) file-based routes
- [TanStack Store](https://tanstack.com/store) + localStorage persistence
- Tailwind CSS 4, Vite, Vitest

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # progression logic tests
npm run build   # static output in dist/client
```

## Deploying to GitHub Pages

The repo ships with `.github/workflows/deploy.yml`. One-time setup:

1. Create a GitHub repository and push this project to its `main` branch.
2. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.

Every push to `main` then tests, builds, and deploys automatically. The workflow sets
`VITE_BASE` to `/<repo-name>/` (or `/` for a `*.github.io` user site) so assets and routes
resolve, and copies `index.html` to `404.html` so deep links like `/session/a` work on
Pages' static hosting.

## Notes

- Timers use the Web Audio API for beeps and request a screen wake lock while running;
  tap the Start button (a user gesture) so mobile browsers allow the audio.
- Data lives in localStorage under `workout-tracker:*` keys — clearing site data resets
  the program.
