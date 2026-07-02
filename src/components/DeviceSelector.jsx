import React, { useState, useRef, useEffect } from "react";
import { useUserDevices } from "../hooks/useUserDevices";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faMobileAlt, faPlug } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

export default function DeviceSelector({ selectedDevice, onSelect }) {
  const { devices, loading } = useUserDevices();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // If no device is selected but devices exist, auto‑select the first one
  useEffect(() => {
    if (!loading && devices.length > 0 && !selectedDevice) {
      onSelect(devices[0].id);
    }
  }, [loading, devices, selectedDevice, onSelect]);

  const currentDevice = devices.find((d) => d.id === selectedDevice);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button – smaller on mobile, normal on desktop */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all"
      >
        <FontAwesomeIcon icon={faMobileAlt} className="text-gray-500 dark:text-gray-400 text-sm sm:text-base" />
        <span className="text-gray-700 dark:text-gray-300 truncate max-w-[80px] sm:max-w-[120px]">
          {loading ? "..." : currentDevice ? currentDevice.id : "No device"}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-[10px] sm:text-xs text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown menu – matches button width */}
      {open && (
        <div className="absolute right-0 mt-2 min-w-full w-max origin-top-right animate-dropdown z-50">
          <div className="glass-card !p-2 shadow-xl space-y-1">
            {devices.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <FontAwesomeIcon icon={faMobileAlt} className="text-2xl text-gray-400 mb-1" />
                <p className="text-xs text-gray-500 dark:text-gray-400">No devices registered.</p>
                <Link
                  to="/device-setup"
                  onClick={() => setOpen(false)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  <FontAwesomeIcon icon={faPlug} />
                  Add your first device
                </Link>
              </div>
            ) : (
              devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => {
                    onSelect(device.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors ${
                    device.id === selectedDevice
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <FontAwesomeIcon icon={faMobileAlt} className="text-gray-400" />
                  <span>{device.id}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}