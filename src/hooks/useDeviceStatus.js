import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useDeviceStatus(deviceId) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!deviceId) {
      setStatus(null);
      setLoading(false);
      return;
    }

    // Correct path: devices/{deviceId}/status/current
    const docRef = doc(db, "devices", deviceId, "status", "current");

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setStatus(docSnap.data());
        } else {
          setStatus(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Status listener error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [deviceId]);

  return { status, loading, error };
}