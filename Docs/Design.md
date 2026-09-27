# Drivix Design System & UI Specification

## 1. Design Aesthetics & Visual Identity

Drivix adheres to a premium **Cyberpunk / Sci-Fi Smart Parking HUD** visual aesthetic designed to wow users at first glance.

### Core Principles
1. **Rich Modern Aesthetics**: Glassmorphic panels, dark mode backdrops, vibrant glowing accents, and micro-animations.
2. **High Contrast Typography**: Clean modern sans-serif type hierarchy (Inter / Outfit) with bold weight contrasts.
3. **Tactile Feedback**: Hover effects, spring-animated tab capsules, interactive state indicators, and smooth transition curves.

---

## 2. Color Palette & Tokens

| Token | Hex / Value | Usage |
| :--- | :--- | :--- |
| **`--bg-primary`** | `#0b0c10` / `#0c0e17` | Deep dark page and canvas background |
| **`--bg-surface`** | `rgba(15, 18, 30, 0.96)` | Glassmorphic cards, modals, and popovers |
| **`--accent-primary`** | `#FAFF00` / `#ffce00` | Primary brand yellow/gold, action buttons, active tabs |
| **`--accent-green`** | `#00cc6a` | Free slot badges, active reservations, success states |
| **`--accent-blue`** | `#38bdf8` / `#60a5fa` | ANPR ready badges, navigation indicators, distance pills |
| **`--accent-warning`** | `#ffad00` / `#ff6b35` | On-site entry only warnings, non-online booking notices |
| **`--accent-red`** | `#ff4b4b` | Occupied slots, expired sessions, emergency SOS highlights |
| **`--glass-border`** | `rgba(255, 255, 255, 0.08)` | Subtle border highlights for glassmorphic elements |

---

## 3. UI Component Specs

### 3.1 Compact Network Map Popover Card (`NetworkMapModal.jsx`)
- **Container**: Compact floating popover box centered horizontally at the bottom of the map view.
- **Dimensions**: `maxWidth: 360px`, `width: calc(100% - 32px)`, `left: 50%`, `x: -50%`.
- **Styling**: `background: rgba(15, 18, 30, 0.96)`, `border: 1px solid rgba(250, 255, 0, 0.35)`, `borderRadius: 16px`, `backdropFilter: blur(12px)`.
- **Content**: Site status badge (`⚡ Drivix Active Site`), Location Name, Full Address, Availability & Rate Badges, 1-Tap `Book Spot` button, and `📍 Nav` direct live GPS button.

### 3.2 Direct GPS Navigation Button
- **Styling**: Vibrant `#FAFF00` / `#ffce00` high-visibility pill button or dark glass button with high-contrast text and Lucide `Navigation` compass icon.
- **Behavior**: Clicking directly launches turn-by-turn driving navigation from live location without intermediate location prompts.

### 3.3 Interactive 2D Slot Map Grid (`SlotLayout.jsx`)
- Multi-floor selector (Floor 1, Floor 2, Terrace).
- Real-time slot status color coding:
  - **Green**: Available for atomic 5-min lock.
  - **Yellow/Orange**: Temporarily soft-locked by a user.
  - **Red**: Fully booked / occupied.
  - **Blue Badge**: EV charging equipped slot.

### 3.4 Floating Tab Bar (`app-tabs.tsx` & `app-tabs.web.tsx`)
- One UI 7 inspired floating navigation capsule.
- Spring-animated gold indicator (`#ffce00`) sliding seamlessly between Home, Bookings, Hub, and Profile tabs.

---

## 4. Responsive Layout Guidelines

- **Desktop (>= 1024px)**: Dual-pane split view with sticky search filters on the left and full-width interactive map or slot view on the right.
- **Tablet (768px - 1023px)**: Adaptive grid layout with collapsible drawer.
- **Mobile (< 768px)**: Single-column mobile-optimized cards, floating bottom navigation bar, and compact centered popover cards.
