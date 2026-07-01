import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useUnreadNotificationsCount(deviceId) {
  const getLastVisit = () => {
    try {
      const stored = localStorage.getItem(`lastNotifVisit_${deviceId}`);
      return stored ? new Date(stored) : new Date(0);
    } catch {
      return new Date(0);
    }
  };

  const [lastVisit, setLastVisit] = useState(getLastVisit);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (deviceId) {
      localStorage.setItem(`lastNotifVisit_${deviceId}`, lastVisit.toISOString());
    }
  }, [lastVisit, deviceId]);

  useEffect(() => {
    if (!deviceId) {
      setCount(0);
      return;
    }
    const q = query(
      collection(db, "devices", deviceId, "notifications"),
      where("status", "==", "unread"),
      where("timestamp", ">", lastVisit)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [deviceId, lastVisit]);

  // Call this when the user visits the notifications page
  const markViewed = () => {
    setLastVisit(new Date());
  };

  return { count, markViewed };
}