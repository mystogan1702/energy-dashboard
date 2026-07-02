import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { db } from "../lib/firebase";
import {
  doc,
  setDoc,
  Timestamp,
  collection,
  getDocs,
} from "firebase/firestore";
import { logEvent } from "../lib/logEvent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlug,
  faArrowRight,
  faArrowLeft,
  faTimes,
  faUserPlus,
  faCheck,
  faEye,
  faEyeSlash,
  faChartLine,
  faBell,
  faClipboardList,
  faShieldAlt,
  faKey,
  faMobileAlt,
  faBolt,
  faCheckCircle,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

/* -------- Toast -------- */
function Toast({ message, type = "success", visible }) {
  if (!visible) return null;
  const bg =
    type === "success"
      ? "bg-green-500/30 border-green-400/40 text-green-900 dark:text-green-100"
      : "bg-red-500/30 border-red-400/40 text-red-900 dark:text-red-100";
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
      <div
        className={`pointer-events-auto backdrop-blur-md border ${bg} px-5 py-2 rounded-2xl shadow-xl animate-toastPop text-sm font-medium`}
      >
        {message}
      </div>
    </div>
  );
}

/* -------- Step Indicator -------- */
function StepIndicator({ currentStep, totalSteps }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            i + 1 === currentStep
              ? "bg-blue-600 text-white scale-110 shadow-lg"
              : i + 1 < currentStep
              ? "bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
              : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
          }`}
        >
          {i + 1 < currentStep ? "✓" : i + 1}
        </div>
      ))}
    </div>
  );
}

/* -------- Password Strength -------- */
function calculateStrength(password) {
  let score = 0;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 8) score++;
  return score;
}

/* -------- ESP32 Owner UID (always added) -------- */
const ESP32_OWNER_UID = "DhYWe9i4ojajr0kh3eyS70o0TNs2";

/* -------- Main Wizard -------- */
export default function CreateDashboardWizard({ open, onClose }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Step 1 state
  const [deviceName, setDeviceName] = useState("");
  const [owners, setOwners] = useState([]);
  const [newOwnerInput, setNewOwnerInput] = useState("");
  const [errors, setErrors] = useState({});

  // Step 2 state (Master Key)
  const [masterKey, setMasterKey] = useState("");
  const [confirmKey, setConfirmKey] = useState("");
  const [showMaster, setShowMaster] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });

  // Loading state for final creation
  const [creating, setCreating] = useState(false);

  // Auto‑add the logged‑in user and the ESP32 device UID as owners
  useEffect(() => {
    if (currentUser && owners.length === 0) {
      setOwners([currentUser.uid, ESP32_OWNER_UID]);
    }
  }, [currentUser]);

  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type, visible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  };

  // ---------- Validation ----------
  const validateStep1 = () => {
    const newErrors = {};
    if (!deviceName.trim()) {
      newErrors.deviceName = "Device name is required.";
    } else if (deviceName.trim().length > 30) {
      newErrors.deviceName = "Device name must be 30 characters or fewer.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!masterKey) {
      newErrors.masterKey = "Master key is required.";
    } else if (masterKey.length < 8) {
      newErrors.masterKey = "Must be at least 8 characters.";
    }
    if (masterKey !== confirmKey) {
      newErrors.confirmKey = "Keys do not match.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------- Owner management ----------
  const handleAddOwner = () => {
    const trimmed = newOwnerInput.trim();
    if (trimmed && !owners.includes(trimmed)) {
      setOwners([...owners, trimmed]);
    }
    setNewOwnerInput("");
  };

  const handleRemoveOwner = (uid) => {
    // Prevent removal of the current user or the ESP32 owner
    if (uid === currentUser?.uid || uid === ESP32_OWNER_UID) return;
    setOwners(owners.filter((o) => o !== uid));
  };

  // ---------- Navigation ----------
  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleClose = () => {
    setCurrentStep(1);
    setDeviceName("");
    setOwners(currentUser ? [currentUser.uid, ESP32_OWNER_UID] : []);
    setMasterKey("");
    setConfirmKey("");
    setErrors({});
    onClose();
  };

  // ---------- DEVICE CREATION ----------
  const handleCreateDevice = async () => {
    if (!currentUser || creating) return;
    setCreating(true);

    try {
      // 1. Store master key
      await setDoc(doc(db, "users", currentUser.uid), { masterKey }, { merge: true });

      // 2. Create device document (owners already includes ESP32)
      const deviceRef = doc(db, "devices", deviceName);
      await setDoc(deviceRef, { owners, name: deviceName });

      // 3. Default config
      const defaultConfig = {
        voltageMin: 200,
        voltageMax: 250,
        currentMax: 10,
        powerMax: 2000,
        powerFactorMin: 0.8,
        frequencyMin: 49.5,
        frequencyMax: 50.5,
        alertCooldownSec: 120,
        deviceName,
        timezone: "Asia/Manila",
        measurementIntervalSec: 2,
        uploadIntervalSec: 10,
      };
      await setDoc(doc(db, "devices", deviceName, "config", "settings"), defaultConfig);

      // 4. Default status
      const defaultStatus = {
        rssi: 0,
        uptime: 0,
        freeHeap: 0,
        firmwareVersion: "—",
        resetReason: "—",
        networkSpeed: 0,
        dataTransferred: 0,
        ssid: "—",
      };
      await setDoc(doc(db, "devices", deviceName, "status", "current"), defaultStatus);

      // 5. Zero reading
      const zeroReading = {
        voltage: 0, current: 0, activePower: 0, apparentPower: 0,
        reactivePower: 0, energy: 0, frequency: 0, powerFactor: 0,
        timestamp: Timestamp.fromDate(new Date()),
      };
      await setDoc(doc(db, "devices", deviceName, "readings", "initial"), zeroReading);

      // 6. Notification for the new device
      await setDoc(doc(db, "devices", deviceName, "notifications", "deviceCreated"), {
        type: "deviceCreated",
        priority: "info",
        message: `Device ${deviceName} has been created and is ready.`,
        status: "unread",
        value: 0,
        timestamp: Timestamp.fromDate(new Date()),
      });

      // 7. Broadcast to other devices
      const allDeviceDocs = await getDocs(collection(db, "devices"));
      const otherDeviceIds = [];
      allDeviceDocs.forEach((d) => {
        if (d.id !== deviceName) otherDeviceIds.push(d.id);
      });
      for (const devId of otherDeviceIds) {
        try {
          await setDoc(doc(db, "devices", devId, "notifications", `deviceCreated_${deviceName}`), {
            type: "deviceCreatedBroadcast",
            priority: "info",
            message: `Device ${deviceName} has been added to the system.`,
            status: "unread",
            value: 0,
            timestamp: Timestamp.fromDate(new Date()),
          });
        } catch (e) {}
        try {
          await logEvent(devId, "deviceCreatedBroadcast",
            `Device ${deviceName} was created by ${currentUser?.email || "unknown"}`,
            "info", currentUser?.email);
        } catch (e) {}
      }

      // 8. Log event
      await logEvent(deviceName, "deviceCreated",
        `Device ${deviceName} created by ${currentUser?.email || "unknown"}`,
        "info", currentUser?.email);

      // Success
      showToast("Dashboard created successfully.", "success");
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      showToast("Failed to create dashboard: " + err.message, "error");
      setCreating(false);
    }
  };

  // Strength display
  const strength = calculateStrength(masterKey);
  const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 z-10 max-h-[90vh] overflow-y-auto">
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <FontAwesomeIcon icon={faTimes} className="text-lg" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
          Create Dashboard
        </h2>

        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

        {/* STEP 1 */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Give your device a name and add owners who can access it.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Device Name</label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => { setDeviceName(e.target.value); if (errors.deviceName) setErrors({}); }}
                placeholder="e.g., Home Main Panel"
                className={`input-field ${errors.deviceName ? "border-red-500 focus:ring-red-500" : ""}`}
              />
              {errors.deviceName && <p className="text-red-500 text-xs mt-1">{errors.deviceName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Owners</label>
              <div className="space-y-2 mb-3">
                {owners.map((uid) => (
                  <div key={uid} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                    <span className="text-sm font-mono text-gray-800 dark:text-gray-200 truncate">
                      {uid === currentUser?.uid ? (
                        <span className="flex items-center gap-1">
                          {uid.substring(0, 12)}… <span className="text-xs text-green-600 dark:text-green-400">(you)</span>
                        </span>
                      ) : uid === ESP32_OWNER_UID ? (
                        <span className="flex items-center gap-1">
                          {uid.substring(0, 12)}… <span className="text-xs text-blue-600 dark:text-blue-400">(ESP32)</span>
                        </span>
                      ) : (
                        uid.substring(0, 12) + "…"
                      )}
                    </span>
                    {/* Only allow removal of additional owners (not self and not ESP32) */}
                    {uid !== currentUser?.uid && uid !== ESP32_OWNER_UID && (
                      <button onClick={() => handleRemoveOwner(uid)} className="text-red-500 hover:text-red-700 p-1">
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOwnerInput}
                  onChange={(e) => setNewOwnerInput(e.target.value)}
                  placeholder="Enter Firebase UID"
                  className="input-field flex-1 text-sm"
                />
                <button
                  onClick={handleAddOwner}
                  disabled={!newOwnerInput.trim()}
                  className="px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faUserPlus} className="mr-1" /> Add
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Your Account ID and the ESP32 device are automatically included. Additional owners are optional.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="text-5xl mb-3">🔑</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                The Master Key protects sensitive actions such as creating, deleting, or permanently modifying your device.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Master Key</label>
              <div className="relative">
                <input
                  type={showMaster ? "text" : "password"}
                  value={masterKey}
                  onChange={(e) => { setMasterKey(e.target.value); if (errors.masterKey) setErrors({}); }}
                  placeholder="Enter a strong master key"
                  className={`input-field pr-10 ${errors.masterKey ? "border-red-500 focus:ring-red-500" : ""}`}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowMaster(!showMaster)}>
                  <FontAwesomeIcon icon={showMaster ? faEyeSlash : faEye} className="h-5 w-5" />
                </button>
              </div>
              {errors.masterKey && <p className="text-red-500 text-xs mt-1">{errors.masterKey}</p>}
              {masterKey.length > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${strengthColors[strength] || "bg-gray-400"} transition-all duration-300`}
                      style={{ width: `${((strength + 1) / 5) * 100}%` }} />
                  </div>
                  <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">{strengthLabels[strength] || "Weak"}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Master Key</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmKey}
                  onChange={(e) => { setConfirmKey(e.target.value); if (errors.confirmKey) setErrors({}); }}
                  placeholder="Re‑enter your master key"
                  className={`input-field pr-10 ${errors.confirmKey ? "border-red-500 focus:ring-red-500" : ""}`}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowConfirm(!showConfirm)}>
                  <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} className="h-5 w-5" />
                </button>
              </div>
              {errors.confirmKey && <p className="text-red-500 text-xs mt-1">{errors.confirmKey}</p>}
            </div>
          </div>
        )}

        {/* STEP 3 (Quick Guide) */}
        {currentStep === 3 && (
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div className="text-center mb-2">
              <div className="text-5xl mb-3">📘</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Guide</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Here’s what you can do with your new energy dashboard.
              </p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3"><FontAwesomeIcon icon={faChartLine} className="text-blue-500 mt-0.5 text-lg" /><div><p className="font-semibold text-gray-900 dark:text-white">Live Monitoring</p><p className="text-xs text-gray-500 dark:text-gray-400">View real‑time voltage, current, power, energy consumption, and cost.</p></div></li>
              <li className="flex items-start gap-3"><FontAwesomeIcon icon={faBell} className="text-yellow-500 mt-0.5 text-lg" /><div><p className="font-semibold text-gray-900 dark:text-white">Notifications &amp; Alerts</p><p className="text-xs text-gray-500 dark:text-gray-400">Get warned when limits are exceeded or device goes offline.</p></div></li>
              <li className="flex items-start gap-3"><FontAwesomeIcon icon={faClipboardList} className="text-purple-500 mt-0.5 text-lg" /><div><p className="font-semibold text-gray-900 dark:text-white">Event Logs</p><p className="text-xs text-gray-500 dark:text-gray-400">Every login, config change, and system event is recorded.</p></div></li>
              <li className="flex items-start gap-3"><FontAwesomeIcon icon={faShieldAlt} className="text-green-500 mt-0.5 text-lg" /><div><p className="font-semibold text-gray-900 dark:text-white">Security</p><p className="text-xs text-gray-500 dark:text-gray-400">Protected by a Master Key. Only owners can access the device.</p></div></li>
              <li className="flex items-start gap-3"><FontAwesomeIcon icon={faMobileAlt} className="text-indigo-500 mt-0.5 text-lg" /><div><p className="font-semibold text-gray-900 dark:text-white">Device Management</p><p className="text-xs text-gray-500 dark:text-gray-400">Add/remove owners, restart, or update firmware remotely.</p></div></li>
              <li className="flex items-start gap-3"><FontAwesomeIcon icon={faKey} className="text-rose-500 mt-0.5 text-lg" /><div><p className="font-semibold text-gray-900 dark:text-white">Master Key Usage</p><p className="text-xs text-gray-500 dark:text-gray-400">Keep your Master Key safe. You'll need it for creating/deleting devices.</p></div></li>
            </ul>
          </div>
        )}

        {/* STEP 4 (Confirmation) */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="text-center mb-2">
              <div className="text-5xl mb-3">✅</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Ready to Create</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Review your settings and create your dashboard.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Device Name</span>
                <span className="font-semibold text-gray-900 dark:text-white">{deviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Owners</span>
                <span className="font-semibold text-gray-900 dark:text-white">{owners.length} owner(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Master Key</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-1" /> Set
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span className="font-semibold text-green-600 dark:text-green-400">Ready</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={currentStep === 1 ? handleClose : handleBack}
            className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            {currentStep === 1 ? "Cancel" : "Back"}
          </button>

          {currentStep < totalSteps && (
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !deviceName.trim()) ||
                (currentStep === 2 && (!masterKey || !confirmKey))
              }
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-1"
            >
              Next
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          )}

          {currentStep === totalSteps && (
            <button
              onClick={handleCreateDevice}
              disabled={creating}
              className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-1"
            >
              {creating ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Creating...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCheck} />
                  Create Dashboard
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}