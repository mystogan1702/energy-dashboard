import { useState, useEffect } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useDeviceConfig } from "./useDeviceConfig";

export function useDailyCost(deviceId) {
  const [cost, setCost] = useState(null);
  const [consumption, setConsumption] = useState(null);
  const [loading, setLoading] = useState(true);
  const { config } = useDeviceConfig(deviceId);

  useEffect(() => {
    if (!deviceId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const readingsRef = collection(db, "devices", deviceId, "readings");

        // Get first reading of today
        const firstQuery = query(
          readingsRef,
          where("timestamp", ">=", todayStart),
          where("timestamp", "<=", todayEnd),
          orderBy("timestamp", "asc"),
          limit(1)
        );
        const firstSnap = await getDocs(firstQuery);
        const firstEnergy = firstSnap.empty ? null : firstSnap.docs[0].data().energy;

        // Get latest reading of today
        const lastQuery = query(
          readingsRef,
          where("timestamp", ">=", todayStart),
          where("timestamp", "<=", todayEnd),
          orderBy("timestamp", "desc"),
          limit(1)
        );
        const lastSnap = await getDocs(lastQuery);
        const lastEnergy = lastSnap.empty ? null : lastSnap.docs[0].data().energy;

        if (firstEnergy !== null && lastEnergy !== null) {
          const consumed = lastEnergy - firstEnergy;
          const rate = config?.electricityRate || 12.5; // default ₱12.50
          setConsumption(consumed);
          setCost(consumed * rate);
        } else {
          setConsumption(0);
          setCost(0);
        }
      } catch (err) {
        console.error("Failed to fetch daily cost:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deviceId, config]);

  return { cost, consumption, loading };
}