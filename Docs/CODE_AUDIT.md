# Drivix – Code Quality, Security & Architectural Audit

## 1. Audit Classification Methodology

Findings are evaluated based on security posture, data integrity, operational resilience, and code maintainability, classified into four severity tiers:

- **CRITICAL**: Immediate security vulnerabilities, credential exposures, or data-integrity risks.
- **HIGH**: Major functional flaws, concurrency vulnerabilities in multi-instance environments, or architectural contradictions.
- **MEDIUM**: Maintainability issues, technical debt, dead code, or performance bottlenecks.
- **LOW**: Minor code hygiene, naming inconsistencies, or missing edge-case validations.

---

## 2. Summary of Findings

| ID | Category | Severity | File Reference | Finding Summary |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Security | **CRITICAL** | `tests/test_phase1.js`, `test_phase2.js`, `test_phase3.js`, `ml_service/src/db_connector.py` | Hardcoded MongoDB Atlas database credentials in fallback strings |
| **SEC-02** | Security | **CRITICAL** | `exportBookings.js` | Hardcoded Firebase credentials in script file |
| **SEC-03** | Security | **HIGH** | `server.js` | Permissive CORS configuration (`origin: '*'`) on Express and Socket.IO |
| **SEC-04** | Security | **HIGH** | `routes/authRoutes.js` | Missing rate-limiting on authentication and OTP dispatch endpoints |
| **ARC-01** | Architecture | **HIGH** | `frontend/src/firebase.js` & `frontend/src/pages/Auth.jsx` | Broken phone authentication flow due to mock Firebase stub |
| **ARC-02** | Concurrency | **HIGH** | `backend/controllers/bookingController.js` | Local in-memory lock manager fallback unsafe for multi-instance scaling |
| **CLD-01** | Clean Code | **MEDIUM** | `backend/models/ParkingSlot.js`, `frontend/src/services/ParkingService.js`, `ParkingFacility/ShardaParking.js` | Unused legacy code and orphan schemas |
| **CLD-02** | Clean Code | **MEDIUM** | `backend/models/Parking.js` & `backend/models/ParkingLocation.js` | Schema model duplication targeting the same MongoDB collection |
| **PERF-01**| Performance | **MEDIUM** | `backend/server.js` | Unindexed background sweep worker executing collection-wide scans every 10 seconds |
| **VAL-01** | Validation | **LOW** | `backend/controllers/bookingController.js` | Missing schema validation for maximum future advance booking window |

---

## 3. Detailed Audit Findings

### 3.1 [CRITICAL] SEC-01: Hardcoded Database Credentials in Fallback Strings
- **Locations**:
  - `WebApp/backend/tests/test_phase1.js` (Line 13)
  - `WebApp/backend/tests/test_phase2.js` (Line 15)
  - `WebApp/backend/tests/test_phase3.js` (Line 14)
  - `ml_service/src/db_connector.py` (Line 20)
- **Problem**: The integration test suites and the Python database connector contain full MongoDB Atlas connection URI strings with plaintext usernames and passwords embedded as default fallbacks (`mongodb+srv://drivixmobility_db_user:...@drivix.irkmtpg.mongodb.net/drivix`).
- **Risk**: Anyone with read access to the repository can directly access, modify, or delete the operational production database.
- **Remediation**:
  1. Immediately rotate the MongoDB Atlas user password in the cloud dashboard.
  2. Strip all hardcoded fallback connection strings. Require `process.env.MONGO_URI` and `os.getenv("MONGO_URI")` to be explicitly provided in environment files.

---

### 3.2 [CRITICAL] SEC-02: Hardcoded Firebase API Credentials
- **Location**: `exportBookings.js` (Lines 7–13)
- **Problem**: Root-level export script embeds production Firebase configuration including `apiKey`, `projectId`, `appId`, and `messagingSenderId`.
- **Risk**: Unauthorized users can query and extract Firestore data collections.
- **Remediation**: Move all Firebase project credentials into `.env` and load via `process.env`.

---

### 3.3 [HIGH] SEC-03: Permissive CORS Configuration
- **Location**: `WebApp/backend/server.js` (Lines 52, 104–107)
- **Problem**: The Express server specifies `app.use(cors())` with default wildcard access, and the Socket.IO server specifies `origin: '*'`.
- **Risk**: Any arbitrary third-party website can forge cross-origin HTTP requests and connect WebSocket listeners to receive real-time parking status feeds and user alerts.
- **Remediation**: Whitelist specific production domains:
  ```javascript
  const allowedOrigins = [
    'https://drivix-pearl.vercel.app',
    'http://localhost:5173',
    'http://localhost:5000'
  ];
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  ```

---

### 3.4 [HIGH] SEC-04: Missing Rate Limiting on Auth Endpoints
- **Location**: `WebApp/backend/routes/authRoutes.js`
- **Problem**: Endpoints like `POST /api/v1/auth/login`, `POST /api/v1/auth/send-public-otp`, and `POST /api/v1/auth/verify-public-otp` lack IP-based rate limiting.
- **Risk**: Attackers can brute-force 6-digit OTP codes (only $10^6$ combinations) or spam the SMTP email service to exhaust quotas and run up email delivery charges.
- **Remediation**: Implement `express-rate-limit`:
  ```javascript
  import rateLimit from 'express-rate-limit';
  const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
  router.post('/send-public-otp', otpLimiter, sendPublicEmailOtp);
  ```

