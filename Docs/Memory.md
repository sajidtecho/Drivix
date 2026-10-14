# Drivix Architecture & Context Memory

## 1. Project Context

- **Repository**: `d:\DrivixApps` (sajidtecho/Drivix)
- **Monorepo Structure**:
  - `WebApp/`: Primary web application (React + Vite frontend, Express + Socket.IO backend).
  - `App/`: Cross-platform mobile app (Expo + React Native with Expo Router).
  - `ml_service/`: Python Machine Learning dynamic pricing service.
  - `Docs/`: Architecture, Design, Memory, PRD, Rules, and Tasks documentation.

---

## 2. Key Architectural Decisions & Evolution

### 2.1 Decoupled Micro-Architecture
- Separated frontend client (Vercel) from Express backend API (Render) and Python ML service.
- Implemented hybrid polling / Socket.IO fallback wrapper (`socket.ts` / serverless sync) to prevent WebSocket disconnects when serverless functions pause.

### 2.2 Atomic Concurrency Slot Holds
- Prevented double-booking race conditions by implementing an atomic MongoDB `findOneAndUpdate` soft-lock pattern with a 5-minute checkout window and auto-release background sweep.

### 2.3 Removal of Obsolete AI Assistant & Alert Subsystem
- Streamlined project focus onto core smart parking, FASTag, ANPR gate access, and direct navigation by completely removing:
  - Standalone Python `AI_Alert_System` directory.
  - Web AI Assistant page (`ActiveCopilot.jsx`) and `/copilot` route.
  - Mobile AI Assistant screen (`copilot.tsx`) and voice assistant modal (`VoiceAssistantModal.tsx`).
  - Gemini AI client services (`geminiService.js`, `geminiService.ts`).
  - Backend safety alert routes (`safetyRoutes.js`, `safetyController.js`, `SafetyLog.js`) and Socket.IO copilot telemetry events.

### 2.4 Compact Map Popover Card Refinement
- Redesigned the map location card overlay in `NetworkMapModal.jsx`: Replaced the bulky full-width bottom sheet banner (`left: 16px, right: 16px`) with a compact, 360px popover card centered horizontally (`left: 50%, x: -50%`).

### 2.5 Direct Live GPS Navigation Engine (Rapido / Uber Style)
- Replaced standard search-query Google Maps URLs with direct live GPS turn-by-turn driving navigation:
  - Web (`navigationUtils.js`): Fetches live GPS coordinates and constructs `https://www.google.com/maps/dir/?api=1&origin={LIVE_GPS}&destination={DEST}&travelmode=driving`.
  - Mobile (`navigation.ts`): Uses `expo-location` and launches iOS Apple Maps (`maps://...`) or Android Navigation Intent (`google.navigation:q=...`).
  - Completely eliminates manual starting point input prompts.

---

## 3. Active Subsystems & Component Map

- **WebApp Backend (`WebApp/backend`)**: Express REST API on `http://localhost:5000` handling JWT auth, MongoDB Atlas/local persistence, Socket.IO broadcasts, ANPR gate simulator, multi-criteria slot allocation engine (`SlotAllocationService.js`), and atomic soft-lock concurrency holds (5-min auto-release window).
- **WebApp Frontend (`WebApp/frontend`)**: React + Vite client on `http://localhost:5173` featuring Cyberpunk glassmorphic design system, compact map popovers, direct 1-tap turn-by-turn driving GPS navigation (`navigationUtils.js`), interactive 2D multi-floor slot layout grid (`SlotLayout.jsx`), and comprehensive admin suite.
- **Mobile App (`App/`)**: Expo + React Native app featuring One UI 7 spring-animated floating tab bar, Sci-Fi radar map, QR packet gate pass generator, driver hub amenities, and native direct GPS driving navigation (`navigation.ts`).
- **Machine Learning Subsystem (`ml_service/`)**: Python Random Forest model engine predicting demand scores (0-100) based on occupancy, peak hours, weather, and event parameters for dynamic pricing rules.
- **Documentation Suite (`Docs/`)**: Complete specifications maintained across `Architecture.md`, `Design.md`, `PRD.md`, `Rules.md`, `Tasks.md`, and `Memory.md`.

---

## 4. Preparedness for New Features

- **System Memory Status**: Fully synced & primed.
- **Codebase Indexing**: All models, controllers, routes, frontend pages, mobile screens, ML scripts, and documentation files parsed and verified.
- **Engineering Rules**: Enforcing dark mode glassmorphism UI, atomic concurrency protection, non-blocking main loops, exact prop/API contract verification, and empirical build testing.

