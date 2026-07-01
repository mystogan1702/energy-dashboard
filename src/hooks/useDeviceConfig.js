import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useDeviceConfig(deviceId) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!deviceId) return;

    const fetchConfig = async () => {
      setLoading(true);
      setError(null);
      try {
        // Correct path: collection 'devices' > doc deviceId > collection 'config' > doc 'settings'
        const docRef = doc(db, "devices", deviceId, "config", "settings");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setConfig(snap.data());
        } else {
          // Return default config if no document exists
          setConfig({
            voltageMin: 200,
            voltageMax: 250,
            currentMax: 10,
            powerMax: 2000,
            powerFactorMin: 0.8,
            frequencyMin: 49.5,
            frequencyMax: 50.5,
            alertCooldownSec: 300,
            deviceName: deviceId,
            timezone: "Asia/Manila",
            measurementIntervalSec: 2,
            uploadIntervalSec: 10,
          });
        }
      } catch (err) {
        console.error("Failed to load config:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [deviceId]);

  const updateConfig = async (newConfig) => {
    if (!deviceId) return;
    const docRef = doc(db, "devices", deviceId, "config", "settings");
    await setDoc(docRef, newConfig, { merge: true });
    setConfig(newConfig);
  };

  return { config, loading, error, updateConfig };
}