import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSelectedDevice } from "../hooks/useSelectedDevice";
import { useDeviceStatus } from "../hooks/useDeviceStatus";
import DeviceSelector from "./DeviceSelector";
import { db } from "../lib/firebase";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWifi,
  faClock,
  faMemory,
  faTachometerAlt,
  faDatabase,
  faDna,
  faRedo,
  faIdBadge,
  faMobileAlt,
  faExclamationCircle,
  faPlug,
  faArrowRight,
  faHeartbeat,
} from "@fortawesome/free-solid-svg-icons";

/* -------- Spinner / Empty / Error (unchanged) -------- */
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading device health data…</p>
    </div>
  );
}

function NoDevices() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <FontAwesomeIcon icon={faMobileAlt} className="text-5xl text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No devices registered</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
        You haven't added any ESP32 energy monitors yet. Add your first device to monitor its health.
      </p>
      <Link
        to="/device-setup"
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md transition"
      >
        <FontAwesomeIcon icon={faPlug} />
        Add Your First Device
        <FontAwesomeIcon icon={faArrowRight} />
      </Link>
    </div>
  );
}

function HealthError({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
        <FontAwesomeIcon icon={faExclamationCircle} className="text-5xl text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Couldn't load device health</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-2">
        An error occurred while fetching the system health data.
      </p>
      <p className="text-sm text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg max-w-lg">
        {message}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
      >
        Try Again
      </button>
    </div>
  );
}

