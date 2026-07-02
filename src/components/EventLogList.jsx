import React, { useMemo, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRedo,
  faWifi,
  faCloud,
  faBroadcastTower,
  faCog,
  faUser,
  faSync,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";

const eventIcons = {
  deviceBoot: faRedo,
  wifiConnected: faWifi,
  cloudInit: faCloud,
  sensorStarted: faBroadcastTower,
  configChanged: faCog,
  userLogin: faUser,
  cloudSync: faSync,
};

export default function EventLogList({ logs, allLogs, filterDate, selectedDateRef }) {
  // ---------- GUARD: ensure logs is always an array ----------
  const safeLogs = Array.isArray(logs) ? logs : [];
  const safeAllLogs = Array.isArray(allLogs) ? allLogs : safeLogs;

  const targetRef = useRef(null);

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const groups = {};
    safeLogs.forEach((log) => {
      const dateStr = log.timestamp?.seconds
        ? new Date(log.timestamp.seconds * 1000).toLocaleDateString()
        : "Unknown date";
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(log);
    });
    const sortedGroups = Object.entries(groups).sort((a, b) => {
      const dateA = a[0] === "Unknown date" ? new Date(0) : new Date(a[0]);
      const dateB = b[0] === "Unknown date" ? new Date(0) : new Date(b[0]);
      return dateB - dateA;
    });
    return sortedGroups;
  }, [safeLogs]);

  // Smooth scroll to the target date when it changes
  useEffect(() => {
    if (selectedDateRef && targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedDateRef, safeLogs]);

  if (!safeLogs.length) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
        <FontAwesomeIcon icon={faCircle} className="text-4xl mb-3 opacity-30" />
        <p className="text-lg font-medium">
          {filterDate ? `No event logs for ${filterDate}` : "No event logs yet."}
        </p>
        <p className="text-sm mt-1">
          {filterDate
            ? "Pick a different date or clear the filter."
            : "Logs will appear here when device events occur."}
        </p>
      </div>
    );
  }

  const totalDays = Object.keys(
    safeAllLogs.reduce((acc, log) => {
      const d = log.timestamp?.seconds
        ? new Date(log.timestamp.seconds * 1000).toLocaleDateString()
        : "Unknown date";
      acc[d] = true;
      return acc;
    }, {})
  ).length;

  return (
    <div className="space-y-6">
      {groupedLogs.map(([date, items]) => (
        <div key={date} ref={date === selectedDateRef ? targetRef : null}>
          {/* Date divider */}
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
              {date}
            </span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Table for this day */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3 text-center font-semibold">Time</th>
                  <th className="px-4 py-3 text-center font-semibold">Event</th>
                  <th className="px-4 py-3 text-center font-semibold">Description</th>
                  <th className="px-4 py-3 text-center font-semibold">Severity</th>
                  <th className="px-4 py-3 text-center font-semibold">User</th>
                  <th className="px-4 py-3 text-center font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((log) => (
                  <tr
                    key={log.id}
                    className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {log.timestamp?.seconds
                        ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-medium dark:text-gray-100 whitespace-nowrap">
                      <FontAwesomeIcon
                        icon={eventIcons[log.eventType] || faCircle}
                        className="mr-1.5 text-sm"
                      />
                      {log.eventType}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-xs truncate">
                      {log.description}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          log.severity === "error"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                            : log.severity === "warning"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
                            : "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        }`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 text-center">
                      {log.userEmail || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-500 font-mono text-center">
                      {log.ipAddress || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
        Showing {safeLogs.length} of {safeAllLogs.length} logs across {totalDays} days
      </p>
    </div>
  );
}