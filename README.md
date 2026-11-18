# PROJECT AWAKEN — YENARTIFICA
## Milestone 1: Foundation & Dynamic Multi-Device Synchronization

> **Department of Artificial Intelligence & Machine Learning**  
> Interactive Department Inauguration System with Real-Time Local-Network Synchronization across Dynamic Mobile Devices (Min 1 to N), Projector Display, and Admin Console.

---

## ⚡ Overview & Architecture

**PROJECT AWAKEN** is a futuristic, server-authoritative inauguration platform engineered for local network deployment (Wi-Fi router or laptop mobile hotspot). It does not rely on any external cloud infrastructure, internet connectivity, or database.

### System Architecture
```
                                 ┌───────────────────────────────────────┐
                                 │       Node.js + Express Server        │
                                 │    (Port 4000, Bound to 0.0.0.0)      │
                                 │                                       │
                                 │   ┌───────────────────────────────┐   │
                                 │   │ Server State Machine (Memory) │   │
                                 │   │  - Dynamic Device Capacity    │   │
                                 │   │  - Token / Slot Validation    │   │
                                 │   │  - Disconnect / Reconnect     │   │
                                 │   │  - Anti-Duplicate Protection  │   │
                                 │   └───────────────▲───────────────┘   │
                                 │                   │                   │
                                 │              Socket.IO                │
                                 └─────────▲─────────▲─────────▲─────────┘
                                           │         │         │
                   ┌───────────────────────┘         │         └───────────────────────┐
                   ▼                                 ▼                                 ▼
         ┌───────────────────┐             ┌───────────────────┐             ┌───────────────────┐
         │ 🖥️ Projector HUD  │             │ 📱 Dynamic Mobiles│             │ ⚙️ Admin Console  │
         │     (/display)    │             │   (/controller)   │             │      (/admin)     │
         │ - 16:9 Cinematic  │             │ - 1 to N Devices  │             │ - Choose Count ≥ 1│
         │ - Live LED Dials  │             │ - Select Station  │             │ - Arm System (N/N)│
         │ - Progress 0 to N │             │ - Green LED Pulse │             │ - Begin Inaugurate│
         │ - Ready for 60s   │             │ - Live Peer Bar   │             │ - Live Audit Logs │
         └───────────────────┘             └───────────────────┘             └───────────────────┘
```

---

## 🚀 Key Features

1. **Dynamic Mobile Device Capacity (Minimum 1 to N):**
   - The administrator can configure the required number of participant devices directly from `/admin` (minimum 1 device, e.g. 1, 2, 3, 4, 5+).
   - All state machine thresholds, projector progress counters (`0/N` to `N/N`), arming validation, and controller slot selection adapt dynamically in real-time.

2. **Three Dedicated Interfaces:**
   - **🖥️ Projector Display (`/display`):** 16:9 cinematic HUD with midnight navy styling, cyan/electric blue accents, dynamic live authorization dials with LED status, progress counter (`0/N` to `N/N`), `SYSTEM ARMED` and `ALL AUTHORIZATIONS RECEIVED` banners, and a dedicated stage area reserved for the upcoming 60-second awakening reveal.
   - **📱 Mobile Controller (`/controller`):** Mobile-first responsive UI. Dignitaries pick one of the available stations (Terminal 01, 02, ..., N). Activation button remains locked until the system is armed. Once armed, pressing the button activates haptic feedback, triggers green LED indicators, and syncs across all devices in real-time.
   - **⚙️ Admin Dashboard (`/admin`):** Secure PIN-protected console (`ADMIN_PIN=2025`). Displays connection telemetry, dynamic device capacity stepper (`-` and `+`, plus quick presets), slot status, and enforces strict transition logic:
     - **ARM SYSTEM:** Enabled *only* when all N devices are connected.
     - **BEGIN INAUGURATION:** Enabled *only* after all N devices authorize.
     - **RESET SYSTEM:** Full or authorization-only reset capabilities.
     - **FORCE RELEASE:** Evicts unresponsive devices to free slots.

