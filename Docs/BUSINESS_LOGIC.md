# Drivix – End-to-End Business Logic & User Journeys

## 1. Major Functional Modules

1. **Smart Discovery & Map Navigation**: Geolocation-aware facility search with real-time floor availability indicators.
2. **Floor Capacity & Atomic Soft-Locking**: Overlapping reservation checks with 5-minute atomic holds.
3. **Hybrid AI Dynamic Pricing**: Real-time demand and surge estimation based on capacity, peak hours, and weather.
4. **Reactive Slot Allocation Scoring Engine**: 7-criteria weighted slot matching algorithm.
5. **Direct Turn-by-Turn GPS Driving Navigation**: 1-tap live navigation launching native map driving intents.
6. **Optical ANPR Gate Simulator**: Autonomous barrier control, check-in, and check-out workflows.
7. **Session Timers & Automated Auto-Release Worker**: 10-second background cleanup daemon.
8. **FASTag Auto-Debit & Driver Hub Amenities**: FASTag management and in-hub car detailing booking.

---

## 2. End-to-End User Journeys

### 2.1 Journey 1: Smart Parking Search to Confirmed Booking

```mermaid
flowchart TD
    Start([Driver Opens App/Web]) --> Browse[Browse Parking Hubs]
    Browse --> SelectHub[Select Facility: e.g. Sharda University]
    SelectHub --> ViewFloors[View Live Floor Capacities]
    ViewFloors --> PickFloor[Select Floor L1]
    PickFloor --> SoftLock[Click Slot L1-A3: Request 5-Min Atomic Hold]
    SoftLock --> LockCheck{Lock Acquired?}
    LockCheck -- No: Slot Taken --> ShowOccupied[Toast: Slot already reserved by another driver]
    ShowOccupied --> PickFloor
    LockCheck -- Yes: Locked --> StartTimer[5-Minute Countdown Timer Starts]
    StartTimer --> FillForm[Enter Vehicle Number, Start Time & Duration]
    FillForm --> DynamicPrice[Pricing Engine Calculates Total with AI Multiplier]
    DynamicPrice --> SelectServices[Add Optional Services: e.g. EV Charging]
    SelectServices --> SubmitBooking[Confirm & Place Booking]
    SubmitBooking --> OverlapCheck{Floor Capacity Available for Window?}
    OverlapCheck -- No --> Reject[400 Error: Floor capacity full for this time window]
    OverlapCheck -- Yes --> SaveBooking[Save Booking: Status 'Confirmed']
    SaveBooking --> UpdateCounts[Update Floor Capacity & Emit Socket Events]
    UpdateCounts --> ShowTicket[Redirect to Digital Ticket View]
```

#### Detailed Business Rules:
1. **Operating Status Check**: A facility must be in `Active` status and have `allowOnlineBooking: true`.
2. **Time Window Guard**: Bookings cannot be created for dates or times in the past.
3. **Atomic 5-Minute Hold**: Clicking a slot triggers `POST /api/v1/parking/:facilityId/slots/:slotId/reserve`. MongoDB atomically executes:
   ```javascript
   findOneAndUpdate(
     { facilityId, id: slotId, status: 'available' },
     { $set: { status: 'temporarily_reserved', reservedBy: user._id, reservationExpiresAt: now + 5 min } }
   )
   ```
4. **Capacity Overlap Algorithm**:
   - Instead of static slot counts, `getOverlappingCount()` checks all active bookings (`'Confirmed'`, `'Slot Assigned'`, `'Checked In'`) whose time intervals overlap the requested `[startTime, startTime + duration]`.
   - If `overlappingCount >= floor.totalSlots`, reservation is rejected with `CAPACITY_FULL`.

---

### 2.2 Journey 2: Dynamic Slot Allocation & Turn-by-Turn GPS Navigation

```mermaid
flowchart TD
    UserTicket[Driver on Ticket Page] --> TapNav[Driver Taps 'Start Navigation']
    TapNav --> CallAssign[POST /api/v1/bookings/:id/assign-slot]
    CallAssign --> CheckAssigned{Slot Already Assigned?}
    CheckAssigned -- Yes --> ReturnPass[Return existing Slot & QR Token]
    CheckAssigned -- No --> RunEngine[SlotAllocationService.allocateSlot]
    RunEngine --> FetchEligible[Filter Available Slots by Vehicle Type, EV & Accessibility]
    FetchEligible --> ScoreCandidates[Score Candidates using 7-Criteria Strategy]
    ScoreCandidates --> OptimisticLock[Attempt Atomic Slot Lock via findOneAndUpdate]
    OptimisticLock -- Conflict Race --> RetryLoop{Retry <= 5?}
    RetryLoop -- Yes --> RunEngine
    RetryLoop -- No --> FailAlloc[Error: No compatible slot available]
    OptimisticLock -- Success --> UpdateBooking[Update Booking: Status 'Slot Assigned']
    UpdateBooking --> GenToken[Sign JWT Gate QR Pass Token]
    GenToken --> SocketAlert[Emit slotStatusUpdated & bookingUpdated]
    SocketAlert --> LaunchGPS[Call launchLiveGpsNavigation]
    LaunchGPS --> OpenMap[Browser/App opens Apple Maps or Google Maps in Driving Mode from Live GPS]
```

