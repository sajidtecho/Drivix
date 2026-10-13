# Drivix — Smart Parking Mobile Application

A production-oriented React Native mobile application for **Drivix**, a smart parking reservation platform. Built with React Native, Expo, and TypeScript, strictly mirroring the booking logic, slot allocation rules, and backend API architecture of the Drivix platform.

---

## 1. Design System & Aesthetics

The application adheres strictly to the **Drivix Design System**:
* **Dominant Background**: Pure White (`#FFFFFF`).
* **Typography**: Crisp Near-Black typography (`#171717`) with secondary body text in `#666666`.
* **Brand Accents**: Beautifully balanced primary yellow (`#FFC928`), secondary yellow (`#FFD84D`), and subtle light yellow backgrounds (`#FFF9E6`).
* **Parking Availability Colors**:
  * 🟢 **Green** (`#218838`): Available slots.
  * 🔴 **Red** (`#D93025`): Occupied slots.
  * 🟡 **Yellow** (`#FFC928`): Reserved / Pending slots.
  * ⚪ **Gray** (`#999999`): Unavailable or disabled.

---

## 2. Architecture & Folder Structure

```
App/
├── src/
│   ├── api/                   # Typed API service modules & Axios HTTP client
│   │   ├── client.ts          # Central Axios client with JWT interceptor & base URL
│   │   ├── authApi.ts         # Authentication (login, register, profile)
│   │   ├── parkingApi.ts      # Parking hubs, floor capacity, dynamic pricing quotes
│   │   ├── bookingApi.ts      # Multi-step booking, arrival slot assignment, checkout
│   │   └── vehicleApi.ts      # Saved vehicle number plate management
│   ├── components/
│   │   └── common/            # Reusable UI Design System Library
│   │       ├── Button.tsx     # Primary yellow, outline, danger, loading states
│   │       ├── Card.tsx       # White surface, border, selected yellow style
│   │       ├── Input.tsx      # Labelled inputs with icons & error banners
│   │       ├── Badge.tsx      # Status, surge, and capacity badges
│   │       ├── BottomSheet.tsx# Samsung One UI draggable bottom modal sheet
│   │       ├── StepIndicator.tsx # Visual 5-step progress indicator
│   │       ├── Header.tsx     # Top navigation bar
│   │       ├── EmptyState.tsx # Empty data illustration with action CTA
│   │       └── LoadingOverlay.tsx # Modal spinner overlay
│   ├── navigation/
│   │   └── AppNavigator.tsx   # 4-tab bottom navigation + complete Stack Navigator
│   ├── screens/
│   │   ├── auth/              # LoginScreen & RegisterScreen
│   │   ├── home/              # HomeScreen (active booking banner, quick vehicles)
│   │   ├── parking/           # ParkingDiscoveryScreen & ParkingDetailScreen
│   │   ├── booking/           # 13-step booking flow screens:
│   │   │   ├── FloorSelectionScreen.tsx
│   │   │   ├── DurationSelectionScreen.tsx
│   │   │   ├── VehicleSelectionScreen.tsx
│   │   │   ├── BookingReviewScreen.tsx
│   │   │   └── BookingConfirmationScreen.tsx
│   │   ├── navigation/        # NavigationScreen (GPS launcher & Arrival Slot Assignment)
│   │   ├── profile/           # ActiveParkingScreen & ProfileScreen
│   │   └── history/           # BookingHistoryScreen (Upcoming, Active, Completed, Cancelled)
│   ├── store/
│   │   ├── AuthContext.tsx    # Persistent user session, token storage & profile
│   │   └── BookingContext.tsx # Multi-step booking draft, dynamic quotes & submission
│   ├── theme/                 # Centralized Design Tokens
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── typography.ts
│   │   └── shadows.ts
│   ├── types/                 # TypeScript interfaces for Models & API responses
│   └── __tests__/             # Unit & Integration tests for booking business logic
├── scripts/
│   └── test-booking-flow.js   # Zero-dependency test runner
├── .env.example               # Environment variables example
└── package.json
```

---

## 3. Critical Booking Flow (Matching Existing Website Rules)

The booking flow faithfully preserves the established Drivix platform rules:

