# Drivix – System Architecture & Data Flow

## 1. System Architecture Overview

Drivix is architected as an event-driven, service-oriented ecosystem structured across four primary subsystems:

```
+-----------------------------------------------------------------------------------------+
|                                    DRIVIX ECOSYSTEM                                     |
+-----------------------------------------------------------------------------------------+
                                             |
             +-------------------------------+-------------------------------+
             |                               |                               |
             v                               v                               v
+-------------------------+     +-------------------------+     +-------------------------+
|   WebApp Frontend       |     |   Mobile App (Expo)     |     |   FastAPI ML Service    |
|   (React 19 + Vite)     |     |   (React Native 0.86)   |     |   (Python 3.10)         |
|   • Vercel Edge Hosting |     |   • One UI 7 Floating Bar   |     |   • XGBoost Pipeline    |
|   • Cyberpunk Dark CSS  |     |   • Native GPS Intent       |     |   • Online SGD Learner  |
|   • Zustand + Context   |     |   • QR Packet Pass          |     |   • Drift Monitoring    |
+------------+------------+     +------------+------------+     +------------+------------+
             |                               |                               |
             +---------------+---------------+                               |
                             | HTTP REST / WebSocket                         | HTTP REST
                             v                                               | /predict
             +------------------------------------------------+              |
             |           Express.js API Backend               |<-------------+
             |           (Node.js ES Modules)                 |
             |   • JWT Auth & RBAC Security                   |
             |   • SlotAllocationService (Multi-Criteria)     |
             |   • Atomic Soft-Lock Controller                |
             |   • Socket.IO Real-Time Broadcast Hub          |
             |   • 10-Second Auto-Sweep Daemon                |
             +-----------------------+------------------------+
                                     |
                     +---------------+---------------+
                     |                               |
                     v                               v
     +-------------------------------+   +-------------------------------+
     |      MongoDB Atlas Cluster    |   |     Redis In-Memory Cache     |
     |   • 14 Operational Schemas    |   |   • Floor Availability Cache  |
     |   • Compound Indexes & TTL    |   |   • Reconnection Fallback     |
     +-------------------------------+   +-------------------------------+
```

---

## 2. Frontend Architecture (`WebApp/frontend`)

### 2.1 Initialization & Bootstrap
1. **Entry Point**: `src/main.jsx` initializes `createRoot()` with `StrictMode`.
2. **Provider Hierarchy**:
   ```jsx
   <StrictMode>
     <UserProvider>       {/* Manages JWT auth state, token in localStorage */}
       <ToastProvider>    {/* Global floating toast notification system */}
         <BrowserRouter>  {/* React Router DOM v7 client-side routing */}
           <App />        {/* App route tree and ambient visualizers */}
         </BrowserRouter>
       </ToastProvider>
     </UserProvider>
   </StrictMode>
   ```
3. **Initial Load Gate**: `App.jsx` displays a sleek `<LoadingScreen />` for 1.5 seconds on cold launch before rendering the interface.

### 2.2 Routing & Navigation Structure
- **Public & Driver Routes**:
  - `/`: Public landing page (`LandingPage.jsx`) showcasing problem statements, features, and case studies.
  - `/login`: Unified login, registration, and OTP verification (`Auth.jsx`).
  - `/find` & `/parking`: Facility discovery list with filters and interactive map launcher (`ParkingList.jsx`).
  - `/slot-layout/:id`: Interactive 2D floor visualizer with atomic soft-locks (`SlotLayout.jsx`).
  - `/slot-booking`: Booking duration, vehicle details, dynamic price quote, and checkout (`SlotBookingForm.jsx`).
  - `/ticket`: Active digital parking pass with QR code and turn-by-turn navigation (`Ticket.jsx`).
  - `/anpr`: Live optical scan simulation for entry and exit gates (`AnprGateSimulator.jsx`).
  - `/services`: In-hub car wash, detailing, and EV charging directory (`VehicleServices.jsx`).
  - `/profile`: Driver profile, vehicle management, and compliance document vault (`Profile.jsx`).
- **Protected Admin Routes** (Guarded by `AdminRoute.jsx` & `AdminLayout.jsx`):
  - `/admin`: Dashboard metrics, total bookings, active users, and revenue summary (`AdminDashboard.jsx`).
  - `/admin/bookings`: Global booking list, manual cancellations, and slot vacating (`AdminBookings.jsx`).
  - `/admin/users`: User role management and membership plan modifications (`AdminUsers.jsx`).
  - `/admin/parking`: Facilities, floors, and bulk slot creation (`AdminParking.jsx`).
  - `/admin/pricing`: Dynamic pricing multiplier simulation and base rates (`AdminPricing.jsx`).
  - `/admin/partners`: Facility operator onboarding requests (`AdminPartners.jsx`).
  - `/admin/complaints`: Customer grievance ticket queues (`AdminComplaints.jsx`).
  - `/admin/banners`: Marketing promotions and click/impression tracking (`AdminBanners.jsx`).

### 2.3 State Management Architecture
- **Global Auth State (`UserContext.jsx`)**: Holds `user`, `token`, `isAuthenticated`, `login`, `register`, `logout`, and auto-syncs `drivix_auth_token` in `localStorage`.
- **Booking Flow State (`bookingStore.ts`)**: Built with **Zustand**; holds `bookingDetails`, `selectedSlot`, target `location`, `floor`, and `dynamicPricing` parameters across page transitions without props drilling.
- **Toast Notifications (`ToastContext.jsx`)**: Global queue rendering toasts for slot status updates and network errors.