/* -------- Main SystemHealthPage – mobile button layout -------- */
export default function SystemHealthPage() {
  const { selectedDevice, setSelectedDevice, devices, loading: devicesLoading } =
    useSelectedDevice();
  const { status, loading: statusLoading, error } = useDeviceStatus(selectedDevice);
  const [restarting, setRestarting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [modal, setModal] = useState({ open: false, type: "", message: "" });

  const openConfirm = (type) => {
    if (type === "restart") {
      setModal({
        open: true,
        type: "restart",
        message: "This will restart the ESP32 device. It will disconnect briefly and then reconnect.",
      });
    } else if (type === "update") {
      setModal({
        open: true,
        type: "update",
        message: "The firmware will be updated wirelessly. The device will restart after the update completes.",
      });
    }
  };

  const closeModal = () => setModal({ open: false, type: "", message: "" });

  const executeAction = async () => {
    const { type } = modal;
    closeModal();
    if (!selectedDevice) return;

    if (type === "restart") {
      setRestarting(true);
      try {
        const cmdRef = doc(db, "devices", selectedDevice, "commands", "restart");
        await setDoc(cmdRef, {
          command: "restart",
          status: "pending",
          createdAt: Timestamp.fromDate(new Date()),
        });
        alert("Restart command sent.");
      } catch (err) {
        alert("Failed to send command: " + err.message);
      } finally {
        setRestarting(false);
      }
    } else if (type === "update") {
      setUpdating(true);
      try {
        const cmdRef = doc(db, "devices", selectedDevice, "commands", "ota_update");
        await setDoc(cmdRef, {
          command: "ota_update",
          status: "pending",
          createdAt: Timestamp.fromDate(new Date()),
        });
        alert("Firmware update command sent.");
      } catch (err) {
        alert("Failed to send command: " + err.message);
      } finally {
        setUpdating(false);
      }
    }
  };

  // ---- State handling ----
  if (devicesLoading || statusLoading) return <Spinner />;
  if (!devices.length) return <NoDevices />;
  if (error) return <HealthError message={error} />;

  // Use fallback values when status is null
  const safeStatus = status || {
    rssi: 0,
    uptime: 0,
    freeHeap: 0,
    networkSpeed: null,
    dataTransferred: null,
    ssid: null,
    firmwareVersion: "—",
    resetReason: "—",
  };

  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${h}h ${m}m`;
  };

  const rssiPercent = safeStatus.rssi ? Math.min(100, Math.max(0, 2 * (safeStatus.rssi + 100))) : 0;
  const rssiColor = safeStatus.rssi
    ? safeStatus.rssi > -50
      ? "from-green-400 to-emerald-500"
      : safeStatus.rssi > -70
      ? "from-yellow-400 to-amber-500"
      : "from-red-400 to-rose-500"
    : "from-gray-400 to-gray-500";

  const heapPercent = safeStatus.freeHeap
    ? Math.min(100, Math.round((safeStatus.freeHeap / (safeStatus.freeHeap + 200000)) * 100))
    : 0;

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Header – wraps on mobile so buttons go to a new row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">System Health</h2>
          <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            ESP32 device diagnostics &amp; control
          </p>
        </div>
        <DeviceSelector selectedDevice={selectedDevice} onSelect={setSelectedDevice} />

        {/* Buttons container – on mobile, full width, centered, with a 2‑column grid */}
        <div className="w-full sm:w-auto order-last sm:order-none flex justify-center">
          <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
            <button
              onClick={() => openConfirm("update")}
              disabled={updating}
              className="w-full px-2.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg sm:rounded-xl transition disabled:opacity-50"
            >
              {updating ? "Sending..." : "Update"}
            </button>
            <button
              onClick={() => openConfirm("restart")}
              disabled={restarting}
              className="w-full px-2.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg sm:rounded-xl transition disabled:opacity-50"
            >
              {restarting ? "Sending..." : "Restart"}
            </button>
          </div>
        </div>
      </div>

      {/* Health cards – 2 cols on mobile (tiny), 3 cols on desktop (normal) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
        {/* WiFi Signal */}
        <div className="glass-card flex flex-col items-center p-2 sm:p-6">
          <h3 className="text-[10px] sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5 sm:mb-4">
            <FontAwesomeIcon icon={faWifi} className="mr-1 text-xs sm:text-base" />
            WiFi Signal
          </h3>
          <div className="relative w-16 h-16 sm:w-32 sm:h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
              <circle
                cx="60" cy="60" r="52"
                fill="none" strokeWidth="8" strokeLinecap="round"
                stroke={`url(#rssiGrad)`}
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${2 * Math.PI * 52 * (1 - rssiPercent / 100)}`}
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="rssiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={rssiColor.includes('green') ? '#4ade80' : rssiColor.includes('yellow') ? '#facc15' : '#f87171'} />
                  <stop offset="100%" stopColor={rssiColor.includes('green') ? '#22c55e' : rssiColor.includes('yellow') ? '#f97316' : '#ef4444'} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base sm:text-2xl font-bold text-gray-900 dark:text-white">{safeStatus.rssi}</span>
              <span className="text-[8px] sm:text-xs text-gray-500 dark:text-gray-400">dBm</span>
            </div>
          </div>
          <p className="mt-1.5 sm:mt-3 text-[10px] sm:text-sm font-medium text-gray-700 dark:text-gray-300">
            {safeStatus.rssi ? (safeStatus.rssi > -50 ? "Excellent" : safeStatus.rssi > -70 ? "Good" : "Weak") : "No signal"}
          </p>
        </div>

        {/* Uptime */}
        <div className="glass-card p-2 sm:p-6 space-y-1.5 sm:space-y-4">
          <h3 className="text-[10px] sm:text-sm font-medium text-gray-500 dark:text-gray-400">
            <FontAwesomeIcon icon={faClock} className="mr-1 text-xs sm:text-base" />
            Uptime
          </h3>
          <div className="flex items-end gap-1 sm:gap-2">
            <span className="text-lg sm:text-3xl font-bold text-gray-900 dark:text-white">{formatUptime(safeStatus.uptime)}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 sm:h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1 sm:h-2 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (safeStatus.uptime % 86400) / 86400 * 100)}%` }}
            />
          </div>
          <p className="text-[8px] sm:text-xs text-gray-500 dark:text-gray-400">Last boot: {safeStatus.resetReason}</p>
        </div>

        {/* Free memory */}
        <div className="glass-card p-2 sm:p-6 space-y-1.5 sm:space-y-4">
          <h3 className="text-[10px] sm:text-sm font-medium text-gray-500 dark:text-gray-400">
            <FontAwesomeIcon icon={faMemory} className="mr-1 text-xs sm:text-base" />
            Free Memory
          </h3>
          <div className="flex items-end gap-1 sm:gap-2">
            <span className="text-lg sm:text-3xl font-bold text-gray-900 dark:text-white">{(safeStatus.freeHeap / 1024).toFixed(1)}</span>
            <span className="text-[8px] sm:text-sm text-gray-500 dark:text-gray-400 mb-0.5">KB</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 sm:h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-1 sm:h-2 rounded-full transition-all duration-700"
              style={{ width: `${heapPercent}%` }}
            />
          </div>
          <p className="text-[8px] sm:text-xs text-gray-500 dark:text-gray-400">{safeStatus.freeHeap} bytes free</p>
        </div>

        {/* WiFi Speed & SSID */}
        <div className="glass-card p-2 sm:p-6 flex flex-col items-center justify-center">
          <FontAwesomeIcon icon={faTachometerAlt} className="text-lg sm:text-4xl mb-0.5 sm:mb-2 text-blue-500" />
          <h3 className="text-[10px] sm:text-sm font-medium text-gray-500 dark:text-gray-400">WiFi Speed</h3>
          <p className="text-base sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">
            {safeStatus.networkSpeed || "—"} <span className="text-[10px] sm:text-base font-normal">Mbps</span>
          </p>
          <p className="text-[8px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
            {safeStatus.ssid || "—"}
          </p>
          <p className="text-[8px] sm:text-xs text-gray-400 mt-0.5">Connected to</p>
        </div>

        {/* Data Transferred */}
        <div className="glass-card p-2 sm:p-6 flex flex-col items-center justify-center">
          <FontAwesomeIcon icon={faDatabase} className="text-lg sm:text-4xl mb-0.5 sm:mb-2 text-purple-500" />
          <h3 className="text-[10px] sm:text-sm font-medium text-gray-500 dark:text-gray-400">Data Transferred</h3>
          <p className="text-base sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">
            {safeStatus.dataTransferred || "0"} <span className="text-[10px] sm:text-base font-normal">MB</span>
          </p>
          <p className="text-[8px] sm:text-xs text-gray-400 mt-0.5">Total bytes sent/received</p>
        </div>

        {/* Firmware */}
        <div className="glass-card p-2 sm:p-6 flex flex-col items-center justify-center">
          <FontAwesomeIcon icon={faDna} className="text-lg sm:text-4xl mb-0.5 sm:mb-2 text-green-500" />
          <h3 className="text-[10px] sm:text-sm font-medium text-gray-500 dark:text-gray-400">Firmware Version</h3>
          <p className="text-base sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">{safeStatus.firmwareVersion}</p>
        </div>

        {/* Boot reason */}
        <div className="glass-card p-2 sm:p-6 flex flex-col items-center justify-center">
          <FontAwesomeIcon icon={faRedo} className="text-lg sm:text-4xl mb-0.5 sm:mb-2 text-gray-500" />
          <h3 className="text-[10px] sm:text-sm font-medium text-gray-500 dark:text-gray-400">Last Boot Reason</h3>
          <p className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">{safeStatus.resetReason}</p>
        </div>

        {/* Device UID */}
        <div className="glass-card p-2 sm:p-6 flex flex-col items-center justify-center">
          <FontAwesomeIcon icon={faIdBadge} className="text-lg sm:text-4xl mb-0.5 sm:mb-2 text-gray-500" />
          <h3 className="text-[10px] sm:text-sm font-medium text-gray-500 dark:text-gray-400">Device UID</h3>
          <p className="text-[8px] sm:text-xs font-mono text-gray-700 dark:text-gray-300 mt-0.5 sm:mt-1 break-all">{selectedDevice}</p>
        </div>
      </div>

      {/* Confirmation Modal (unchanged) */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 z-10">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {modal.type === "restart" ? "Restart Device" : "Firmware Update"}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {modal.message}
            </p>
            <p className="mt-2 text-xs text-red-500 dark:text-red-400 font-medium">
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={closeModal} className="btn-secondary">Cancel</button>
              <button
                onClick={executeAction}
                className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition ${
                  modal.type === "restart"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}