| Step | Screen | Business Logic & Rules |
| :--- | :--- | :--- |
| **1. Find Parking** | `HomeScreen` / `ParkingDiscoveryScreen` | Search hubs by name or locality. Real-time availability from `/api/v1/parking`. |
| **2. Select Hub** | `ParkingDetailScreen` | View address, amenities, operating hours, floor list, and base hourly rate. |
| **3. Select Floor** | `FloorSelectionScreen` | **Floor Capacity Reservation**: In Drivix, users reserve capacity on a specific floor. Physical slot assignment is intentionally deferred until arrival. |
| **4. Select Duration** | `DurationSelectionScreen` | Date, entry time, duration in hours. Fetches authoritative ML dynamic price quote (`/parking/:facilityId/pricing`). |
| **5. Vehicle Details** | `VehicleSelectionScreen` | Select saved vehicle or register new number plate. Indian plate regex validation. |
| **6. Review Booking** | `BookingReviewScreen` | Summary of hub, floor, schedule, base price, dynamic multiplier, and payment mode (`PAY_AFTER_CHECKOUT` or `PAY_NOW`). |
| **7. Confirm Booking** | `BookingReviewScreen` | Atomic server-side creation (`POST /api/v1/bookings`) to prevent concurrent overbooking. |
| **8. Confirmation & Pass** | `BookingConfirmationScreen` | Confirmed reference ID, QR pass generation, action to navigate or view ticket. |
| **9. Navigation** | `NavigationScreen` | Turn-by-turn navigation launched into device's native navigation app (Google Maps). |
| **10. Arrival Allocation** | `NavigationScreen` | **Arrival Slot Assignment**: When arriving, triggers `POST /api/v1/bookings/:id/assign-slot`, invoking backend `SlotAllocationService.allocateSlot()`. Physical slot number (e.g., `G-A12`) is displayed. |
| **11. Active Parking** | `ActiveParkingScreen` | Live countdown timer, QR pass, vehicle details, extend duration, and vacate button. |
| **12. Extension & Checkout** | `ActiveParkingScreen` | Request duration extension (`POST /bookings/:id/extend`) or checkout (`POST /bookings/:id/vacate`). |
| **13. Booking History** | `BookingHistoryScreen` | Filter by `Upcoming`, `Active`, `Completed`, `Cancelled`. Quick actions to view passes or re-navigate. |

---

## 4. API Endpoints Reused & Integrated

The mobile app integrates directly with the existing Express backend (`WebApp/backend`):

### Authentication
* `POST /api/v1/auth/register` — User registration.
* `POST /api/v1/auth/login` — User authentication returning JWT token.
* `GET /api/v1/auth/me` — Authenticated profile verification.

### Parking Hubs & Availability
* `GET /api/v1/parking` — List all active smart parking facilities.
* `GET /api/v1/parking/:facilityId` — Facility details with floors and capacities.
* `GET /api/v1/parking/:facilityId/pricing` — Authoritative ML dynamic pricing quote (`basePrice`, `recommendedPrice`, `multiplier`, `isSurgeActive`).

### Bookings
* `POST /api/v1/bookings` — Atomically reserve floor capacity and create booking record.
* `GET /api/v1/bookings/my-bookings` — Retrieve user's booking history.
* `POST /api/v1/bookings/:bookingId/assign-slot` — **Arrival Slot Allocation**: Invokes `SlotAllocationService` to assign physical slot and return encrypted QR token.
* `POST /api/v1/bookings/:bookingId/extend` — Extend active parking session duration.
* `POST /api/v1/bookings/:bookingId/vacate` — Check out and finalize billing.

### Vehicles
* `GET /api/v1/vehicles` — Get user's registered vehicles.
* `POST /api/v1/vehicles` — Register a new vehicle.

---

## 5. Setup & Execution Instructions

### Prerequisites
* Node.js 18+ and npm.
* Android Studio with Android Virtual Device (AVD) or a physical Android device with USB debugging enabled.
* Expo CLI (`npx expo`).

### Installation
1. Navigate to the `App` directory:
   ```bash
   cd d:/DrivixApps/App
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

### Running on Android
* **On Android Emulator**:
  Make sure your emulator is running, then run:
  ```bash
  npx expo run:android
  # or
  npx expo start --android
  ```
  *(Note: The default `EXPO_PUBLIC_API_URL` uses `http://10.0.2.2:5000/api/v1` to point to the local Express backend).*

* **On Physical Android Device**:
  1. Set `EXPO_PUBLIC_API_URL=http://<YOUR_COMPUTER_LOCAL_IP>:5000/api/v1` in `.env`.
  2. Run `npx expo start`.
  3. Scan the terminal QR code with the **Expo Go** application.

---

## 6. Testing

Run the automated booking engine and business rules test suite:
```bash
npm test
```
This tests:
* Floor capacity filtering and overbooking rejection.
* Authoritative backend dynamic pricing computation and offline fallback.
* Indian vehicle plate format validation.
* Deferred slot allocation on initial booking creation.
* Physical slot allocation on arrival.
* Session vacation and checkout lifecycle.

---

## 7. Features Requiring External Services

The following features have complete integration interfaces implemented, but require third-party service provider accounts to operate in production:

1. **SMS OTP Authentication**: The user interface and API client are ready. Full SMS OTP verification requires configuring an SMS gateway (e.g. Twilio, MSG91, or Firebase Phone Auth) on the backend.
2. **Google Maps Android SDK Key**: Native map rendering requires a Google Maps Android API key configured in `app.json` / `.env`. External navigation launches into the device's default GPS navigation provider.
3. **Camera Number Plate OCR**: Plate entry is fully functional with keyboard input and regex validation. Auto-capture OCR requires native camera permissions and a trained mobile vision model (e.g. Google ML Kit Text Recognition).