3. **Server-Authoritative State Machine:**
   - States: `STANDBY` &rarr; `CONNECTING` &rarr; `READY` &rarr; `ARMED` &rarr; `ALL_AUTHORIZED` &rarr; `COUNTDOWN` &rarr; `AWAKENING` &rarr; `LOGO_REVEAL` &rarr; `INAUGURATED`.
   - Strict validation: Rejects duplicate authorizations, prevents unauthorized socket events, and rejects excess devices when all N slots are occupied.
   - Seamless reconnects: Devices save unique session tokens in `localStorage`. If a phone temporarily sleeps or reconnects, its slot reservation and authorization state are safely preserved.

4. **Zero Cloud Dependencies & Local Audio Synthesis:**
   - Detects laptop LAN IPv4 address automatically (e.g. `192.168.x.x` or `172.x.x.x`).
   - Uses Web Audio API for synthesized cybernetic sound effects (no missing audio file errors).

---

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite 6, TypeScript, Tailwind CSS, Lucide React, GSAP
- **Backend:** Node.js, Express, Socket.IO, TypeScript, tsx
- **Network:** WebSocket + HTTP Polling fallback, bound to `0.0.0.0`

---

## 💻 Windows 11 Setup & Firewall Configuration

To allow mobile devices connected to your laptop's Wi-Fi network or Mobile Hotspot to reach the server, Windows Firewall must allow inbound traffic on port `4000` (and `5173` if running Vite dev server).

### Option A: Run in PowerShell as Administrator (Fastest)

Open **PowerShell as Administrator** and execute:
```powershell
New-NetFirewallRule -DisplayName "Yenartifica Inauguration Server" -Direction Inbound -LocalPort 4000,5173 -Protocol TCP -Action Allow
```

### Option B: Windows Defender Firewall GUI
1. Press `Win + R`, type `wf.msc` and press Enter.
2. Click **Inbound Rules** on the left &rarr; **New Rule...** on the right.
3. Select **Port** &rarr; Next.
4. Select **TCP** and enter **Specific local ports**: `4000, 5173` &rarr; Next.
5. Select **Allow the connection** &rarr; Next.
6. Check **Private** (and Domain/Public if on mobile hotspot) &rarr; Next.
7. Name the rule `Yenartifica Server` and click **Finish**.

---

## 📦 Installation & Quick Start

### 1. Install Dependencies
From the project root:
```bash
npm run install:all
```
*(Or install separately: `cd server && npm install`, then `cd ../client && npm install`)*

### 2. Configure Environment (Optional)
The default configuration is pre-configured in `.env`:
```env
PORT=4000
HOST=0.0.0.0
ADMIN_PIN=2025
NODE_ENV=development
```

### 3. Run in Production Mode (Single Port 4000)
Build the frontend and launch the unified server:
```bash
npm run build
npm start
```
The server will output:
```
===================================================================
⚡  PROJECT AWAKEN — YENARTIFICA INAUGURATION CORE SERVER
===================================================================
  Host Bind      : 0.0.0.0:4000
  Detected LAN IP: 172.21.0.217 (Wi-Fi)

  🌐 LOCAL NETWORK ACCESS URLS:
  -----------------------------------------------------------------
  📱 Mobile Controller : http://<LAN_IP>:4000/controller
  🖥️ Projector Display  : http://<LAN_IP>:4000/display
  ⚙️ Admin Dashboard    : http://<LAN_IP>:4000/admin
===================================================================
```

### 4. Run in Development Mode (Live Reload)
To run both server and Vite hot-reloading simultaneously:
```bash
# Terminal 1: Backend with tsx watch
npm run dev:server

# Terminal 2: Vite client with LAN host access
npm run dev:client
```

---

## 🧪 Automated Testing

Project Awaken includes an automated 21-point integration test suite in `server/__tests__/workflow.test.ts`.

It launches simulated WebSocket clients and validates the full ceremony lifecycle:
- ✅ Admin PIN authentication
- ✅ Device 1, 2, 3 connections and registration into distinct slots
- ✅ Arming rejection when only 2/3 devices connected
- ✅ State transition to `READY` when 3/3 connect
- ✅ 4th device connection rejection (capacity enforcement)
- ✅ Premature authorization rejection before system is armed
- ✅ Admin arming system (`ARMED` state)
- ✅ Independent participant authorization & real-time LED propagation
- ✅ Prevention of duplicate authorizations
- ✅ Premature inauguration trigger rejection (before 3/3)
- ✅ Disconnect and session resume handling (preserving authorization state)
- ✅ Transition to `ALL_AUTHORIZED` upon 3/3 authorizations
- ✅ `BEGIN INAUGURATION` event broadcasting
- ✅ Prevention of duplicate inauguration triggers
- ✅ Emergency system reset to `READY`

