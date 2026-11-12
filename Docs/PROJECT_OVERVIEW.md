# Drivix – Project Overview

## 1. Executive Summary & Purpose

**Drivix** is an enterprise-grade, full-stack, AI-powered smart parking and urban mobility ecosystem engineered to eliminate urban congestion, prevent double-booking race conditions, automate gate access control, and optimize facility yield through dynamic pricing.

Urban drivers spend up to 20 minutes circling dense commercial hubs (such as Connaught Place, Noida Sector 18, and Cyber City) searching for vacant parking slots. Traditional parking systems rely on paper slips, manual booth operators, and disconnected gates, leading to traffic bottlenecks, lost revenue, and lack of transparency.

Drivix solves these systemic mobility challenges by delivering an integrated digital flight deck composed of:
1. **Interactive Multi-Floor 2D Slot Tracking & Atomic Soft-Locks**: Sub-second floor capacity calculations with a 5-minute atomic soft-lock to prevent concurrency collisions.
2. **Automated Multi-Criteria Slot Allocation**: A configurable scoring engine that evaluates floor preference, walking distance, vehicle type compatibility, EV charging readiness, and accessibility needs.
3. **Reactive ANPR (Automatic Number Plate Recognition) Gate Simulation**: Real-time license plate optical verification at entry and exit gates with automatic barrier control and reactive slot assignment.
4. **Hybrid Dynamic Pricing Engine**: A dual-layer pricing mechanism coupling an offline/online trained machine learning estimator (XGBoost + SGD online residual learner running on FastAPI) with deterministic, explainable safety bounding rules.
5. **Direct 1-Tap Live GPS Driving Navigation**: Turn-by-turn driving navigation deep-linked from live device coordinates (via Apple Maps, Google Navigation Intents, and Google Maps Driving Directions), eliminating manual origin inputs.
6. **Cross-Platform Access**: A responsive Cyberpunk glassmorphic Web Application (React + Vite) and a native Mobile Application (React Native + Expo).

---

## 2. Core Features & Capabilities

| Capability Module | Description | Technical Implementation |
| :--- | :--- | :--- |
| **Smart Parking Discovery** | Real-time map & list view of parking locations across Delhi NCR (NDMC, South Delhi, Noida, Greater Noida) with live slot counters, hourly rates, and EV badges. | Leaflet, Google Maps API, compact 360px floating popover modal, REST API |
| **Atomic Soft-Lock Concurrency** | 5-minute checkout reservation hold preventing race conditions when multiple drivers tap the same slot simultaneously. | MongoDB `findOneAndUpdate` atomic operators, countdown timer, auto-release background worker |
| **Reactive Slot Allocation** | Rule-based and heuristic multi-criteria slot assignment considering EV requirements, walking distance, floor match, and accessibility. | `SlotAllocationService.js`, optimistic retry loop (5 attempts), signed JWT QR pass generator |
| **ANPR Gate Simulator** | Optical plate scanning simulation for entry/exit barriers, reactive slot allocation for confirmed reservations, and real-time gate state broadcasting. | `gateController.js`, `AnprGateSimulator.jsx`, Socket.IO `gateStateChanged` events |
| **Hybrid Dynamic Pricing** | Real-time pricing adjustment factoring in current occupancy, peak hours, weather, events, and historical demand. | Python FastAPI ML microservice, XGBoost regression, online SGD partial fit, fallback heuristic engine |
| **FASTag Auto-Debit** | Digital FASTag wallet management, threshold auto-recharge triggers, toll estimation, and transaction histories. | `fastagController.js`, `FASTag.js`, `FASTagTransaction.js` |
| **Driver Hub Amenities** | On-demand booking of ancillary services including in-bay car wash, EV fast charging, rest lounge seating, and cafeterias. | `CarWashCenter.js`, `washCenterRoutes.js`, service bundle additions in checkout |
| **Turn-by-Turn GPS Routing** | 1-tap navigation directly launching driver's native GPS navigation apps with current coordinates as the starting point. | `navigationUtils.js` (Web), `navigation.ts` (Mobile) |
| **Admin Operations Suite** | Comprehensive back-office dashboard for managing facilities, floors, slots, users, revenue, banners, partner applications, and support tickets. | React Admin Layout, role-based JWT auth guards (`adminOnly`) |

