import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Log an event to devices/{deviceId}/eventLogs
 * @param {string} deviceId
 * @param {string} eventType   e.g., "userLogin", "configChanged", "dailySummary"
 * @param {string} description
 * @param {string} severity    "info" | "warning" | "error"
 * @param {string|null} userEmail  optional, will use currentUser if not given
 */
export async function logEvent(deviceId, eventType, description, severity = "info", userEmail = null) {
  if (!deviceId) return;

  let email = userEmail;
  if (!email) {
    // Try to get the current user from the auth context if needed (but this is a plain function, not a hook)
    // To make it work in components, the caller should pass the email.
    email = "unknown";
  }

  let ip = "unknown";
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    ip = data.ip;
  } catch (_) { /* ignore */ }

  const event = {
    eventType,
    description,
    severity,
    deviceId,
    userEmail: email,
    ipAddress: ip,
    timestamp: Timestamp.fromDate(new Date()),
  };

  await addDoc(collection(db, "devices", deviceId, "eventLogs"), event);
  return event;
}