---

### 3.5 [HIGH] ARC-01: Broken Phone Authentication Flow in Frontend
- **Location**: `WebApp/frontend/src/firebase.js` & `WebApp/frontend/src/pages/Auth.jsx` (Lines 193–225)
- **Problem**: In `Auth.jsx`, phone login invokes Firebase `RecaptchaVerifier(auth, ...)` and `signInWithPhoneNumber(auth, ...)`. However, `firebase.js` exports a mock stub where `auth = { currentUser: null }` without an actual Firebase app initialization.
- **Impact**: Attempting phone authentication throws a runtime JavaScript exception when trying to instantiate the RecaptchaVerifier on an uninitialized object.
- **Remediation**: Either configure valid Firebase environment credentials in the frontend, or migrate phone authentication to use backend SMS delivery via Twilio / Fast2SMS.

---

### 3.6 [HIGH] ARC-02: Single-Process In-Memory Concurrency Lock
- **Location**: `WebApp/backend/controllers/bookingController.js` (Lines 54–70, 344)
- **Problem**: When a Mongoose transaction is not supported by the underlying MongoDB deployment (e.g. standalone local instances without replica sets), the controller falls back to `localLockManager.acquire(lockKey)` which uses an in-process JavaScript `Map()`.
- **Risk**: If the backend is scaled horizontally across multiple Node.js container instances (e.g. multi-instance cluster on Render or Kubernetes), separate Node processes do not share process memory. Two concurrent requests handled by separate containers could acquire the lock simultaneously, leading to double-booking.
- **Remediation**: Use distributed locking via Redis (`redlock`) using the existing connected Redis client in `config/redis.js`.

---

### 3.7 [MEDIUM] CLD-01: Dead Code & Orphaned Files
- **Files**:
  - `WebApp/backend/models/ParkingSlot.js`: An isolated model that is never imported or queried anywhere in the backend (superseded by `Slot.js`).
  - `WebApp/frontend/src/services/ParkingService.js`: Legacy Firestore listener; never imported in `App.jsx`.
  - `WebApp/frontend/src/ParkingFacility/ShardaParking.js`: Legacy Firestore seeder; unused.
  - `WebApp/frontend/src/pages/Booking.jsx`: Route `/booking` redirects to `/find`; the component is dead code.
- **Impact**: Increases cognitive load and confuses developers regarding authoritative models and services.
- **Remediation**: Safely archive or deprecate these files in a future maintenance cycle.

---

### 3.8 [MEDIUM] CLD-02: Collection Duplication (`Parking.js` vs `ParkingLocation.js`)
- **Location**: `WebApp/backend/models/Parking.js` and `models/ParkingLocation.js`
- **Problem**: Both models define schemas for parking locations and explicitly target the same MongoDB collection name (`'parkinglocations'`).
- **Impact**: `ParkingLocation` has the virtual `floorsList` and newer fields, while `Parking.js` is an older declaration. Mixing model imports across controllers risks subtle schema differences.
- **Remediation**: Standardize all controllers and seeders on `ParkingLocation.js` and deprecate `Parking.js`.

---

### 3.9 [MEDIUM] PERF-01: Background Sweep Worker Query Inefficiencies
- **Location**: `WebApp/backend/server.js` (Lines 121–264)
- **Problem**: The background scheduler executes `Slot.find()` and `Booking.find()` every 10 seconds:
  ```javascript
  const expiredBookings = await Booking.find({
    status: { $in: ['booked', 'Confirmed', 'Slot Assigned', 'Checked In'] }
  });
  ```
  It then iterates through all active bookings with in-memory date calculations. As booking volume grows to tens of thousands of records, querying and looping every 10 seconds will cause CPU spikes and event-loop lag.
- **Remediation**: Add a compound database index on `{ status: 1, bookingDate: 1, endTime: 1 }` and filter for expired bookings directly inside the MongoDB query projection.

---

### 3.10 [LOW] VAL-01: Missing Maximum Advance Reservation Limit
- **Location**: `WebApp/backend/controllers/bookingController.js` (Lines 191–217)
- **Problem**: Validation checks that the booking date is not in the past, but does not impose a maximum future window limit (e.g. maximum 30 days in advance).
- **Impact**: Users could create reservations for dates 5 years in the future, blocking slot capacity calculations indefinitely.
- **Remediation**: Add validation restricting `entryDate <= today + 30 days`.

---

## 4. Prioritized Action Plan Before Adding New Features

1. **Phase 1: Security Hardening**
   - Rotate MongoDB Atlas database credentials.
   - Remove hardcoded credentials from test files and python scripts.
   - Restrict CORS origin whitelist to production and local development URLs.
   - Attach rate-limiting middleware to all authentication routes.
2. **Phase 2: Concurrency & Scalability Protection**
   - Implement Redis-based distributed locks (`redlock`) for horizontal scaling.
   - Optimize the 10-second sweep worker query with targeted compound indexes.
3. **Phase 3: Codebase Cleanup**
   - Consolidate `ParkingLocation` as the sole facility model and remove `Parking.js` and `ParkingSlot.js`.
   - Remove dead Firestore prototype files (`ParkingService.js`, `ShardaParking.js`, `exportBookings.js`).
