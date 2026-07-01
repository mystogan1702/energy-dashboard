import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useLatestReading(deviceId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!deviceId) {
      setData(null);
      setLoading(false);
      return;
    }

    const readingsRef = collection(db, "devices", deviceId, "readings");
    const q = query(readingsRef, orderBy("timestamp", "desc"), limit(1));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setData(snapshot.docs[0].data());
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [deviceId]);

  return { data, loading, error };
}