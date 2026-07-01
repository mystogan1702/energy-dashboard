import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useNewEventLogsCount(deviceId) {
  // Retrieve the stored last visit timestamp from localStorage
  const getStoredLastVisit = () => {
    try {
      const stored = localStorage.getItem(`lastLogsVisit_${deviceId}`);
      return stored ? new Date(stored) : new Date(0);
    } catch {
      return new Date(0);
    }
  };

  const [lastVisit, setLastVisit] = useState(getStoredLastVisit);
  const [count, setCount] = useState(0);

  // Persist lastVisit to localStorage whenever it changes
  useEffect(() => {
    if (deviceId) {
      localStorage.setItem(`lastLogsVisit_${deviceId}`, lastVisit.toISOString());
    }
  }, [lastVisit, deviceId]);

  // Listen for new logs since lastVisit
  useEffect(() => {
    if (!deviceId) {
      setCount(0);
      return;
    }
    const q = query(
      collection(db, "devices", deviceId, "eventLogs"),
      where("timestamp", ">", lastVisit)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [deviceId, lastVisit]);

  // markViewed updates the last visit to now, which resets the count
  const markViewed = () => {
    setLastVisit(new Date());
  };

  return { count, markViewed };
}