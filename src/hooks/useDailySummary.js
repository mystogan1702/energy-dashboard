import { useEffect } from "react";
import { collection, doc, getDoc, setDoc, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useDeviceConfig } from "./useDeviceConfig";

export function useDailySummary(deviceId) {
  const { config } = useDeviceConfig(deviceId);

  useEffect(() => {
    if (!deviceId) return;

    const generateYesterdaySummary = async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);

      const dateStr = yesterday.toISOString().split("T")[0]; // "YYYY-MM-DD"
      const summaryRef = doc(db, "devices", deviceId, "dailySummaries", dateStr);

      // Check if already exists
      const snap = await getDoc(summaryRef);
      if (snap.exists()) return; // already done

      try {
        const readingsRef = collection(db, "devices", deviceId, "readings");

        // First reading of yesterday
        const firstQ = query(
          readingsRef,
          where("timestamp", ">=", yesterday),
          where("timestamp", "<=", yesterdayEnd),
          orderBy("timestamp", "asc"),
          limit(1)
        );
        const lastQ = query(
          readingsRef,
          where("timestamp", ">=", yesterday),
          where("timestamp", "<=", yesterdayEnd),
          orderBy("timestamp", "desc"),
          limit(1)
        );

        const [firstSnap, lastSnap] = await Promise.all([getDocs(firstQ), getDocs(lastQ)]);

        if (firstSnap.empty || lastSnap.empty) return; // no data

        const firstEnergy = firstSnap.docs[0].data().energy;
        const lastEnergy = lastSnap.docs[0].data().energy;
        const consumed = lastEnergy - firstEnergy;
        const rate = config?.electricityRate || 12.5;
        const cost = consumed * rate;

        // Store summary
        await setDoc(summaryRef, {
          date: dateStr,
          totalConsumption: +consumed.toFixed(4),
          totalCost: +cost.toFixed(2),
          electricityRate: rate,
          generatedAt: new Date().toISOString(),
        });

        console.log(`✅ Daily summary created for ${dateStr}: ${consumed.toFixed(3)} kWh, ₱${cost.toFixed(2)}`);
      } catch (err) {
        console.error("Failed to generate daily summary:", err);
      }
    };

    generateYesterdaySummary();
  }, [deviceId, config]);
}