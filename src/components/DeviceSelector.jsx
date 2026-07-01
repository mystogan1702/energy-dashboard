import React from "react";
import { useUserDevices } from "../hooks/useUserDevices";

export default function DeviceSelector({ selectedDevice, onSelect }) {
  const { devices, loading } = useUserDevices();

  if (loading) return <span className="text-sm text-gray-400">Loading...</span>;
  if (devices.length === 0) return <span className="text-sm text-red-500">No devices</span>;

  return (
    <select
      value={selectedDevice}
      onChange={(e) => onSelect(e.target.value)}
      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
    >
      {devices.map((d) => (
        <option key={d.id} value={d.id}>
          {d.name || d.id}
        </option>
      ))}
    </select>
  );
}