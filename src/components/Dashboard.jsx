import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLatestReading } from "../hooks/useLatestReading";
import { useSelectedDevice } from "../hooks/useSelectedDevice";
import { useDeviceConfig } from "../hooks/useDeviceConfig";
import { useDailyCost } from "../hooks/useDailyCost";
import { useDailySummary } from "../hooks/useDailySummary";
import { useDeviceStatus } from "../hooks/useDeviceStatus";
import DeviceSelector from "./DeviceSelector";
import StatCard from "./StatCard";
import EmptyDashboard from "./EmptyDashboard";
import CreateDashboardWizard from "./CreateDashboardWizard";   // <-- new
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

/* -------- Spinner / Error (unchanged) -------- */
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading your energy data…</p>
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
  const { selectedDevice, setSelectedDevice, devices, loading: devicesLoading } =
    useSelectedDevice();
  const { data, loading: readingLoading, error } = useLatestReading(selectedDevice || null);
  const { config } = useDeviceConfig(selectedDevice);
  const { cost, consumption, loading: costLoading } = useDailyCost(selectedDevice);
  const { status } = useDeviceStatus(selectedDevice);

  useDailySummary(selectedDevice);

  // State for the wizard modal
  const [wizardOpen, setWizardOpen] = useState(false);

  if (devicesLoading) return <Spinner />;

  // ----- NO DEVICES: show the modern empty state -----
  if (!devices.length) {
    return (
      <>
        <EmptyDashboard onOpenWizard={() => setWizardOpen(true)} />
        <CreateDashboardWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
        />
      </>
    );
  }

  // (The rest of the component remains identical)
  if (readingLoading) return <Spinner />;
  if (error) return <DashboardError message={error} />;

  const safeData = data || {
    voltage: 0,
    current: 0,
    activePower: 0,
    energy: 0,
    frequency: 0,
    powerFactor: 0,
    timestamp: null,
  };

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
      {/* Header + Device Selector */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Live Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real‑time energy monitoring</p>
        </div>
        <DeviceSelector selectedDevice={selectedDevice} onSelect={setSelectedDevice} />
      </div>

      {/* Quick summary cards – 5 columns on all screens */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {/* Power */}
        <div className="glass-card !p-2 flex flex-col items-center justify-center text-center">
          <FontAwesomeIcon icon={faBolt} className="text-base sm:text-lg text-yellow-500 mb-0.5" />
          <div className="stat-label text-[9px] leading-tight">Power</div>
          <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
            {safeData.activePower.toFixed(0)} W
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
        <StatCard title="Voltage" value={safeData.voltage} unit="V" type="voltage" thresholds={thresholds.voltage} lastUpdated={safeData.timestamp} />
        <StatCard title="Current" value={safeData.current} unit="A" type="current" thresholds={thresholds.current} lastUpdated={safeData.timestamp} />
        <StatCard title="Active Power" value={safeData.activePower} unit="W" type="activePower" thresholds={thresholds.activePower} lastUpdated={safeData.timestamp} />
        <StatCard title="Energy" value={safeData.energy} unit="kWh" type="energy" thresholds={thresholds.energy} lastUpdated={safeData.timestamp} />
        <StatCard title="Frequency" value={safeData.frequency} unit="Hz" type="frequency" thresholds={thresholds.frequency} lastUpdated={safeData.timestamp} />
        <StatCard title="Power Factor" value={safeData.powerFactor} unit="" type="powerFactor" thresholds={thresholds.powerFactor} lastUpdated={safeData.timestamp} />
      </div>
    </div>
  );
}