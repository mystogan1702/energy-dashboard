import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useUserDevices } from "../hooks/useUserDevices";
import { useEventLogs } from "../hooks/useEventLogs";
import { useNewEventLogsCount } from "../hooks/useNewEventLogsCount";
import DeviceSelector from "./DeviceSelector";
import EventLogList from "./EventLogList";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMobileAlt,
  faExclamationCircle,
  faPlug,
  faArrowRight,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";

/* -------- Polished Loading Spinner -------- */
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading event logs…</p>
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
        You haven't added any ESP32 energy monitors yet. Add your first device to see its event logs.
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
function LogsError({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
        <FontAwesomeIcon icon={faExclamationCircle} className="text-5xl text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Couldn't load event logs</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-2">
        An error occurred while fetching the audit trail.
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

/* -------- Main EventLogsPage Component -------- */
export default function EventLogsPage() {
  const [selectedDevice, setSelectedDevice] = useState("");
  const { devices, loading: devicesLoading } = useUserDevices();
  const { logs, loading: logsLoading } = useEventLogs(selectedDevice);
  const { markViewed } = useNewEventLogsCount(selectedDevice || null);

  const [filterDate, setFilterDate] = useState("");
  const [selectedDateRef, setSelectedDateRef] = useState(null);

  // Mark logs as seen when the page mounts
  useEffect(() => {
    markViewed();
  }, []);

  useEffect(() => {
    if (devices.length > 0 && !selectedDevice) setSelectedDevice(devices[0].id);
  }, [devices, selectedDevice]);

  // Filter logs by the selected date
  const filteredLogs = useMemo(() => {
    if (!filterDate) return logs;
    return logs.filter((log) => {
      if (!log.timestamp?.seconds) return false;
      const logDate = new Date(log.timestamp.seconds * 1000);
      const logDateStr = logDate.toISOString().split("T")[0];
      return logDateStr === filterDate;
    });
  }, [logs, filterDate]);

  const handleDateChange = (e) => {
    const dateStr = e.target.value;
    setFilterDate(dateStr);
    if (dateStr) {
      setSelectedDateRef(dateStr);
    } else {
      setSelectedDateRef(null);
    }
  };

  const clearFilter = () => {
    setFilterDate("");
    setSelectedDateRef(null);
  };

  // ---- State handling ----
  if (devicesLoading) return <Spinner />;
  if (!devices.length) return <NoDevices />;

  // If there's an error fetching logs? The useEventLogs hook doesn't expose an error state currently,
  // but we can still show a generic catch. We'll leave logsLoading as the main spinner.
  if (logsLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event Logs</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">System audit trail</p>
        </div>
        <DeviceSelector selectedDevice={selectedDevice} onSelect={setSelectedDevice} />
      </div>

      {/* Date filter bar */}
      <div className="glass-card !p-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Filter by date:
        </label>
        <input
          type="date"
          value={filterDate}
          onChange={handleDateChange}
          className="input-field w-48"
        />
        {filterDate && (
          <button
            onClick={clearFilter}
            className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            ✕ Clear
          </button>
        )}
        {filterDate && filteredLogs.length === 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
            No logs for {filterDate}
          </span>
        )}
      </div>

      {/* Log list or empty state when no logs at all */}
      <EventLogList
        logs={filteredLogs}
        allLogs={logs}
        filterDate={filterDate}
        selectedDateRef={selectedDateRef}
      />
    </div>
  );
}