import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/AuthContext";

export function useUserDevices() {
  const { currentUser } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setDevices([]);
      setLoading(false);
      return;
    }

    // Listen to devices where the current user is in the owners array
    const q = query(
      collection(db, "devices"),
      where("owners", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
        setDevices(list);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to listen to devices:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  return { devices, loading };
}