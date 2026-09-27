# Drivix Engineering Rules & Architectural Guidelines

## 1. UI/UX & Design Rules

1. **High-Fidelity Aesthetics Only**: All interfaces must use the Drivix Cyberpunk dark mode design system (glassmorphism panels, dark backdrops `#0b0c10`/`#0c0e17`, curated color tokens). Never use default browser styles or basic plain white layouts.
2. **Compact Map Popovers**: Map location cards must be styled as compact popover boxes (e.g. `maxWidth: 360px`, `left: 50%`, `x: -50%`) rather than full-width bottom sheet banners that obscure the entire map.
3. **Direct Live GPS Routing**: Navigation buttons must always invoke direct turn-by-turn driving routes starting from the user's current live location using `launchLiveGpsNavigation()` (Web) or `launchMobileLiveGpsNavigation()` (Mobile). Never ask the user to manually enter a starting location.

---

## 2. Code Logic & Safety Rules

1. **No Guessing Code Schemas or Paths**: Inspect actual code source files before making edits.
2. **Empirical Verification Required**: Never declare a task resolved without running build/verification commands (`npm run build` or `npx tsc --noEmit`).
3. **No Blocking Synchronizations**: Avoid blocking loops or blocking main thread execution on web/mobile dispatchers.
4. **Preserve API Contracts**: When updating backend routes or service signatures, update all corresponding caller sites in WebApp and Mobile App.

---

## 3. Concurrency & Database Rules

1. **Atomic Soft Locks**: Slot reservation updates must always use atomic database operations (`findOneAndUpdate`) matching `{ _id: slotId, isLocked: false, isBooked: false }`.
2. **Auto-Release Worker**: Maintain server-side background sweep workers to release expired soft locks and keep slot availability synchronized.
