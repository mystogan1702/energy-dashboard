import { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useCommands(deviceId) {
  const [sending, setSending] = useState(false);

  const sendCommand = async (commandType) => {
    if (!deviceId) return;
    setSending(true);
    try {
      const docRef = doc(db, "devices", deviceId, "commands", "ota_update");
      await setDoc(docRef, {
        command: commandType,
        status: "pending",
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to send command:", err);
    } finally {
      setSending(false);
    }
  };

  return { sendCommand, sending };
}