# Fit – Thinus's daily training app (v1.0)

Phone-first PWA: tells you what to do today and tracks progress. All data stays on the phone (IndexedDB), no accounts, no analytics. Back it up via ⚙ → Export.

## Run it on Windows (PowerShell)
```
cd "C:\Users\thinu\Grok bot\fitness-app"
npm.cmd install
npm.cmd run dev -- --host
```
Open the `Network:` address it prints (port **5181**) in Chrome on the S24 Ultra (same Wi-Fi). Add `#demo` to the URL once to load sample data (it overwrites the start date – reset it in ⚙).
Chrome menu ⋮ → *Add to Home screen* for an app icon. The offline cache / install-as-app and screen wake lock work fully when served over HTTPS (e.g. Firebase Hosting later); `npm.cmd run build` makes `dist/`.

## The program
- Mon / Wed / Fri: Strength, alternating A and B (3 min bike warm-up first)
  - A: goblet squat + DB bench · bent-over barbell row + DB shoulder press · plank 30–45 s
  - B: barbell RDL + incline DB press · DB split squat + one-arm DB row · dead bug or crunches ×12
  - 8–12 reps, 45–60 s rest between supersets (rest timer auto-starts after the second exercise of a superset; 60 s default, editable)
- Tue: bike 30 min steady (can still talk). Thu: 5 min warm-up, 8 × 30 s hard / 90 s easy, cool-down (interval timer with beeps + wake lock)
- Sat: easy 30 min walk or light bike. Sun: rest.
- Weeks 1–2: 2 sets, light, Thursday is an easy ride. Week 3+: 3 sets + intervals. Every 7th week is a deload (2 sets, ~85% weight) – change in ⚙ (0 = off).
- Hit 12 reps on every set → next time it pre-fills more weight (+2.5 kg barbell, +2 kg dumbbell; plank +5 s).

## Tracking
Workout runner pre-fills last weight/reps, one tap per set. Log tab = history. Progress = top weight + estimated 1RM per exercise, body weight, waist, weekly streak (5+ of the 6 Mon–Sat sessions). Daily check-in: protein (tick, grams, USN Hardcore Whey scoop quick-add – grams/scoop in ⚙), sleep hours (7+), steps (7–8k). Weigh-in prompt weekly, waist prompt after 2 weeks.


## v2.0 – what's new
- **Quick log ("What did you do?")** – tick exercises from a searchable list (planned + recent first); each is prefilled from your last session, adjust with big −/+ steppers, add/remove sets, Save. Works any day. **Repeat last session** in one tap.
- **75-exercise library** with muscles, cues, difficulty, defaults and ⭐ best-bang-for-buck flags. **Swap** button in the workout runner; optional 4-week variation rotation (⚙).
- **Body-part picker** – front/back body map + chips, best exercises first, *Add to today*, *Info*, and **Build me a 30-min workout**.
- Undo after delete, last-time hints, PR badges, exercise detail page with history chart.
- Existing data is migrated automatically (IndexedDB v2); exports from v1 still import.

## v2.1 — visual overhaul
Dark-first design system (lime→teal accent, light/auto theme in Settings), hero card with weekly-goal ring, streak flame, protein/sleep/steps activity rings, big set rows with tick pop + haptics, circular rest-countdown ring, full-screen interval ring (hot = hard, cool = easy), muscle colour chips, improved body map, smooth gradient charts with tap tooltips, icon nav with active pill, empty states, new icon + splash. Respects prefers-reduced-motion. No data changes.

## Deploy / dev
Live: https://looier.github.io/fitness-app/ (built `dist/` is pushed to the `gh-pages` branch; `.github/workflows/deploy.yml` is kept locally for Actions deploys once a token with `workflow` scope is used).
Vite `base` is `/fitness-app/`, so local dev/preview is at http://localhost:5181/fitness-app/.

## v2.2
- Animated stick-figure demo for every exercise (detail page, runner how-to sheet via ⓘ, thumbnails in library/quick-log).
- Rewritten how-to: plain steps, "Feel it in", common mistakes, easier/harder options, Watch-on-YouTube link.
- Reduced-motion shows start/finish poses side by side.
