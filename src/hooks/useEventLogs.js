import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useEventLogs(deviceId) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) { setLogs([]); setLoading(false); return; }
    const q = query(
      collection(db, "devices", deviceId, "eventLogs"),
      orderBy("timestamp", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setLogs(list);
      setLoading(false);
    });
    return () => unsub();
  }, [deviceId]);

  return { logs, loading };
}