### Run Tests:
```bash
npm run test:workflow
```
Output:
```text
  ✅ PASS: Admin PIN Authentication with correct PIN
  ✅ PASS: Initial state is STANDBY
  ✅ PASS: Device 1 registered into Slot 1
  ✅ PASS: Device 2 registered into Slot 2
  ✅ PASS: System state is CONNECTING with 2 devices
  ✅ PASS: Arming denied when only 2/3 devices are connected
  ✅ PASS: Device 3 registered into Slot 3
  ✅ PASS: System state transitions to READY with 3/3 devices
  ✅ PASS: Fourth device registration rejected (capacity limit 3/3)
  ✅ PASS: Authorization rejected when system is not yet ARMED
  ✅ PASS: Admin successfully ARMED system (State: ARMED)
  ✅ PASS: Device 1 authorized and state propagated to peers (1/3)
  ✅ PASS: Duplicate authorization from Device 1 prevented
  ✅ PASS: Begin Inauguration rejected when progress is only 1/3
  ✅ PASS: Device 2 authorized (2/3)
  ✅ PASS: Device 3 disconnected safely
  ✅ PASS: Device 3 successfully resumed session and slot reservation
  ✅ PASS: All 3 devices authorized -> State: ALL_AUTHORIZED (3/3)
  ✅ PASS: Begin Inauguration triggered countdown & broadcasted event to all clients
  ✅ PASS: Duplicate Inauguration trigger prevented
  ✅ PASS: Admin Reset successfully cleared authorizations back to READY
  ✅ PASS: Rejection of invalid device count (0 devices)
  ✅ PASS: Admin dynamically changed device requirement to 1 terminal (Min 1)
  ✅ PASS: Single device registered -> transitions to READY immediately with 1/1
  ✅ PASS: System ARMED for 1-device inauguration
  ✅ PASS: Single device authorized -> reaches ALL_AUTHORIZED (1/1)
  ✅ PASS: Begin Inauguration triggered for 1-device ceremony

========================================================
🏁 TEST RESULTS: 27 PASSED, 0 FAILED
========================================================
```

---

## 🎯 Ceremony Step-by-Step Operator Guide

1. **Laptop Setup:**
   - Connect laptop to the local Wi-Fi or turn on **Windows Mobile Hotspot**.
   - Run `npm start`. Note the LAN IP displayed (e.g. `http://192.168.1.50:4000`).

2. **Auditorium Screen:**
   - Open Chrome on the laptop connected to the projector: `http://localhost:4000/display`
   - Press the **Fullscreen** button in the top right corner.

3. **Admin Console:**
   - Open `http://localhost:4000/admin` on an operator laptop or tablet.
   - Enter Admin PIN: `2025` to unlock controls.

4. **Participant Mobile Devices:**
   - Connect 3 mobile phones to the same Wi-Fi / hotspot.
   - Open browser and navigate to `http://<LAN_IP>:4000/controller`
   - Device 1 selects **Terminal 01 (Chief Guest)**.
   - Device 2 selects **Terminal 02 (Head of Department)**.
   - Device 3 selects **Terminal 03 (Faculty Lead)**.

5. **Inauguration Execution:**
   - Once all 3 devices show "ONLINE" on the Admin Console, the **ARM SYSTEM** button lights up cyan.
   - Administrator presses **ARM SYSTEM**.
   - On the projector, the banner displays `⚡ SYSTEM ARMED`.
   - On the 3 mobile devices, the giant buttons glow cyan with `PRESS TO AUTHORIZE`.
   - Each dignitary presses their button &rarr; Haptic buzz triggers &rarr; LED turns green (`AUTHORIZED`) &rarr; Projector progress increments (`1/3`, `2/3`, `3/3`).
   - When 3/3 authorize, projector displays `★ ALL AUTHORIZATIONS RECEIVED`.
   - Administrator presses glowing green **BEGIN INAUGURATION** button.
   - The event trigger broadcasts to all connected clients in real time!
