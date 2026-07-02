import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSelectedDevice } from "../hooks/useSelectedDevice";
import { useEventLogs } from "../hooks/useEventLogs";
import { useNewEventLogsCount } from "../hooks/useNewEventLogsCount";
import DeviceSelector from "./DeviceSelector";
import EventLogList from "./EventLogList";
import { db } from "../lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMobileAlt,
  faExclamationCircle,
  faPlug,
  faArrowRight,
  faTrashAlt,
  faSearch,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

/* -------- Helper components (unchanged) -------- */
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading event logs…</p>
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

export default function EventLogsPage() {
  const { selectedDevice, setSelectedDevice, devices, loading: devicesLoading } =
    useSelectedDevice();
  const { logs, loading: logsLoading } = useEventLogs(selectedDevice);
  const { markViewed } = useNewEventLogsCount(selectedDevice || null);

  const [filterDate, setFilterDate] = useState("");
  const [selectedDateRef, setSelectedDateRef] = useState(null);
  const [search, setSearch] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Reset badge count on every visit
  useEffect(() => {
    markViewed();
  }, [markViewed]);

  // Filter logs by date and search
  const filteredLogs = useMemo(() => {
    let result = logs || [];    // <-- guard against undefined
    if (filterDate) {
      result = result.filter((log) => {
        if (!log.timestamp?.seconds) return false;
        const logDate = new Date(log.timestamp.seconds * 1000);
        const logDateStr = logDate.toISOString().split("T")[0];
        return logDateStr === filterDate;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (log) =>
          log.eventType?.toLowerCase().includes(q) ||
          log.description?.toLowerCase().includes(q) ||
          log.userEmail?.toLowerCase().includes(q) ||
          log.ipAddress?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [logs, filterDate, search]);

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

  const clearSearch = () => {
    setSearch("");
  };

  // ---------- Clear All Logs ----------
  const handleClearAll = async () => {
    if (!selectedDevice) return;
    setClearing(true);
    try {
      const colRef = collection(db, "devices", selectedDevice, "eventLogs");
      const snapshot = await getDocs(colRef);
      const deletes = snapshot.docs.map((d) =>
        deleteDoc(doc(db, "devices", selectedDevice, "eventLogs", d.id))
      );
      await Promise.all(deletes);
    } catch (err) {
      alert("Failed to clear logs: " + err.message);
    } finally {
      setClearing(false);
      setShowClearConfirm(false);
    }
  };

  // ---- State handling ----
  if (devicesLoading) return <Spinner />;
  if (!devices.length) return <NoDevices />;
  if (logsLoading) return <Spinner />;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header – title and device selector always in one row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Event Logs</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">System audit trail</p>
        </div>
        <DeviceSelector selectedDevice={selectedDevice} onSelect={setSelectedDevice} />
      </div>

      {/* Control bar – Search (left) | Date filter (center) | Clear All (right) */}
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="relative w-40 sm:w-56">
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field text-xs sm:text-sm py-1.5 sm:py-2 pl-8 pr-8"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm">
            <FontAwesomeIcon icon={faSearch} />
          </span>
          {search && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Date:
          </label>
          <input
            type="date"
            value={filterDate}
            onChange={handleDateChange}
            className="input-field text-xs sm:text-sm py-1.5 sm:py-2 w-36 sm:w-44"
          />
          {filterDate && (
            <button
              onClick={clearFilter}
              className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              ✕
            </button>
          )}
        </div>

        <button
          onClick={() => setShowClearConfirm(true)}
          disabled={!logs.length}
          className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faTrashAlt} className="text-xs sm:text-sm" />
          <span className="hidden sm:inline">Clear All</span>
        </button>
      </div>

      {/* Log list – no internal search bar */}
      <EventLogList
        logs={filteredLogs}               // already an array, never undefined
        allLogs={logs || []}              // fallback to empty array
        filterDate={filterDate}
        selectedDateRef={selectedDateRef}
      />

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowClearConfirm(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 z-10">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Clear All Logs</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              This will permanently delete all event logs for this device. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowClearConfirm(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition disabled:opacity-50"
              >
                {clearing ? "Deleting..." : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}