import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUserDevices } from "../hooks/useUserDevices";
import { useNotifications } from "../hooks/useNotifications";
import { useUnreadNotificationsCount } from "../hooks/useUnreadNotificationsCount";
import DeviceSelector from "./DeviceSelector";
import NotificationList from "./NotificationList";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMobileAlt,
  faExclamationCircle,
  faPlug,
  faArrowRight,
  faBell,
} from "@fortawesome/free-solid-svg-icons";

/* -------- Polished Loading Spinner -------- */
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading notifications…</p>
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
        You haven't added any ESP32 energy monitors yet. Add your first device to receive alerts.
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

/* -------- Error State -------- */
function NotifError({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
        <FontAwesomeIcon icon={faExclamationCircle} className="text-5xl text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Couldn't load notifications</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-2">
        An error occurred while fetching your alerts.
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

/* -------- Main NotificationsPage Component -------- */
export default function NotificationsPage() {
  const [selectedDevice, setSelectedDevice] = useState("");
  const { devices, loading: devicesLoading } = useUserDevices();
  const { notifications, loading: notifLoading } = useNotifications(selectedDevice);
  const { markViewed } = useUnreadNotificationsCount(selectedDevice || null);

  // Auto‑select first device
  useEffect(() => {
    if (devices.length > 0 && !selectedDevice) setSelectedDevice(devices[0].id);
  }, [devices, selectedDevice]);

  // Reset badge count when the page opens – notifications stay unread
  useEffect(() => {
    markViewed();
  }, []);

  // ---- State handling ----
  if (devicesLoading) return <Spinner />;
  if (!devices.length) return <NoDevices />;
  if (notifLoading) return <Spinner />;

  // Note: If there is an error from the hook, we could add it later.
  // For now the hook doesn't expose an error, but we have the empty state in NotificationList.

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="font-medium dark:text-gray-300">Device:</span>
        <DeviceSelector selectedDevice={selectedDevice} onSelect={setSelectedDevice} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Alerts & Notifications</h2>
      <NotificationList notifications={notifications} deviceId={selectedDevice} />
    </div>
  );
}