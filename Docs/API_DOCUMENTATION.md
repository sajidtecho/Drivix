# Drivix – API Documentation Reference

## 1. Global Specifications & Base URLs

- **Production WebApp Backend**: `https://drivix-backend-0qvx.onrender.com/api/v1`
- **Local WebApp Backend**: `http://localhost:5000/api/v1`
- **Mobile Android Emulator Gateway**: `http://10.0.2.2:5000/api/v1`
- **Production ML Service (FastAPI)**: `http://localhost:8000/api/v1`
- **Authentication Scheme**: Bearer Token in HTTP Authorization Header (`Authorization: Bearer <JWT_TOKEN>`)

---

## 2. Authentication & User Management Endpoints (`/api/v1/auth`)

### 2.1 Register User
- **Method**: `POST`
- **Endpoint**: `/api/v1/auth/register`
- **Access**: Public
- **Controller**: `registerUser` (`authController.js` via `authService.js`)
- **Models Involved**: `User`, `EmailOtp`
- **Request Body**:
  ```json
  {
    "name": "Arjun Sharma",
    "email": "arjun@example.com",
    "password": "Password123!",
    "mobile": "9810012345",
    "city": "Noida"
  }
  ```
- **Response Structure (201 Created)**:
  ```json
  {
    "_id": "66901a1f...",
    "fullName": "Arjun Sharma",
    "email": "arjun@example.com",
    "role": "user",
    "walletBalance": 0,
    "membershipType": "Free",
    "token": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"message": "User already exists"}` or `{"message": "Password must be at least 6 characters"}`

### 2.2 Login User
- **Method**: `POST`
- **Endpoint**: `/api/v1/auth/login`
- **Access**: Public
- **Controller**: `loginUser` (`authController.js`)
- **Request Body**:
  ```json
  {
    "email": "arjun@example.com",
    "password": "Password123!"
  }
  ```
