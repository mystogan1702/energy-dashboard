import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
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

    const fetchDevices = async () => {
      try {
        const q = query(
          collection(db, "devices"),
          where("owners", "array-contains", currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setDevices(list);
      } catch (error) {
        console.error("Failed to fetch user devices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [currentUser]);

  return { devices, loading };
}