import { useState, useEffect, useMemo } from "react";
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "../lib/firebase";

const DEVICE_ID = "device_001";
const MAX_DOCS = 5000;

function formatLabel(date, bucketMs) {
  if (bucketMs >= 365 * 24 * 60 * 60 * 1000) {
    // yearly bucket → show year
    return date.getFullYear().toString();
  } else if (bucketMs >= 28 * 24 * 60 * 60 * 1000) {
    // monthly bucket → show short month name
    return date.toLocaleDateString("en-US", { month: "short" });
  } else if (bucketMs >= 24 * 60 * 60 * 1000) {
    // daily bucket → show "Mon, Jun 1" or "Jun 1"
    const options = { weekday: "short", month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  } else if (bucketMs >= 60 * 60 * 1000) {
    // hourly bucket → show time "6 AM"
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } else {
    // minute or raw → show full time "6:05 AM"
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
  }
}

export function useReadingsRange(start, end, aggregation = "auto") {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!start || !end) {
      setRawData([]);
      setLoading(false);
      return;
    }

    const startTimestamp = new Date(start);
    startTimestamp.setHours(0, 0, 0, 0);
    const endTimestamp = new Date(end);
    endTimestamp.setHours(23, 59, 59, 999);

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const readingsRef = collection(db, "devices", DEVICE_ID, "readings");
        const q = query(
          readingsRef,
          where("timestamp", ">=", startTimestamp),
          where("timestamp", "<=", endTimestamp),
          orderBy("timestamp", "asc"),
          limit(MAX_DOCS)
        );
        const snapshot = await getDocs(q);
        const docs = [];
        snapshot.forEach((doc) => docs.push({ id: doc.id, ...doc.data() }));
        setRawData(docs);
      } catch (err) {
        console.error("Error fetching readings:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [start, end]);

  const aggregatedData = useMemo(() => {
    if (!rawData.length) return [];

    const rangeMs = end - start;

    // Determine bucket size in milliseconds based on aggregation param
    let bucketMs;
    if (aggregation === "auto") {
      if (rangeMs <= 6 * 60 * 60 * 1000) bucketMs = 5 * 60 * 1000;
      else if (rangeMs <= 24 * 60 * 60 * 1000) bucketMs = 15 * 60 * 1000;
      else if (rangeMs <= 7 * 24 * 60 * 60 * 1000) bucketMs = 60 * 60 * 1000;
      else bucketMs = 24 * 60 * 60 * 1000;
    } else if (aggregation === "raw") {
      bucketMs = 0; // no bucketing, use every reading
    } else {
      // predefined intervals: "1min", "5min", etc.
      const map = {
        "1min": 60 * 1000,
        "5min": 5 * 60 * 1000,
        "15min": 15 * 60 * 1000,
        "30min": 30 * 60 * 1000,
        "1hour": 60 * 60 * 1000,
        "1day": 24 * 60 * 60 * 1000,
        "1week": 7 * 24 * 60 * 60 * 1000,
        "1month": 30 * 24 * 60 * 60 * 1000, // approximate
      };
      bucketMs = map[aggregation] || 60 * 60 * 1000;
    }

    const buckets = new Map();

    rawData.forEach((reading) => {
      const ts = reading.timestamp?.seconds
        ? new Date(reading.timestamp.seconds * 1000)
        : new Date(reading.timestamp);

      let bucketTime;
      if (bucketMs === 0) {
        // raw: keep exact timestamp
        bucketTime = ts;
      } else {
        bucketTime = new Date(Math.floor(ts.getTime() / bucketMs) * bucketMs);
      }
      const key = bucketTime.toISOString();

      if (!buckets.has(key)) {
        buckets.set(key, {
          time: bucketTime,
          label: formatLabel(bucketTime, bucketMs),
          voltage: [],
          current: [],
          activePower: [],
          energy: [],
          frequency: [],
          powerFactor: [],
        });
      }

      const bucket = buckets.get(key);
      bucket.voltage.push(reading.voltage);
      bucket.current.push(reading.current);
      bucket.activePower.push(reading.activePower);
      bucket.energy.push(reading.energy);
      bucket.frequency.push(reading.frequency);
      bucket.powerFactor.push(reading.powerFactor);
    });

    const aggregated = [];
    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const min = (arr) => Math.min(...arr);
    const max = (arr) => Math.max(...arr);

    buckets.forEach((bucket) => {
      aggregated.push({
        time: bucket.time.toISOString(),
        label: bucket.label,
        voltageAvg: avg(bucket.voltage),
        voltageMin: min(bucket.voltage),
        voltageMax: max(bucket.voltage),
        currentAvg: avg(bucket.current),
        currentMin: min(bucket.current),
        currentMax: max(bucket.current),
        powerAvg: avg(bucket.activePower),
        powerMin: min(bucket.activePower),
        powerMax: max(bucket.activePower),
        energyAvg: bucket.energy.length ? bucket.energy[bucket.energy.length - 1] : 0,
        freqAvg: avg(bucket.frequency),
        freqMin: min(bucket.frequency),
        freqMax: max(bucket.frequency),
        pfAvg: avg(bucket.powerFactor),
        pfMin: min(bucket.powerFactor),
        pfMax: max(bucket.powerFactor),
      });
    });

    aggregated.sort((a, b) => new Date(a.time) - new Date(b.time));
    return aggregated;
  }, [rawData, start, end, aggregation]);

  return { rawData, aggregatedData, loading, error };
}