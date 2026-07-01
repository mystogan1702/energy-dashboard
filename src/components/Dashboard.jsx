import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLatestReading } from "../hooks/useLatestReading";
import { useUserDevices } from "../hooks/useUserDevices";
import { useDeviceConfig } from "../hooks/useDeviceConfig";
import { useDailyCost } from "../hooks/useDailyCost";
import { useDailySummary } from "../hooks/useDailySummary";
import { useDeviceStatus } from "../hooks/useDeviceStatus";   // <--- new
import DeviceSelector from "./DeviceSelector";
import StatCard from "./StatCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faBatteryFull,
  faWifi,
  faChartBar,
  faMoneyBillWave,
  faMobileAlt,
  faExclamationCircle,
  faPlug,
  faArrowRight,
  faTachometerAlt,
} from "@fortawesome/free-solid-svg-icons";

/* -------- Polished Loading Spinner -------- */
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading your energy data…</p>
    </div>
  );
}

/* -------- Beautiful Empty State (No devices) -------- */
function NoDevices() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <FontAwesomeIcon icon={faMobileAlt} className="text-5xl text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No devices registered</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
        You haven't added any ESP32 energy monitors yet. Add your first device to start monitoring your electricity usage.
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

/* -------- No Data Yet (device selected, but no readings) -------- */
function NoData() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <FontAwesomeIcon icon={faChartBar} className="text-5xl text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No data available yet</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md">
        The device is connected but hasn't sent any readings. Make sure the ESP32 is powered on and connected to WiFi.
      </p>
    </div>
  );
}

/* -------- Error State -------- */
function DashboardError({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
        <FontAwesomeIcon icon={faExclamationCircle} className="text-5xl text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-2">
        We couldn't load your energy data. This might be a temporary issue.
      </p>
      <p className="text-sm text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">
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

/* -------- Main Dashboard Component -------- */
export default function Dashboard() {
  const [selectedDevice, setSelectedDevice] = useState("");
  const { devices, loading: devicesLoading } = useUserDevices();
  const { data, loading: readingLoading, error } = useLatestReading(selectedDevice || null);
  const { config } = useDeviceConfig(selectedDevice);
  const { cost, consumption, loading: costLoading } = useDailyCost(selectedDevice);
  const { status } = useDeviceStatus(selectedDevice);   // <--- new

  // Automatically generate yesterday's daily summary if not already present
  useDailySummary(selectedDevice);

  useEffect(() => {
    if (devices.length > 0 && !selectedDevice) setSelectedDevice(devices[0].id);
  }, [devices, selectedDevice]);

  // ---- State handling ----
  if (devicesLoading) return <Spinner />;
  if (!devices.length) return <NoDevices />;
  if (readingLoading) return <Spinner />;
  if (error) return <DashboardError message={error} />;
  if (!data) return <NoData />;

  const thresholds = {
    voltage: { min: config?.voltageMin || 200, max: config?.voltageMax || 250 },
    current: { min: 0, max: config?.currentMax || 10 },
    activePower: { min: 0, max: config?.powerMax || 2000 },
    energy: { min: 0, max: 100 },
    frequency: { min: config?.frequencyMin || 49.5, max: config?.frequencyMax || 50.5 },
    powerFactor: { min: config?.powerFactorMin || 0.8, max: 1.0 },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Live Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real‑time energy monitoring</p>
        </div>
        <DeviceSelector selectedDevice={selectedDevice} onSelect={setSelectedDevice} />
      </div>

      {/* Quick summary cards – 5 items on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-card !p-4 flex items-center gap-3">
          <FontAwesomeIcon icon={faBolt} className="text-2xl text-yellow-500" />
          <div>
            <div className="stat-label">Power</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {data.activePower.toFixed(0)} W
            </div>
          </div>
        </div>

        <div className="glass-card !p-4 flex items-center gap-3">
          <FontAwesomeIcon icon={faBatteryFull} className="text-2xl text-green-500" />
          <div>
            <div className="stat-label">Energy Today</div>
            {costLoading ? (
              <div className="animate-pulse h-5 w-16 bg-gray-300 dark:bg-gray-600 rounded" />
            ) : (
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {consumption != null ? consumption.toFixed(2) : '0.00'} kWh
              </div>
            )}
          </div>
        </div>

        <div className="glass-card !p-4 flex items-center gap-3">
          <FontAwesomeIcon icon={faMoneyBillWave} className="text-2xl text-green-600" />
          <div>
            <div className="stat-label">Today's Cost</div>
            {costLoading ? (
              <div className="animate-pulse h-5 w-16 bg-gray-300 dark:bg-gray-600 rounded" />
            ) : (
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                ₱{cost != null ? cost.toFixed(2) : '0.00'}
              </div>
            )}
          </div>
        </div>

        {/* WiFi Name (SSID) – replaced Frequency */}
        <div className="glass-card !p-4 flex items-center gap-3">
          <FontAwesomeIcon icon={faWifi} className="text-2xl text-blue-500" />
          <div>
            <div className="stat-label">WiFi Name</div>
            <div className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[100px]">
              {status?.ssid || "—"}
            </div>
          </div>
        </div>

        {/* WiFi Speed – replaced Power Factor */}
        <div className="glass-card !p-4 flex items-center gap-3">
          <FontAwesomeIcon icon={faTachometerAlt} className="text-2xl text-purple-500" />
          <div>
            <div className="stat-label">WiFi Speed</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {status?.networkSpeed || "—"} <span className="text-sm font-normal">Mbps</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gauges – unchanged */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Voltage" value={data.voltage} unit="V" type="voltage" thresholds={thresholds.voltage} lastUpdated={data.timestamp} />
        <StatCard title="Current" value={data.current} unit="A" type="current" thresholds={thresholds.current} lastUpdated={data.timestamp} />
        <StatCard title="Active Power" value={data.activePower} unit="W" type="activePower" thresholds={thresholds.activePower} lastUpdated={data.timestamp} />
        <StatCard title="Energy" value={data.energy} unit="kWh" type="energy" thresholds={thresholds.energy} lastUpdated={data.timestamp} />
        <StatCard title="Frequency" value={data.frequency} unit="Hz" type="frequency" thresholds={thresholds.frequency} lastUpdated={data.timestamp} />
        <StatCard title="Power Factor" value={data.powerFactor} unit="" type="powerFactor" thresholds={thresholds.powerFactor} lastUpdated={data.timestamp} />
      </div>
    </div>
  );
}