#### Multi-Criteria Scoring Strategy:
The scoring engine ranks candidate slots based on `SLOT_ALLOCATION_WEIGHTS`:
$$\text{Score} = \sum (\text{Metric Weight} \times \text{Factor Score})$$

1. **Same Floor Match (30%)**: 100 points if slot is on requested floor, 0 otherwise.
2. **Walking Distance (25%)**: $\max(0, 100 - \text{distanceInMeters})$.
3. **Zone Compatibility (15%)**: Row A = 100, Row B = 60, Row C = 30.
4. **Vehicle Compatibility (10%)**: Car vs Bike type match.
5. **EV Requirement (10%)**: Strictly filtered. If vehicle is EV or service requested, EVSupported = 100, else standard slots preferred.
6. **Accessibility (5%)**: Designated accessible slots reserved for disabled drivers.
7. **Exit / Elevator Proximity (5%)**: Evaluates proximity to lifts and egress stairs.

---

### 2.3 Journey 3: ANPR Barrier Entry & Reactive Check-In

```mermaid
sequenceDiagram
    participant Cam as ANPR Camera
    participant Gate as Gate Controller
    participant Alloc as Slot Allocation Service
    participant DB as MongoDB Atlas
    participant WS as Socket.IO Hub

    Cam->>Gate: POST /simulate-entry { vehicleNumber: "DL01AB1234", parkingHubId }
    Gate->>DB: Standardize plate & search Booking
    alt Booking has 'Slot Assigned'
        Gate->>DB: Use assigned slot
    else Booking is 'Confirmed' without slot
        Gate->>Alloc: Reactive Slot Allocation on-the-fly!
        Alloc->>DB: Atomically reserve best available slot
        Alloc-->>Gate: Slot assigned (e.g. L1-A2)
    else No Active Booking
        Gate-->>Cam: 404 Access Denied ("No active booking found")
    end

    Gate->>Gate: Verify Entry Window (within 45-min early grace period)
    alt Arrived too early (>45 min early)
        Gate-->>Cam: 400 Access Denied ("Arrived too early")
    else Booking Expired
        Gate->>DB: Set status = 'Expired'
        Gate-->>Cam: 400 Access Denied ("Booking has expired")
    else Window Valid
        Gate->>DB: Set Booking status = 'Checked In', actualEntryTime = now
        Gate->>DB: Set Slot CurrentStatus = 'Occupied', LastOccupiedAt = now
        Gate->>DB: Recalculate floor counters
        Gate->>WS: Broadcast 'gateStateChanged' (status: 'Open')
        Gate->>WS: Broadcast 'slotStatusUpdated' (status: 'occupied')
        Gate-->>Cam: 200 OK ("Access Granted! Proceed to Floor L1, Slot L1-A2")
    end
```

---

### 2.4 Journey 4: ANPR Exit Gate Check-Out & Bill Settlement

```mermaid
sequenceDiagram
    participant Cam as ANPR Exit Camera
    participant Gate as Gate Controller
    participant DB as MongoDB Atlas
    participant WS as Socket.IO Hub

    Cam->>Gate: POST /simulate-exit { vehicleNumber: "DL01AB1234", parkingHubId }
    Gate->>DB: Find 'Checked In' booking
    alt No Checked-in Vehicle
        Gate-->>Cam: 404 Access Denied ("No checked-in vehicle found")
    else Vehicle Found
        Gate->>DB: Set Booking status = 'Checked Out', actualExitTime = now
        Gate->>DB: Set Slot CurrentStatus = 'Available', reservedBy = null
        Gate->>DB: Recalculate floor counters
        Gate->>WS: Broadcast 'gateStateChanged' (gateType: 'exit', status: 'Open')
        Gate->>WS: Broadcast 'slotStatusUpdated' (status: 'available')
        Gate-->>Cam: 200 OK ("Access Granted. Exit Gate opened! Thank you.")
    end
```

---

### 2.5 Journey 5: Background Daemon Maintenance & Auto-Sweep Worker

Runs continuously every **10 seconds** in `WebApp/backend/server.js`:

1. **Sweep 1: Expired Soft-Locks**:
   - Queries `Slot.find({ status: 'temporarily_reserved', reservationExpiresAt: { $lt: now } })`.
   - Reverts `status = 'available'`, clears `reservedBy` and `reservationExpiresAt`.
   - Emits `slotStatusUpdated` via Socket.IO so all client browser grids update in real time.
2. **Sweep 2: Overdue Active Bookings**:
   - Queries active bookings past their scheduled end time.
   - If booking was `'Checked In'`, transitions to `'Checked Out'`. Otherwise marks `'Expired'`.
   - Frees linked slot back to `'available'` and synchronizes floor capacity counters.
3. **Sweep 3: Auto-Allocation for Approaching Reservations**:
   - Queries bookings where start time is within `ASSIGNMENT_THRESHOLD_MINUTES` (30 minutes) and slot is unassigned.
   - Automatically executes `SlotAllocationService.allocateSlot()`.
4. **Sweep 4: 30-Minute Arrival Check Prompt**:
   - Emits `arrivalConfirmationPrompt` via Socket.IO to remind driver of upcoming reservation.
   - If driver is more than 15 minutes late past start time without confirming, marks booking `'Expired'`.

