import { useState, useEffect, useCallback } from "react";
import { useUserDevices } from "./useUserDevices";

const STORAGE_KEY = "pesowatt_selected_device";

export function useSelectedDevice() {
  const { devices, loading } = useUserDevices();
  const [selectedDevice, setSelectedDevice] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || "";
  });

  // If the stored device no longer exists, or the device list is empty, clear selection
  useEffect(() => {
    if (!loading) {
      if (devices.length === 0) {
        setSelectedDevice("");
        localStorage.removeItem(STORAGE_KEY);
      } else {
        const exists = devices.some((d) => d.id === selectedDevice);
        if (!exists) {
          const firstId = devices[0].id;
          setSelectedDevice(firstId);
          localStorage.setItem(STORAGE_KEY, firstId);
        }
      }
    }
  }, [loading, devices, selectedDevice]);

  const selectDevice = useCallback((deviceId) => {
    setSelectedDevice(deviceId);
    localStorage.setItem(STORAGE_KEY, deviceId);
  }, []);

  return { selectedDevice: selectedDevice || null, setSelectedDevice: selectDevice, devices, loading };
}