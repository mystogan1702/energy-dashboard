# PesoWatt – Cloud Energy Monitoring System (ESP32 + Firebase + React)

**Real‑time energy monitoring IoT platform** with an ESP32‑based sensor node, Firebase backend, and a modern React dashboard. Designed for homes, offices, and small industrial setups to track voltage, current, power, energy consumption, and cost.

## 🚀 Features

- **Real‑time monitoring** – Voltage, current, active power, energy, frequency, and power factor updated every second.
- **Dashboard‑first architecture** – Create multiple dashboards, each with its own devices, owners, and master key. No device required to start.
- **Secure device claiming** – ESP32 registers as unclaimed; users scan and adopt it into their dashboard via a polished wizard.
- **Firebase Firestore backend** – Efficient, scalable, and real‑time data storage with fine‑grained security rules.
- **Responsive React frontend** – Live dashboard, historical analytics (with CSV/Excel/PDF export), notifications, event logs, system health, and device management.
- **Over‑the‑air updates** – Secure OTA firmware updates with signature verification (coming soon).
- **Wi‑Fi provisioning** – Captive portal (WiFiManager) with plans for BLE/QR code onboarding.
- **Non‑blocking firmware** – Cooperative state machine design ensures smooth LED status indicators and responsive cloud communication.

## 📁 Project Structure

```
pesowatt/
├── firmware/               # ESP32 PlatformIO project
│   ├── src/
│   │   ├── main.cpp
│   │   ├── cloud_sync.cpp  # Firestore document creation, claiming, telemetry upload
│   │   ├── wifi_sm.cpp     # Wi‑Fi connection state machine + provisioning
│   │   ├── sensor_sm.cpp   # PZEM‑004T sensor reader
│   │   ├── LedManager.cpp  # Non‑blocking RGB LED driver
│   │   └── ...
│   └── platformio.ini
├── dashboard/              # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Dashboard, DeviceSetup, History, Notifications, etc.
│   │   ├── hooks/          # Firestore hooks (useLatestReading, useDeviceStatus, etc.)
│   │   ├── lib/            # Firebase config, AuthContext, DashboardContext
│   │   └── ...
│   └── package.json
└── README.md
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Firmware** | C++ (Arduino framework), PlatformIO |
| **Microcontroller** | ESP32‑DevKitC (240 MHz dual‑core) |
| **Sensor** | PZEM‑004T v3.0 (Modbus‑RS485) |
| **Backend** | Firebase Firestore, Firebase Auth |
| **Frontend** | React 18, React Router, Tailwind CSS, Recharts, jsPDF, file‑saver |
| **Deployment** | Firebase Hosting (frontend), OTA updates (ESP32) |

## 📡 Hardware

- **ESP32‑DevKitC** – main controller
- **PZEM‑004T v3.0** – AC energy monitor (100 A, 260 V)
- **MAX485 TTL‑to‑RS485** module for sensor communication
- **RGB LED** – status indicator (blue/amber/green/red)

> Full wiring diagram and bill of materials available in `hardware/` folder (coming soon).

## 🚦 Getting Started

### Firmware

1. Clone the repository.
2. Open `firmware/` in PlatformIO.
3. Set your Wi‑Fi credentials and Firebase project details in `config.h`.
4. Build and upload to your ESP32.

### Dashboard

1. `cd dashboard && npm install`
2. Create a `.env` file with your Firebase config (see `.env.example`).
3. `npm run dev` to start the development server.
4. `npm run build` for production.

## 🔐 Security

- **Firestore security rules** enforce dashboard ownership, device claiming, and creator‑based access for ESP32 telemetry.
- **Master key** per dashboard for sensitive operations (delete, manage owners).
- **ESP32 credentials** stored encrypted via NVS (flash encryption recommended in production).

*Built with ❤️ for makers, engineers, and energy‑conscious users.*
