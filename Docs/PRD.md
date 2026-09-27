# Drivix Product Requirements Document (PRD)

## 1. Product Summary & Goal

**Drivix** is an AI-powered smart parking and urban mobility ecosystem engineered to eliminate urban parking congestion. By combining real-time slot tracking, multi-criteria automated slot allocation, atomic concurrency locking, FASTag auto-debit payments, ANPR gate simulation, and direct live GPS navigation, Drivix turns searching for parking into a frictionless digital flight.

---

## 2. Target Audience & Personas

1. **Daily Commuters & Drivers**: Need fast, reliable parking reservations near university campuses, IT parks, and metro interchange stations without circling blocks.
2. **Commercial & Executive Drivers**: Require driver hub amenities including EV charging stations, rest lounges, car wash bays, and executive cafeterias.
3. **Parking Facility Operators & Municipal Partners**: Require real-time occupancy monitoring, ANPR barrier access control, and dynamic pricing revenue optimization.

---

## 3. Key Feature Specifications

### 3.1 Smart Parking Search & Network Map
- Interactive map view (`NetworkMapModal.jsx`) showing active Drivix parking facilities across Noida, Greater Noida, and Delhi (NDMC & South Zone).
- Real-time indicator badges displaying available vs total slots, hourly price rates, EV charging support, and distance.
- Compact floating popover card for selected locations.

### 3.2 Direct Live GPS Navigation
- 1-tap navigation button on every location card, parking ticket, and active banner.
- Automatically captures current live GPS location (`navigator.geolocation` / `expo-location`) and launches direct driving directions without requiring origin inputs (Rapido/Uber style).

### 3.3 Interactive 2D Multi-Floor Slot Booking
- Interactive floor plans (`SlotLayout.jsx`) displaying individual slot statuses.
- Atomic 5-minute soft lock upon slot selection to reserve the slot while the user completes payment.
- Instant wallet deduction and digital ticket generation.

### 3.4 Automated ANPR Gate Entry & Exit Pass
- Digital ticket (`Ticket.jsx` / `QRPacketPass.tsx`) generating high-security QR code passes.
- ANPR Gate Simulator (`AnprGateSimulator.jsx` / `gateController.js`) simulating barrier opening upon license plate or QR verification.

### 3.5 FASTag & Vehicle Management Hub
- Auto-debit FASTag wallet recharges, transaction history, and balance threshold warnings.
- Vehicle management (Plate number, model, vehicle type, fuel/EV classification).

### 3.6 Driver Hub & Amenities
- Integrated services grid: Parking, EV charging slot booking, driver rest lounge seat hold, executive cafe menu, car wash, and nitrogen tyre air dispensers.

---

## 4. Non-Functional Requirements

- **Performance**: Page load times under 2 seconds; API response time under 300ms.
- **Concurrency**: Guaranteed single-user slot locking (zero double-bookings) during high-throughput surge periods.
- **Reliability**: Seamless offline fallback showing cached gate passes (`offlineStorage.ts`).
- **Security**: AES-256 encrypted document vault for DL and PUC compliance files.