- **Response Structure (200 OK)**:
  ```json
  {
    "_id": "66901a1f...",
    "fullName": "Arjun Sharma",
    "email": "arjun@example.com",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: `{"message": "Invalid email or password"}`

### 2.3 Google OAuth Authentication
- **Method**: `POST`
- **Endpoint**: `/api/v1/auth/google`
- **Access**: Public
- **Request Body**: `{"credential": "<GOOGLE_ID_TOKEN>"}`
- **Response (200 OK)**: User profile payload with JWT token. Creates user automatically if first time.

### 2.4 Get Current User Profile
- **Method**: `GET`
- **Endpoint**: `/api/v1/auth/profile`
- **Access**: Private (`protect`)
- **Response (200 OK)**: Full user profile including vehicles array, document vault, preferences, and notifications.

### 2.5 Update User Profile
- **Method**: `PUT`
- **Endpoint**: `/api/v1/auth/profile`
- **Access**: Private (`protect`)
- **Request Body**: Editable profile fields (`name`, `mobile`, `city`, `vehicles`, `preferences`, `drivingLicence`).
- **Response (200 OK)**: Updated user object and refreshed JWT token.

### 2.6 Email OTP Verification
- **Method**: `POST`
- **Endpoint**: `/api/v1/auth/send-public-otp` & `/api/v1/auth/verify-public-otp`
- **Access**: Public
- **Description**: Sends and verifies 6-digit email OTP codes before account creation.

### 2.7 Admin: Get All Users
- **Method**: `GET`
- **Endpoint**: `/api/v1/auth/users`
- **Access**: Private / Admin (`protect`, `adminOnly`)
- **Response (200 OK)**: Array of all registered user documents.

### 2.8 Admin: Update User Plan
- **Method**: `PUT`
- **Endpoint**: `/api/v1/auth/users/:id/plan`
- **Access**: Private / Admin (`protect`, `adminOnly`)
- **Request Body**: `{"plan": "premium" | "free"}`

---

## 3. Parking Locations & Slots Endpoints (`/api/v1/parking`)

### 3.1 Get All Parking Locations
- **Method**: `GET`
- **Endpoint**: `/api/v1/parking`
- **Access**: Public
- **Controller**: `getLocations` (`parkingController.js`)
- **Models Involved**: `ParkingLocation`, `Booking`
- **Response (200 OK)**: Array of active parking facilities with computed `availableSlots`.

### 3.2 Get Floor Availability
- **Method**: `GET`
- **Endpoint**: `/api/v1/parking/floors/:floorId/availability`
- **Access**: Public
- **Query Parameters**:
  - `parkingHubId`: Facility ObjectId
  - `date`: `YYYY-MM-DD`
  - `startTime`: `HH:MM`
  - `duration`: integer hours
- **Response Structure (200 OK)**:
  ```json
  {
    "floorId": "669024...",
    "floorName": "L1",
    "totalCapacity": 20,
    "reservedCapacity": 3,
    "availableCapacity": 17,
    "isFull": false
  }
  ```

### 3.3 Get Floors for Location
- **Method**: `GET`
- **Endpoint**: `/api/v1/parking/:facilityId/floors`
- **Access**: Public
- **Response (200 OK)**: Array of `ParkingFloor` documents for the facility.

### 3.4 Get Slots for Facility
- **Method**: `GET`
- **Endpoint**: `/api/v1/parking/:facilityId/slots`
- **Access**: Public
- **Query Parameters**: `floor` (optional, e.g. `'L1'`)
- **Response (200 OK)**: Array of `Slot` documents including `status`, `vehicleType`, `EVSupported`.

### 3.5 Atomic Soft-Lock Slot Reservation
- **Method**: `POST`
- **Endpoint**: `/api/v1/parking/:facilityId/slots/:slotId/reserve`
- **Access**: Private (`protect`)
- **Controller**: `reserveSlot` (`parkingController.js`)
- **Description**: Acquires atomic 5-minute checkout hold using `findOneAndUpdate` matching `{ status: 'available' }`.
- **Response (200 OK)**:
  ```json
  {
    "message": "Slot reserved temporarily for 5 minutes",
    "slot": {
      "id": "L1-A3",
      "status": "temporarily_reserved",
      "reservationExpiresAt": "2026-11-12T16:35:00.000Z"
    }
  }
  ```
- **Socket Broadcast**: Emits `slotStatusUpdated` to all connected clients.

### 3.6 Release Soft-Locked Slot
- **Method**: `POST`
- **Endpoint**: `/api/v1/parking/:facilityId/slots/:slotId/release`
- **Access**: Private (`protect`)
- **Description**: Immediately releases a temporary soft lock back to `available`.

### 3.7 Dynamic Pricing Recommendation
- **Method**: `GET`
- **Endpoint**: `/api/v1/parking/:facilityId/pricing`
- **Access**: Public
- **Query Parameters**: `durationHours` (default: 2)
- **Response (200 OK)**: Pricing estimate payload with multiplier, demand score, surge status, and AI version.

---

## 4. Bookings & Reservations Endpoints (`/api/v1/bookings`)

### 4.1 Create Booking Ticket
- **Method**: `POST`
- **Endpoint**: `/api/v1/bookings`
- **Access**: Private (`protect`)
- **Controller**: `createBooking` (`bookingController.js`)
- **Models Involved**: `Booking`, `ParkingLocation`, `ParkingFloor`, `Vehicle`
- **Request Body**:
  ```json
  {
    "bookingId": "DRX-L79XA1",
    "locationId": "669019b...",
    "floor": "L1",
    "entryDate": "2026-11-15",
    "entryTime": "14:30",
    "duration": 3,
    "vehicleNumber": "DL01AB1234",
    "vehicleName": "Tata Nexon EV",
    "paymentMode": "PAY_AFTER_CHECKOUT",
    "additionalServices": ["EV Charging"]
  }
  ```
- **Business Validations**:
  - Prevents booking dates or times in the past.
  - Verifies location `allowOnlineBooking === true` and `status === 'Active'`.
  - Calculates overlapping booking count on the target floor; rejects with `400` (`CAPACITY_FULL`) if full.
- **Response (201 Created)**: Created `Booking` object with status `'Confirmed'`.
- **Side Effects**: Emits `floorCapacityUpdated` via Socket.IO, notifies online ML learner, dispatches user confirmation alert.

### 4.2 Get User Bookings
- **Method**: `GET`
- **Endpoint**: `/api/v1/bookings/my`
- **Access**: Private (`protect`)
- **Response (200 OK)**: Array of driver's bookings sorted by date descending.

### 4.3 Trigger Reactive Dynamic Slot Allocation
- **Method**: `POST`
- **Endpoint**: `/api/v1/bookings/:id/assign-slot` (and `/assign-slot`)
- **Access**: Private (`protect`)
- **Controller**: `assignSlot` (`bookingController.js` via `SlotAllocationService.js`)
- **Description**: Evaluates all available slots on the reserved floor against vehicle type, EV needs, and walking distance; atomically locks the best slot and returns a signed QR JWT token.
- **Response Structure (200 OK)**:
  ```json
  {
    "message": "Dynamic Slot Assigned Successfully",
    "booking": {
      "bookingId": "DRX-L79XA1",
      "slotId": "L1-A2",
      "floor": "L1",
      "status": "Slot Assigned"
    },
    "qrToken": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```

### 4.4 Driver Arrival Confirmation Prompt Response
- **Method**: `POST`
- **Endpoint**: `/api/v1/bookings/:id/arrival-confirmation`
- **Access**: Private (`protect`)
- **Request Body**: `{"action": "yes" | "delay" | "cancel"}`
- **Actions**:
  - `'yes'`: Allocates slot immediately and returns QR pass.
  - `'delay'`: Pushes reservation start time forward by 30 minutes.
  - `'cancel'`: Cancels reservation, frees capacity counter, marks status `'Cancelled'`.

### 4.5 Calculate Exit Bill
- **Method**: `GET`
- **Endpoint**: `/api/v1/bookings/:id/calculate-bill`
- **Access**: Private (`protect`)
- **Response (200 OK)**: Elapsed hours, hourly rate, additional service fees, prepaid credit, amount due, and wallet balance.

### 4.6 Vacate & Complete Booking
- **Method**: `PUT`
- **Endpoint**: `/api/v1/bookings/:id/vacate`
- **Access**: Private (`protect`)
- **Request Body**: `{"paymentMethod": "wallet" | "cash" | "card"}`
- **Actions**: Marks booking `'Checked Out'`, frees slot to `'Available'`, updates floor counters, deducts user wallet if payment method is wallet.

---

## 5. Reactive ANPR Gate Simulator Endpoints (`/api/v1/gate`)

### 5.1 Simulate ANPR Gate Entry
- **Method**: `POST`
- **Endpoint**: `/api/v1/gate/simulate-entry`
- **Access**: Public
- **Controller**: `simulateEntry` (`gateController.js`)
- **Request Body**:
  ```json
  {
    "vehicleNumber": "DL01AB1234",
    "parkingHubId": "669019b..."
  }
  ```
- **Execution Flow**:
  1. Standardizes plate (removes whitespace, uppercase).
  2. Queries confirmed booking; if slot is unassigned, triggers `SlotAllocationService.allocateSlot`.
  3. Verifies entry time window (grace window -45 minutes).
  4. Updates booking to `'Checked In'` and slot to `'Occupied'`.
  5. Emits `gateStateChanged` (`'Open'`) and `slotStatusUpdated` via Socket.IO.
- **Response (200 OK)**:
  ```json
  {
    "message": "Access Granted. Entry Gate opened! Proceed to Floor L1, Slot L1-A2.",
    "booking": { ... }
  }
  ```

### 5.2 Simulate ANPR Gate Exit
- **Method**: `POST`
- **Endpoint**: `/api/v1/gate/simulate-exit`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "vehicleNumber": "DL01AB1234",
    "parkingHubId": "669019b..."
  }
  ```
- **Execution Flow**:
  1. Matches `'Checked In'` booking.
  2. Updates status to `'Checked Out'` with `exitTime`.
  3. Frees slot back to `'Available'`.
  4. Emits `gateStateChanged` (`'Open'`) and updates floor capacity.
- **Response (200 OK)**:
  ```json
  {
    "message": "Access Granted. Exit Gate opened! Thank you for using Drivix.",
    "booking": { ... }
  }
  ```

---

## 6. FASTag & Vehicle Management Endpoints

### 6.1 Vehicles (`/api/v1/vehicles`)
- `POST /`: Add new vehicle (`vehicleNumber`, `vehicleType`, `brand`, `model`, `fuelType`, `isPrimary`).
- `GET /`: List all vehicles registered to the user.
- `DELETE /:id`: Delete vehicle.
- `PUT /:id/primary`: Set as primary vehicle for instant bookings.

### 6.2 FASTag Accounts (`/api/v1/fastags`)
- `POST /`: Link vehicle to FASTag account (`vehicleId`, `bank`, `tagId`, `balance`).
- `GET /`: Get user's FASTag tags with balance and status.
- `POST /estimate`: Calculate toll route fee (`origin`, `destination`, `vehicleType`).
- `POST /:id/recharge`: Top-up FASTag wallet (`amount`, `paymentMethod`).
- `GET /:id/transactions`: Retrieve debit/credit ledger.
- `PUT /:id/auto-recharge`: Configure threshold auto-topup (`enabled`, `threshold`, `amount`).

---

## 7. Ancillary Services, Banners & Support

### 7.1 Car Wash Centers (`/api/v1/wash-centers`)
- `GET /`: Query car detailing/wash facilities. Query filters: `vehicleType` (`'car'`, `'bike'`), `city`, `search`.

### 7.2 Marketing Banners (`/api/v1/banners`)
- `GET /`: Retrieve active promotional banners.
- `POST /:id/impression`: Track banner display impression.
- `POST /:id/click`: Track banner CTA click.

### 7.3 Support Complaints (`/api/v1/complaints`)
- `POST /`: Submit ticket (`title`, `description`, `bookingId`, `image`).
- `GET /my`: List driver's submitted tickets.
- `PUT /:id/resolve`: Admin resolution note.

### 7.4 Partner Facility Registration (`/api/v1/partners`)
- `POST /register`: Public form submission for parking lot operators.
- `GET /stats`: Aggregated partner statistics.

---

## 8. Python Machine Learning Service Endpoints (FastAPI `:8000`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health status, loaded model indicator, online learning status |
| `POST` | `/api/v1/predict` | Predict demand score, pricing multiplier, and recommended price |
| `POST` | `/api/v1/forecast-occupancy` | Stage 1 sensor occupancy forecast 30-60 mins ahead |
| `POST` | `/api/v1/predict/batch` | Concurrently score multiple parking facility quotes |
| `GET` | `/api/v1/online-learning/status` | Online learner telemetry, samples trained, and DB connection status |
| `POST` | `/api/v1/online-learning/sync-db` | Batch sync new bookings from MongoDB to update SGD online weights |
| `POST` | `/api/v1/online-learning/learn-event` | Real-time single transaction streaming update from Node.js backend |
| `POST` | `/api/v1/online-learning/configure` | Update blend weights and residual clamping limits |
| `GET` | `/api/v1/mlops/drift-report` | KS and PSI statistical drift report against baseline training data |
| `POST` | `/api/v1/mlops/retrain` | Triggers automated retraining and Champion-vs-Challenger validation gate |
| `GET` | `/api/v1/mlops/model-registry` | Model registry snapshots and historical retraining ledger |

---

## 9. Socket.IO Real-Time Event Catalog

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `slotStatusUpdated` | Server → Client | `{ facilityId, id, status, reservationExpiresAt, reservedBy }` | Broadcast whenever an individual slot changes state (reserved, booked, occupied, available). |
| `floorCapacityUpdated`| Server → Client | `{ parkingHubId, floorId, floorName }` | Emitted when bookings alter floor capacity counts. |
| `gateStateChanged` | Server → Client | `{ gateType, parkingHubId, status, vehicleNumber, message, bookingId }` | Emitted by ANPR simulator when entry/exit barrier opens or denies access. |
| `bookingUpdated` | Server → Client | `{ userId, bookingId, slotId, status }` | Targeted alert updating driver ticket states. |
| `arrivalConfirmationPrompt` | Server → Client | `{ bookingId, customId, message, options }` | High-priority 30-minute arrival prompt alert sent to user client. |
| `bookingRemoved` | Server → Client | `{ userId, bookingId }` | Administrative emergency cancellation alert. |