### 2.4 Styling & Design Tokens
- **Theme**: Cyberpunk Dark Mode with frosted glass panels (`background: rgba(18, 22, 34, 0.75)`, `backdrop-filter: blur(12px)`).
- **Design Tokens**: Standardized CSS variables defined in `index.css`:
  - Backgrounds: `--bg-primary` (`#0c0e17`), `--bg-secondary` (`#121622`), `--bg-tertiary` (`#1a2030`).
  - Accents: `--accent-primary` (`#3b82f6`), `--accent-cyan` (`#00f0ff`), `--accent-amber` (`#f59e0b`), `--accent-rose` (`#f43f5e`).
  - Borders: `--glass-border` (`rgba(255, 255, 255, 0.08)`).
- **Responsive Viewports**: Mobile-friendly media queries adjusting card layouts, bottom sheet dialogs, and navigation pills.

---

## 3. Backend Architecture (`WebApp/backend`)

### 3.1 Server Bootstrap & Lifespan
- **File**: `server.js`
- **Module System**: Node.js Native ES Modules (`type: "module"` in `package.json`).
- **Startup Sequence**:
  1. Load environment variables via `dotenv.config()`.
  2. Connect to MongoDB Atlas via `connectDB()`; fall back to local MongoDB if Atlas fails.
  3. Attempt Redis connection via `connectRedis()`.
  4. Execute startup seeders: `seedBanners()`, `seedPlaces()`, `seedCarWashCenters()`.
  5. Run automated database migration: `runDatabaseMigration()` (syncs unlinked slots and bookings to `ParkingFloor` documents).
  6. Mount security middleware: `helmet`, `cors`, `express.json({ limit: '10mb' })`, `morgan('dev')`.
  7. Mount REST API route handlers.
  8. Attach Socket.IO real-time server to HTTP server.
  9. Start continuous 10-second auto-sweep cleanup worker.
  10. Listen on configured `PORT` (default: 5000).

### 3.2 Request Pipeline & Middleware Architecture
```
Incoming Request
      │
      ▼
helmet() & cors() Security Headers
      │
      ▼
express.json() & express.urlencoded() Body Parsers
      │
      ▼
morgan('dev') Logging
      │
      ▼
Express Router (Route Matching)
      │
      ├── [Public Route] ──► Controller Handler ──► Service / Repository ──► MongoDB
      │
      └── [Protected Route]
                │
                ▼
          protect Middleware (authMiddleware.js)
          • Parses 'Authorization: Bearer <token>'
          • jwt.verify(token, JWT_SECRET)
          • User.findById() attaches user to req.user
                │
                ├── [Admin Route] ──► adminOnly Middleware (verifies role === 'admin')
                │
                ▼
          Controller Handler ──► Service / Repository ──► MongoDB
```

### 3.3 Centralized Error Handling
- **Route Not Found**: `notFound` middleware catches unmapped routes and passes `404 Not Found` to error pipeline.
- **Global Exception Formatter**: `errorHandler` intercepts unhandled exceptions, sets status code (defaults to 500), and outputs standardized JSON:
  ```json
  {
    "message": "Error details",
    "stack": null
  }
  ```
  *(Stack traces are suppressed in production environments).*

---

## 4. Machine Learning Service Architecture (`ml_service`)

### 4.1 Hybrid Inference Architecture
The ML subsystem adopts a dual-stage architecture:
1. **Stage 1 (Sensor Occupancy Forecaster)**: HistGradientBoosting model (`occupancy_forecaster.joblib`) trained on 35,000+ real parking sensor events projecting lot capacity 30-60 minutes ahead.
2. **Stage 2 (Champion XGBoost Pricing Pipeline)**: XGBoost Regressor (`drivix_price_model.pkl`) evaluating:
   - Target location, total capacity, entry hour, day of week, weekend indicator.
   - Lead time to arrival, duration, occupancy at quote time, and request velocity.
3. **Stage 3 (Continuous Online SGD Residual Learner)**: `OnlineAdaptiveResidualLearner` (`online_learner.joblib`) continuously adjusts predictions using incremental SGD (`partial_fit`) on live completed transactions.
4. **Safety-Critical Business Rules Multiplier**: The AI outputs an explainable demand score (0–100); deterministic rules determine final multipliers to guarantee price fairness:
   - Demand Score $\ge 85$: Multiplier $1.05\times$ (Peak Demand Fair Adjustment).
   - Demand Score $\ge 70$: Multiplier $1.03\times$ (Busy Demand Fair Adjustment).
   - Demand Score $< 30$: Multiplier $0.97\times$ (3% Off-Peak Discount).
   - Default: $1.00\times$ (Standard Base Rate).

---

## 5. End-to-End Data Flow Trace

Tracing the complete lifecycle of a booking from user interaction to database persistence and real-time broadcast:

```
[ Driver taps 'Book Slot' on Web/Mobile ]
                 │
                 ▼  (HTTP POST /api/v1/bookings with Bearer JWT)
[ Express Router: bookingRoutes.js ]
                 │
                 ▼  (authMiddleware.protect verifies JWT signature)
[ Controller: bookingController.createBooking ]
                 │
                 ├─► [ Validates date/time not in past ]
                 ├─► [ Resolves ParkingLocation & ParkingFloor ]
                 ├─► [ getOverlappingCount() checks concurrent reservations ]
                 │
                 ▼  (Mongoose Transaction / Local Lock Manager)
[ Model: Booking.create() & Slot update in MongoDB Atlas ]
                 │
                 ├─► [ updateFloorCounters() synchronizes available capacity ]
                 ├─► [ notifyMlOnlineLearner() streams event to FastAPI ML ]
                 ├─► [ sendBookingNotification() dispatches email/SMS alert ]
                 │
                 ▼  (global.io.emit('floorCapacityUpdated'))
[ Socket.IO broadcasts live capacity to all connected clients ]
                 │
                 ▼  (HTTP 201 Response JSON)
[ Frontend Zustand store updates & routes to /ticket ]
```
