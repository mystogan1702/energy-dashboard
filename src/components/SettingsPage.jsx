import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useUserDevices } from "../hooks/useUserDevices";
import { useDeviceConfig } from "../hooks/useDeviceConfig";
import { useCommands } from "../hooks/useCommands";
import { useAuth } from "../lib/AuthContext";
import { logEvent } from "../lib/logEvent";
import DeviceSelector from "./DeviceSelector";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCog,
  faExclamationCircle,
  faMobileAlt,
  faSave,
  faArrowRight,
  faPlug,
} from "@fortawesome/free-solid-svg-icons";

/* -------- Polished Loading Spinner -------- */
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading your settings…</p>
    </div>
  );
}

/* -------- No Devices State (same as Dashboard) -------- */
function NoDevices() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <FontAwesomeIcon icon={faMobileAlt} className="text-5xl text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No devices registered</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
        You haven't added any ESP32 energy monitors yet. Add your first device to start configuring it.
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

/* -------- No Config State (device exists but config document missing) -------- */
function NoConfig({ deviceId }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <FontAwesomeIcon icon={faCog} className="text-5xl text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No configuration found</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md">
        The device <strong>{deviceId}</strong> doesn't have a config document yet. You can create one by saving the settings below.
      </p>
    </div>
  );
}

/* -------- Error State -------- */
function SettingsError({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
        <FontAwesomeIcon icon={faExclamationCircle} className="text-5xl text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Settings could not be loaded</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-2">
        An error occurred while fetching the device configuration.
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

/* -------- Main SettingsPage Component -------- */
export default function SettingsPage() {
  const [selectedDevice, setSelectedDevice] = useState("");
  const { devices, loading: devicesLoading } = useUserDevices();
  const { config, loading: configLoading, error: configError, updateConfig } =
    useDeviceConfig(selectedDevice);
  const { sendCommand, sending: cmdSending } = useCommands(selectedDevice);
  const { currentUser } = useAuth();

  const [form, setForm] = useState({});
  const [saveMsg, setSaveMsg] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const originalConfigRef = useRef(null);

  useEffect(() => {
    if (config && !originalConfigRef.current) {
      originalConfigRef.current = { ...config };
    }
  }, [config]);

  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  useEffect(() => {
    if (devices.length > 0 && !selectedDevice) setSelectedDevice(devices[0].id);
  }, [devices, selectedDevice]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const openConfirm = (e) => {
    e.preventDefault();
    if (!selectedDevice) return;
    setShowConfirm(true);
  };

  const handleSaveConfirmed = async () => {
    setShowConfirm(false);

    const changes = [];
    if (originalConfigRef.current) {
      Object.keys(form).forEach((key) => {
        const oldVal = originalConfigRef.current[key];
        const newVal = form[key];
        if (oldVal !== newVal) {
          changes.push(`${key}: ${oldVal} → ${newVal}`);
        }
      });
    }

    try {
      await updateConfig(form);
      setSaveMsg("Settings saved successfully! Refreshing page…");
      setTimeout(() => setSaveMsg(""), 2000);

      originalConfigRef.current = { ...form };

      const description = changes.length > 0
        ? `Settings changed: ${changes.join(", ")}`
        : "Settings saved (no changes detected)";

      await logEvent(
        selectedDevice,
        "configChanged",
        description,
        "info",
        currentUser?.email || "unknown"
      );

      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setSaveMsg("Error: " + err.message);
    }
  };

  const handleOTA = () => {
    if (!window.confirm("Start firmware update? The device will restart.")) return;
    sendCommand("ota_update");
    alert("OTA command sent.");
  };

  // ---- State handling ----
  if (devicesLoading || configLoading) return <Spinner />;
  if (!devices.length) return <NoDevices />;
  if (configError) return <SettingsError message={configError} />;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <DeviceSelector selectedDevice={selectedDevice} onSelect={setSelectedDevice} />
      </div>

      {!config ? (
        <NoConfig deviceId={selectedDevice} />
      ) : (
        <form onSubmit={openConfirm} className="glass-card space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Device Settings</h2>
          {saveMsg && (
            <div
              className={`p-3 rounded-xl text-sm ${
                saveMsg.includes("success")
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700"
                  : "bg-red-50 dark:bg-red-900/20 text-red-700"
              }`}
            >
              {saveMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="stat-label">Device Name</label>
              <input
                type="text"
                name="deviceName"
                value={form.deviceName || ""}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="stat-label">Timezone</label>
              <select
                name="timezone"
                value={form.timezone || "Asia/Manila"}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              ["voltageMin", "Voltage Min (V)"],
              ["voltageMax", "Voltage Max (V)"],
              ["currentMax", "Current Max (A)"],
              ["powerMax", "Power Max (W)"],
              ["powerFactorMin", "Power Factor Min"],
              ["frequencyMin", "Frequency Min (Hz)"],
              ["frequencyMax", "Frequency Max (Hz)"],
              ["alertCooldownSec", "Alert Cooldown (s)"],
            ].map(([name, label]) => (
              <div key={name}>
                <label className="stat-label">{label}</label>
                <input
                  type="number"
                  step="0.1"
                  name={name}
                  value={form[name] || ""}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            ))}
          </div>

          <button type="submit" className="btn-primary w-full">
            <FontAwesomeIcon icon={faSave} className="mr-2" />
            Save Settings
          </button>
        </form>
      )}

      <div className="glass-card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Firmware Update (OTA)
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Send an OTA command to the device.
        </p>
        <button
          onClick={handleOTA}
          disabled={cmdSending}
          className="btn-primary bg-gradient-to-r from-orange-500 to-amber-500"
        >
          {cmdSending ? "Sending..." : "Trigger OTA"}
        </button>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 z-10">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Save Settings</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to apply these changes? The page will refresh after saving.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSaveConfirmed} className="btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}