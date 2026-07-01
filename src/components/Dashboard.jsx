import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLatestReading } from "../hooks/useLatestReading";
import { useUserDevices } from "../hooks/useUserDevices";
import { useDeviceConfig } from "../hooks/useDeviceConfig";
import { useDailyCost } from "../hooks/useDailyCost";
import { useDailySummary } from "../hooks/useDailySummary";
import { useDeviceStatus } from "../hooks/useDeviceStatus";
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

/* -------- Spinner / Empty / Error (unchanged) -------- */
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading your energy data…</p>
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
  const { status } = useDeviceStatus(selectedDevice);

  useDailySummary(selectedDevice);

  useEffect(() => {
    if (devices.length > 0 && !selectedDevice) setSelectedDevice(devices[0].id);
  }, [devices, selectedDevice]);

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
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Live Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real‑time energy monitoring</p>
        </div>
        <DeviceSelector selectedDevice={selectedDevice} onSelect={setSelectedDevice} />
      </div>

      {/* Quick summary cards – always 5 columns, ultra‑compact */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {/* Power */}
        <div className="glass-card !p-2 flex flex-col items-center justify-center text-center">
          <FontAwesomeIcon icon={faBolt} className="text-base sm:text-lg text-yellow-500 mb-0.5" />
          <div className="stat-label text-[9px] leading-tight">Power</div>
          <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
            {data.activePower.toFixed(0)} W
          </div>
        </div>

        {/* Energy Today */}
        <div className="glass-card !p-2 flex flex-col items-center justify-center text-center">
          <FontAwesomeIcon icon={faBatteryFull} className="text-base sm:text-lg text-green-500 mb-0.5" />
          <div className="stat-label text-[9px] leading-tight">Energy</div>
          <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
            {costLoading ? (
              <div className="animate-pulse h-3 w-10 bg-gray-300 dark:bg-gray-600 rounded mx-auto" />
            ) : (
              `${consumption != null ? consumption.toFixed(2) : '0.00'} kWh`
            )}
          </div>
        </div>

        {/* Today's Cost */}
        <div className="glass-card !p-2 flex flex-col items-center justify-center text-center">
          <FontAwesomeIcon icon={faMoneyBillWave} className="text-base sm:text-lg text-green-600 mb-0.5" />
          <div className="stat-label text-[9px] leading-tight">Cost</div>
          <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
            {costLoading ? (
              <div className="animate-pulse h-3 w-10 bg-gray-300 dark:bg-gray-600 rounded mx-auto" />
            ) : (
              `₱${cost != null ? cost.toFixed(2) : '0.00'}`
            )}
          </div>
        </div>

        {/* WiFi Name */}
        <div className="glass-card !p-2 flex flex-col items-center justify-center text-center">
          <FontAwesomeIcon icon={faWifi} className="text-base sm:text-lg text-blue-500 mb-0.5" />
          <div className="stat-label text-[9px] leading-tight">WiFi</div>
          <div className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-full">
            {status?.ssid || "—"}
          </div>
        </div>

        {/* WiFi Speed */}
        <div className="glass-card !p-2 flex flex-col items-center justify-center text-center">
          <FontAwesomeIcon icon={faTachometerAlt} className="text-base sm:text-lg text-purple-500 mb-0.5" />
          <div className="stat-label text-[9px] leading-tight">Speed</div>
          <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
            {status?.networkSpeed || "—"} <span className="text-[9px] font-normal">Mbps</span>
          </div>
        </div>
      </div>

      {/* Gauges – 2 columns on mobile, 3 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
