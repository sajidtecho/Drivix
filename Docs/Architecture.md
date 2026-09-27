# Drivix System Architecture Document

## 1. System Overview

**Drivix** is a high-performance, smart parking and urban mobility ecosystem structured as a decoupled monorepo. It integrates real-time slot tracking, atomic concurrency locking, multi-criteria slot allocation, FASTag digital payments, ANPR gate simulation, and machine learning dynamic pricing.

```
+-----------------------------------------------------------------------+
|                            DRIVIX ECOSYSTEM                            |
+------------------------------------+----------------------------------+
                                     |
    +--------------------------------+--------------------------------+
    |                                |                                |
    v                                v                                v
+-----------------------+  +-------------------+  +-------------------+
|      WebApp           |  |       App         |  |    ml_service     |
| (React + Vite + CSS)  |  | (Expo / React N.) |  | (Python Random F.)|
+-----------+-----------+  +---------+---------+  +---------+---------+
            |                        |                      |
            +-------------------+----+                      |
                                |                           |
                                v                           v
                   +--------------------------+  +--------------------+
                   |     WebApp Backend       |  | Dynamic Pricing ML |
                   |  (Express + Socket.IO)   |  |     Estimator      |
                   +------------+-------------+  +--------------------+
                                |
                                v
                   +--------------------------+
                   |  Database & Cache Layer  |
                   | (MongoDB Atlas + Redis)  |
                   +--------------------------+
```

---

## 2. Core Subsystems

### 2.1 WebApp (`WebApp/`)
- **Frontend (`WebApp/frontend`)**: Built with React, Vite, and custom Vanilla CSS design tokens. Features glassmorphism HUD indicators, interactive multi-floor 2D slot maps, ANPR gate simulators, and Google Maps API integration (`@react-google-maps/api`).
- **Backend (`WebApp/backend`)**: Node.js + Express REST API server with Socket.IO real-time hub.
  - **Controllers**: Authentication, Bookings, Parking Facilities, FASTag, ANPR Gate, Banners, Places, Partners, Vehicles, Complaints.
  - **Services**: `SlotAllocationService.js` (multi-criteria scoring engine with optimistic concurrency protection).
  - **Middleware**: JWT authentication protection (`authMiddleware.js`), Centralized error handling (`errorMiddleware.js`).

### 2.2 Mobile App (`App/`)
- Built with **Expo** and **React Native** utilizing Expo Router for file-based navigation.
- Features real-time radar location tracking, One UI 7 inspired floating tab bar (`app-tabs.tsx`), digital ANPR gate pass generator (`QRPacketPass.tsx`), driver hub services, and FASTag wallet management.
- Integrates native device location (`expo-location`) and direct turn-by-turn navigation deep-linking (`navigation.ts`).

### 2.3 Machine Learning Service (`ml_service/`)
- Python-based machine learning subsystem using Random Forest models (`scikit-learn`, `pandas`).
- Preprocesses historical transaction data, evaluates occupancy surge ratios, peak hours, weather conditions, and special holidays to output demand scores (0–100) for deterministic dynamic pricing scaling.

---

## 3. Concurrency Protection & Atomic Soft Locks

To prevent race conditions during concurrent booking attempts:
1. **Atomic Lock Acquisition**: When a user selects an open parking slot, the backend executes a `findOneAndUpdate` query matching `{ _id: slotId, isLocked: false, isBooked: false }`.
2. **5-Minute Reservation Window**: Upon successful lock acquisition, a 5-minute checkout timer starts.
3. **Automated Sweep Worker**: A background scheduler in `server.js` sweeps MongoDB every 10 seconds to release soft-locks where checkout was abandoned or expired without payment.

```
User A ---> [API Server] ---> findOneAndUpdate({ slot: A3, isLocked: false }) ---> [DB Lock Success] (5 Min Timer Starts)
User B ---> [API Server] ---> findOneAndUpdate({ slot: A3, isLocked: false }) ---> [DB Lock Failed]  (Slot Occupied Error)
```

---

## 4. Navigation & Live GPS Routing Subsystem

Drivix uses a 1-tap live GPS navigation routing engine across both Web and Mobile platforms:
- **Web (`navigationUtils.js`)**: Dynamically fetches browser `navigator.geolocation` live coordinates and constructs:
  `https://www.google.com/maps/dir/?api=1&origin={LIVE_LAT},{LIVE_LNG}&destination={DEST_LAT},{DEST_LNG}&travelmode=driving`
- **Mobile (`navigation.ts`)**: Uses `expo-location` to retrieve live device coordinates and launches native intents:
  - **iOS**: `maps://app?saddr={LIVE_GPS}&daddr={DEST_LAT},{DEST_LNG}&dirflg=d`
  - **Android**: `google.navigation:q={DEST_LAT},{DEST_LNG}&mode=d`
  - **Web Fallback**: Google Maps driving directions with live origin.

This bypasses manual starting point input boxes so navigation opens immediately in active turn-by-turn driving mode (Rapido/Uber/Ola style).

---

## 5. Deployment Infrastructure

- **Frontend WebApp**: Hosted on Vercel Edge Network.
- **Backend API Server**: Deployed on Render container service with an automated keep-alive cron ping (`cron-job.org`) to prevent free-tier cold-start delays.
- **Database**: MongoDB Atlas multi-region cloud cluster.
