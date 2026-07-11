# 🌌 Drivix – AI-Powered Smart Parking Ecosystem

[![React](https://img.shields.io/badge/Frontend-React%20%26%20Vite-blue?style=for-the-badge&logo=react)](https://react.dev)
[![Node](https://img.shields.io/badge/Backend-Node.js%20%26%20Express-green?style=for-the-badge&logo=nodedotjs)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-brightgreen?style=for-the-badge&logo=mongodb)](https://mongodb.com)
[![Render](https://img.shields.io/badge/Hosting-Render-purple?style=for-the-badge&logo=render)](https://render.com)
[![Vercel](https://img.shields.io/badge/Hosting-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Socket.io](https://img.shields.io/badge/Realtime-Socket.IO-white?style=for-the-badge&logo=socketdotio)](https://socket.io)

**Drivix** is a premium, AI-powered smart parking ecosystem designed to eliminate urban parking congestion. By combining **ANPR (Automatic Number Plate Recognition)**, real-time slot tracking, smart locking, and a hybrid dynamic pricing engine, Drivix turns the "search for parking" into a seamless digital flight.

---

## 🛠️ System Architecture

Drivix uses a decoupled, hybrid-polling micro-architecture designed to maintain real-time sync across modern cloud hosting boundaries.

```mermaid
graph TD
    subgraph Client Layer [Frontend - Vercel]
        A[React App] -->|1. Request Slots| B(Focus-Aware Polling / WS)
    end

    subgraph Service Layer [Backend - Render]
        B -->|2. Route Requests| C[Express Server]
        C -->|3. Evaluate Surge| D[AI Dynamic Pricing Engine]
        C -->|4. Soft Lock Slot| E[Atomic Lock Controller]
        C -->|5. Manage Real-time| F[Socket.IO Hub]
    end

    subgraph Database Layer [Cloud Storage]
        E -->|6. Check & Hold| G[(MongoDB Atlas)]
        D -->|Fetch Occupancy| G
    end
    
    F -.->|Live Sync Fail-over| A
```

---

## ⚙️ Core Engineering Concepts (Deep Dive)

<details>
<summary><b>🧠 1. Hybrid Dynamic Pricing Model</b></summary>

Drivix optimizes facility occupancy and revenue using a dual-layer pricing engine combining machine learning prediction with safety-critical business rules:

```mermaid
graph TD
    A[Inputs: Current Occupancy, Weather, Events, Holiday Status] --> B[AI Demand Estimator]
    B -->|Predicts Demand Score 0-100| C[Business Rules Multiplier]
    C -->|Critical Surge >85% = 1.50x| D[Final Calculated Price]
    C -->|High Demand >60% = 1.25x| D
    C -->|Off-Peak Discount <30% = 0.85x| D
```

* **Explainable AI Integration**: Instead of letting a black-box model set prices directly (which is risky and non-auditable), the AI estimates the demand score while deterministic business rules scale the multiplier.
</details>

<details>
<summary><b>🔒 2. Atomic Slot Locks (Concurrency Protection)</b></summary>

To prevent race conditions where two users attempt to capture the same parking slot at the exact same millisecond, Drivix utilizes an atomic soft-lock algorithm:

```mermaid
sequenceDiagram
    participant User A
    participant Server
    participant MongoDB
    participant User B

    User A->>Server: Request slot reserve (A3)
    Server->>MongoDB: findOneAndUpdate({ slot: A3, isLocked: false })
    MongoDB-->>Server: Lock Successful (Return Document)
    Server-->>User A: Reservation Confirmed (5 Min Timer Starts)
    
    User B->>Server: Request slot reserve (A3)
    Server->>MongoDB: findOneAndUpdate({ slot: A3, isLocked: false })
    MongoDB-->>Server: Lock Failed (A3 is already locked)
    Server-->>User B: Slot Unavailable (Toast Notification)
```

* **Auto-Release Worker**: A server-side scheduler runs continuously to sweep the database and release soft locks for slots where the 5-minute checkout window has expired without payment.
</details>

<details>
<summary><b>📡 3. Serverless Socket.IO Smart Polling Fallback</b></summary>

Because Vercel serverless functions freeze after delivering an HTTP response, persistent WebSocket channels can experience connection timeouts. Drivix implements a client-side wrapper:
* **WebSocket Priority**: Tries to connect using active Socket.IO streams.
* **Focus-Aware Fallback**: If disconnected, shifts to a 4-second API polling schedule.
* **Tab-Activity Guard**: Polling completely pauses when the browser tab goes into the background, preventing rate-limiting and unnecessary database reads.
</details>

---

## ⚙️ Technology Stack

* **Frontend**: React + Vite
* **Styling**: Vanilla CSS (Pill Navigation, Glassmorphism, Responsive Viewports)
* **Animations**: Framer Motion & Lucide Icons
* **Backend**: Node.js + Express.js + Socket.IO
* **Database**: MongoDB Atlas (configured with Virtual Populates to keep documents O(1) in size)
* **Hosting**: Vercel (Frontend) & Render (Backend)

---

## 🚀 Local Installation & Setup

Follow these steps to run the entire Drivix ecosystem on your local machine:

### 1. Clone the repository
```bash
git clone https://github.com/sajidtecho/Drivix.git
cd Drivix
```

### 2. Configure Backend Variables
Create a `.env` file in the `/backend` folder:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
```

### 3. Run Backend Server
```bash
cd backend
npm install
npm run dev
```

### 4. Configure Frontend URL
In `frontend/src/config.js`, set your backend API path:
```javascript
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

### 5. Run Frontend Client
```bash
cd ../frontend
npm install
npm run dev
```

---

*Designed with ❤️ for the Smart Cities of tomorrow.*
