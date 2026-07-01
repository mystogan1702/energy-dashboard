import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useNotifications(deviceId) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    // Fetch up to 200 notifications – enough for several pages of 20
    const q = query(
      collection(db, "devices", deviceId, "notifications"),
      orderBy("timestamp", "desc"),
      limit(200)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setNotifications(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [deviceId]);

  return { notifications, loading };
}