---

## 3. Technology Stack

### Frontend Web Application (`WebApp/frontend`)
- **Core Framework**: React 19.2, React DOM 19.2
- **Build Tool & Bundler**: Vite 8.0 with ES modules
- **Routing**: React Router DOM v7 (Data & Component routing)
- **State Management**: Zustand 5.0 (`useBookingStore`), React Context API (`UserContext`, `ToastContext`)
- **Design & Styling**: Custom Cyberpunk Dark Mode Vanilla CSS, Glassmorphism, CSS tokens, Framer Motion 12
- **Maps & Location**: Leaflet 1.9, `@react-google-maps/api` 2.20
- **Real-Time Communication**: Socket.IO Client 4.8
- **Utilities**: `lucide-react`, `react-icons`, `qrcode.react`, `html-to-image`

### Mobile Application (`App/`)
- **Core Framework**: React Native 0.86, Expo 57, Expo Router 57
- **Language**: TypeScript 6.0 / React 19
- **Navigation**: Expo Router (file-based) + React Navigation (Native Stack + Bottom Tabs)
- **State Management**: React Context (`AuthContext`, `BookingContext`), AsyncStorage
- **Sensors & Hardware**: `expo-location`, `expo-camera` / `react-native-vision-camera`, `expo-image-picker`
- **Real-Time Communication**: Socket.IO Client 4.8 with app state background lifecycle guards
- **Styling**: Cyberpunk Dark Theme tokens (`colors.ts`, `spacing.ts`, `typography.ts`, `shadows.ts`)

### Backend API Server (`WebApp/backend`)
- **Runtime Environment**: Node.js (ES Module format)
- **Framework**: Express.js 4.19
- **Real-Time WebSocket Engine**: Socket.IO 4.8 bound to Node HTTP Server
- **Database ODM**: Mongoose 9.7 (MongoDB Atlas / local fallback)
- **In-Memory Cache**: Redis 6.2 client (with graceful offline fallback)
- **Security & Middleware**: `helmet`, `cors`, `morgan`, `bcryptjs`, `jsonwebtoken`
- **Email Service**: `nodemailer` with SMTP configuration and console OTP fallback

### Machine Learning Microservice (`ml_service/`)
- **Framework**: Python 3.10+, FastAPI 0.110+, Uvicorn
- **ML Algorithms**: XGBoost Regressor, Scikit-Learn (SGDRegressor for online residual learning, HistGradientBoosting, RandomForest)
- **Data Engineering**: Pandas, NumPy, Joblib
- **Database Streaming**: PyMongo (direct operational database connection for streaming online learning)
- **MLOps & Monitoring**: Kolmogorov-Smirnov drift detection, Population Stability Index (PSI), automated Champion-vs-Challenger validation gate

### Cloud Infrastructure & Hosting
- **Frontend Hosting**: Vercel Edge Network
- **Backend API Hosting**: Render Web Service (containerized via Docker)
- **Database**: MongoDB Atlas Cloud Cluster
- **Containerization**: Multi-service Docker Compose (`docker-compose.yml`)
- **Keep-Alive Worker**: cron-job.org HTTP ping triggers to eliminate cold starts

---

## 4. Architectural Summary

Drivix is architected as a decoupled monorepo adhering to service-oriented separation of concerns:

```
[ WebApp Frontend (React/Vite) ]  <--->  [ Express Backend API (Node.js) ]  <--->  [ MongoDB Atlas ]
[ Mobile App (Expo/React Native)]  <--->         ^           |                       ^
                                                 |           v                       |
                                         [ Socket.IO Hub ] [ Redis Cache ]           |
                                                 |                                   |
                                                 v                                   |
                                       [ FastAPI ML Service (Python) ] --------------+
```

1. **Clients (Web & Mobile)** initiate RESTful requests for CRUD operations and hold persistent Socket.IO listeners for live slot state and barrier gate events.
2. **Express API Server** acts as the central orchestrator, executing business rules, database queries, and atomic concurrency locks.
3. **MongoDB Atlas** persists state across parking facilities, floors, slots, users, vehicles, and bookings.
4. **FastAPI ML Service** runs inference for dynamic pricing and continuously learns from incoming transaction telemetry.

