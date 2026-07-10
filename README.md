# Kettlebell Tracker

A local-first, single-kettlebell workout tracker for a four-day program combining Mark Wildman's "Tetris of Training" / "Nerd Math" approach with ATG (Knees Over Toes) mobility and joint-armor work. It is a static web app: no account or server required.

## How it works

The app suggests the scheduled workout for the day, but any session can be started at any time:

| Day | Default session |
| --- | --- |
| Monday & Thursday | **Day A** — Swings, Turkish Get-Ups, Floor Pullovers |
| Tuesday & Friday | **Day B** — Clean & Press, Squats, ATG Split Squats |
| Wednesday | **Active Recovery** — warm-up and cool-down only |
| Saturday & Sunday | Rest |

Day A and Day B include the same timed warm-up and cool-down. The defaults are a starting plan, not a locked prescription: edit them to suit your training.

## During a session

- Timed warm-up/cool-down movements run as guided sequences, with configurable cue beeps and end-countdown audio.
- EMOM movements use a minute timer; ladder and sets-and-reps movements use completion trackers. Short transitions can be placed between movements.
- Record the reps actually completed for each core movement. A goal is marked hit when completed reps meet or exceed its target.
- An active workout, its current step, results, and timer state persist in the browser, so it can be resumed after navigation or a refresh. Starting another day offers the choice to resume or discard the active workout.
- Saving records only the core-workout results. Active Recovery saves as a warm-up/cool-down-only entry.

## Plan and progression

The **Plan** page explains the default weekly structure and progression ideas. Progression is manual: after a session, use **Settings** to change the current or next phase when you decide it is appropriate.

For every movement you can edit its variant, coaching cue, kettlebell use and weight, per-side setting, and format:

- timed duration and cue beeps;
- EMOM reps per minute and duration;
- reps and sets; or
- ascending/descending ladders.

Warm-up and cool-down exercises can be swapped, removed, or added, and transitions can be edited. Workout-plan changes are stored locally and can be reset along with history.

## History and progress

Each saved session records its date, target, completed reps, hit/miss status, and the load configured for that exercise at the time of the workout. You can delete individual history entries; doing so does not alter the workout plan.

The **Progress** page charts either a session total or an individual movement, per workout or cumulatively. Weighted output is `completed reps × recorded weight`; bodyweight output is completed reps. Switch the display between kg and lb. Bodyweight and weighted ATG split-squat results are kept separate because they are not directly comparable.

## Data and browser capabilities

All workout plans, history, presentation settings, active-session state, and timer state live in `localStorage` under `workout-tracker:*` keys. Clearing site data resets them. Timers use the Web Audio API and request a screen wake lock while running; start a timer with its button so mobile browsers can enable audio.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm test
npm run tsc
npm run build   # static output in dist/client
```

## Deploying to GitHub Pages

The included GitHub Actions workflow tests, builds, and deploys every push to `main`.

1. Push the project to a GitHub repository on the `main` branch.
2. In **Settings → Pages**, choose **GitHub Actions** as the source.

The workflow configures the correct base path for project or user sites and copies `index.html` to `404.html` so static GitHub Pages can serve direct app routes such as `/session/a`.

## Stack

- TanStack Start and TanStack Router (static SPA)
- React and TanStack Store
- Vite, Tailwind CSS, and Vitest
