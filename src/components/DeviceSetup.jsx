import React, { useState, useEffect, useCallback } from "react";
import { useUserDevices } from "../hooks/useUserDevices";
import { useAuth } from "../lib/AuthContext";
import { db } from "../lib/firebase";
import {
  doc,
  setDoc,
  deleteDoc,
  Timestamp,
  collection,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { logEvent } from "../lib/logEvent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrashAlt,
  faSave,
  faMobileAlt,
  faTimes,
  faUserPlus,
  faRedo,
  faWifi,
  faKey,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";

/* -------- Toast Component -------- */
function Toast({ message, type = "success", visible, onClose }) {
  if (!visible) return null;
  const bg =
    type === "success"
      ? "bg-green-500/30 border-green-400/40 text-green-900 dark:text-green-100"
      : "bg-red-500/30 border-red-400/40 text-red-900 dark:text-red-100";
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
      <div
        className={`pointer-events-auto backdrop-blur-md border ${bg} px-5 py-2 rounded-2xl shadow-xl animate-toastPop text-sm font-medium max-w-sm`}
      >
        {message}
      </div>
    </div>
  );
}

/* -------- ESP32 Owner UID (always added) -------- */
const ESP32_OWNER_UID = "DhYWe9i4ojajr0kh3eyS70o0TNs2";

/* -------- Pulsing dot animation (injected style) -------- */
const pulseStyle = `
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.8); }
  }
  .pulse-dot {
    animation: pulse-dot 2s infinite ease-in-out;
  }
`;

export default function DeviceSetup() {
  const { devices, loading: devicesLoading } = useUserDevices();
  const { currentUser } = useAuth();

  const [localDevices, setLocalDevices] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [form, setForm] = useState({ deviceId: "", owners: [] });
  const [newOwnerInput, setNewOwnerInput] = useState("");
  const [isAddingOwner, setIsAddingOwner] = useState(false);
  const [modal, setModal] = useState({ open: false, action: "", message: "", onConfirm: null });

  const [restartModalDevice, setRestartModalDevice] = useState(null);
  const [restartingDevice, setRestartingDevice] = useState(false);

  const [wifiModalDevice, setWifiModalDevice] = useState(null);
  const [wifiForm, setWifiForm] = useState({ ssid: "", password: "" });
  const [sendingWifi, setSendingWifi] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });

  const [deletingDeviceId, setDeletingDeviceId] = useState(null);

  // Master Key prompt state
  const [masterKeyModal, setMasterKeyModal] = useState({ open: false, deviceId: null });
  const [masterKeyInput, setMasterKeyInput] = useState("");
  const [showMasterKey, setShowMasterKey] = useState(false);
  const [masterKeyError, setMasterKeyError] = useState("");
  const [verifyingKey, setVerifyingKey] = useState(false);

  // Online status map: deviceId -> boolean
  const [onlineStatus, setOnlineStatus] = useState({});

  useEffect(() => {
    if (devices) setLocalDevices(devices);
  }, [devices]);

  // Fetch online status for all devices periodically
  useEffect(() => {
    const fetchStatus = async () => {
      const statusMap = {};
      for (const device of localDevices) {
        try {
          const statusRef = doc(db, "devices", device.id, "status", "current");
          const snap = await getDoc(statusRef);
          if (snap.exists()) {
            const data = snap.data();
            // If lastSeen is within the last 2 minutes, consider online
            const lastSeen = data.lastSeen?.seconds
              ? new Date(data.lastSeen.seconds * 1000)
              : null;
            const now = new Date();
            const twoMinAgo = new Date(now.getTime() - 2 * 60 * 1000);
            statusMap[device.id] = lastSeen && lastSeen > twoMinAgo;
          } else {
            statusMap[device.id] = false;
          }
        } catch {
          statusMap[device.id] = false;
        }
      }
      setOnlineStatus(statusMap);
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // refresh every 10 seconds
    return () => clearInterval(interval);
  }, [localDevices]);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ message: msg, type, visible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  }, []);

  // ---------- Add / Edit form handlers ----------
  const openAdd = () => {
    const defaultOwners = currentUser ? [currentUser.uid, ESP32_OWNER_UID] : [];
    setForm({ deviceId: "", owners: defaultOwners });
    setNewOwnerInput("");
    setIsAddingOwner(false);
    setEditingDevice(null);
    setShowAddForm(true);
  };

  const openEdit = (device) => {
    setForm({
      deviceId: device.id,
      owners: device.owners || [],
    });
    setNewOwnerInput("");
    setIsAddingOwner(false);
    setEditingDevice(device);
    setShowAddForm(true);
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditingDevice(null);
  };

  const handleRemoveOwner = (uidToRemove) => {
    if (uidToRemove === currentUser?.uid || uidToRemove === ESP32_OWNER_UID) return;
    setForm((prev) => ({
      ...prev,
      owners: prev.owners.filter((uid) => uid !== uidToRemove),
    }));
  };

  const handleAddOwnerClick = () => {
    setIsAddingOwner(true);
    setNewOwnerInput("");
  };

  const handleConfirmAddOwner = () => {
    const trimmed = newOwnerInput.trim();
    if (trimmed && !form.owners.includes(trimmed)) {
      setForm((prev) => ({ ...prev, owners: [...prev.owners, trimmed] }));
    }
    setNewOwnerInput("");
    setIsAddingOwner(false);
  };

  const handleDiscardAddOwner = () => {
    setNewOwnerInput("");
    setIsAddingOwner(false);
  };

  const confirmAction = (action, message, onConfirm) => {
    setModal({ open: true, action, message, onConfirm });
  };

  const closeModal = () => setModal({ open: false, action: "", message: "", onConfirm: null });

  const executeConfirm = async () => {
    if (modal.onConfirm) {
      await modal.onConfirm();
    }
    closeModal();
  };

  // ---------- ADD / EDIT DEVICE ----------
  const handleAddOrEdit = async () => {
    if (!form.deviceId || form.owners.length === 0) {
      showToast("Device ID and at least one owner are required.", "error");
      return;
    }

    const action = editingDevice ? "edit" : "add";
    const message = editingDevice
      ? `Update device "${form.deviceId}"?`
      : `Add new device "${form.deviceId}"?`;

    confirmAction(action, message, async () => {
      try {
        const deviceRef = doc(db, "devices", form.deviceId);
        const newData = { owners: form.owners, name: form.deviceId };
        await setDoc(deviceRef, newData, { merge: true });

        if (!editingDevice) {
          const defaultConfig = {
            voltageMin: 200,
            voltageMax: 250,
            currentMax: 10,
            powerMax: 2000,
            powerFactorMin: 0.8,
            frequencyMin: 49.5,
            frequencyMax: 50.5,
            alertCooldownSec: 120,
            deviceName: form.deviceId,
            timezone: "Asia/Manila",
            measurementIntervalSec: 2,
            uploadIntervalSec: 10,
          };
          await setDoc(doc(db, "devices", form.deviceId, "config", "settings"), defaultConfig).catch(() => {});

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
          await setDoc(doc(db, "devices", form.deviceId, "status", "current"), defaultStatus).catch(() => {});

          const zeroReading = {
            voltage: 0, current: 0, activePower: 0, apparentPower: 0,
            reactivePower: 0, energy: 0, frequency: 0, powerFactor: 0,
            timestamp: Timestamp.fromDate(new Date()),
          };
          await setDoc(doc(db, "devices", form.deviceId, "readings", "initial"), zeroReading).catch(() => {});

          await setDoc(doc(db, "devices", form.deviceId, "notifications", "deviceCreated"), {
            type: "deviceCreated",
            priority: "info",
            message: `Device ${form.deviceId} has been created and is ready.`,
            status: "unread",
            value: 0,
            timestamp: Timestamp.fromDate(new Date()),
          }).catch(() => {});
        }

        // Broadcast to other devices
        const otherDeviceIds = localDevices.map((d) => d.id).filter((id) => id !== form.deviceId);
        for (const devId of otherDeviceIds) {
          try {
            await setDoc(doc(db, "devices", devId, "notifications", `deviceCreated_${form.deviceId}`), {
              type: "deviceCreatedBroadcast",
              priority: "info",
              message: `Device ${form.deviceId} has been added to the system.`,
              status: "unread",
              value: 0,
              timestamp: Timestamp.fromDate(new Date()),
            });
          } catch (e) {}
          try {
            await logEvent(devId, "deviceCreatedBroadcast",
              `Device ${form.deviceId} was created by ${currentUser?.email || "unknown"}`,
              "info", currentUser?.email);
          } catch (e) {}
        }

        await logEvent(form.deviceId, editingDevice ? "deviceUpdated" : "deviceCreated",
          `${editingDevice ? "Updated" : "Created"} device ${form.deviceId} by ${currentUser?.email || "unknown"}`,
          "info", currentUser?.email);

        if (editingDevice) {
          setLocalDevices((prev) =>
            prev.map((d) => (d.id === form.deviceId ? { ...d, owners: form.owners } : d))
          );
        } else {
          setLocalDevices((prev) => [...prev, { id: form.deviceId, owners: form.owners }]);
        }

        closeForm();
        showToast("Device saved successfully.", "success");
      } catch (err) {
        showToast("Failed to save device: " + err.message, "error");
      }
    });
  };

  // ---------- DELETE DEVICE – requires master key ----------
  const handleDelete = (deviceId) => {
    if (deletingDeviceId) return;
    setMasterKeyModal({ open: true, deviceId });
    setMasterKeyInput("");
    setMasterKeyError("");
  };

  const verifyMasterKeyAndDelete = async () => {
    const deviceId = masterKeyModal.deviceId;
    if (!deviceId || !currentUser) return;

    setVerifyingKey(true);
    setMasterKeyError("");

    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (!userDoc.exists()) {
        setMasterKeyError("Master key not set. Please set a master key first.");
        setVerifyingKey(false);
        return;
      }

      const storedKey = userDoc.data().masterKey;
      if (!storedKey) {
        setMasterKeyError("Master key not set. Please set a master key first.");
        setVerifyingKey(false);
        return;
      }

      if (masterKeyInput !== storedKey) {
        setMasterKeyError("Incorrect master key. Please try again.");
        setVerifyingKey(false);
        return;
      }

      setMasterKeyModal({ open: false, deviceId: null });
      setMasterKeyInput("");

      confirmAction("delete", `Permanently delete device "${deviceId}"? This cannot be undone.`, async () => {
        setDeletingDeviceId(deviceId);
        try {
          const otherDeviceIds = localDevices.map((d) => d.id).filter((id) => id !== deviceId);
          for (const devId of otherDeviceIds) {
            try {
              await setDoc(doc(db, "devices", devId, "notifications", `deviceDeleted_${deviceId}`), {
                type: "deviceDeletedBroadcast",
                priority: "warning",
                message: `Device ${deviceId} has been deleted from the system.`,
                status: "unread",
                value: 0,
                timestamp: Timestamp.fromDate(new Date()),
              });
            } catch (e) {}
            try {
              await logEvent(devId, "deviceDeletedBroadcast",
                `Device ${deviceId} was deleted by ${currentUser?.email || "unknown"}`,
                "warning", currentUser?.email);
            } catch (e) {}
          }

          await logEvent(deviceId, "deviceDeleted",
            `Device ${deviceId} deleted by ${currentUser?.email || "unknown"}`,
            "warning", currentUser?.email);

          const subCollections = ["readings", "config", "status", "eventLogs", "notifications", "commands"];
          for (const sub of subCollections) {
            const colRef = collection(db, "devices", deviceId, sub);
            const snapshot = await getDocs(colRef);
            const deletePromises = snapshot.docs.map((d) =>
              deleteDoc(doc(db, "devices", deviceId, sub, d.id))
            );
            await Promise.all(deletePromises);
          }

          await deleteDoc(doc(db, "devices", deviceId));
          setLocalDevices((prev) => prev.filter((d) => d.id !== deviceId));
          showToast(`Device ${deviceId} deleted.`, "success");
        } catch (err) {
          showToast("Failed to delete device: " + err.message, "error");
        } finally {
          setDeletingDeviceId(null);
        }
      });
    } catch (err) {
      setMasterKeyError("Failed to verify master key: " + err.message);
    } finally {
      setVerifyingKey(false);
    }
  };

  // ---------- RESTART DEVICE ----------
  const handleRestart = (deviceId) => {
    setRestartModalDevice(deviceId);
  };

  const confirmRestart = async () => {
    if (!restartModalDevice) return;
    const deviceId = restartModalDevice;
    setRestartingDevice(true);
    setRestartModalDevice(null);
    try {
      const cmdRef = doc(db, "devices", deviceId, "commands", "restart");
      await setDoc(cmdRef, {
        command: "restart",
        status: "pending",
        createdAt: Timestamp.fromDate(new Date()),
      });
      showToast(`Restart command sent to ${deviceId}.`, "success");
    } catch (err) {
      showToast("Failed to send command: " + err.message, "error");
    } finally {
      setRestartingDevice(false);
    }
  };

  // ---------- WIFI CONFIGURATION ----------
  const handleConfigureWifi = (deviceId) => {
    setWifiModalDevice(deviceId);
    setWifiForm({ ssid: "", password: "" });
  };

  const sendWifiCommand = async () => {
    if (!wifiModalDevice || !wifiForm.ssid) return;
    setSendingWifi(true);
    try {
      const cmdRef = doc(db, "devices", wifiModalDevice, "commands", "wifiConfig");
      await setDoc(cmdRef, {
        command: "wifiConfig",
        ssid: wifiForm.ssid,
        password: wifiForm.password,
        status: "pending",
        createdAt: Timestamp.fromDate(new Date()),
      });
      showToast("WiFi configuration command sent.", "success");
      setWifiModalDevice(null);
    } catch (err) {
      showToast("Failed to send command: " + err.message, "error");
    } finally {
      setSendingWifi(false);
    }
  };

  // ---------- RENDER ----------
  if (devicesLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <>
      {/* Pulsing animation style */}
      <style>{pulseStyle}</style>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />

      {!localDevices.length && !showAddForm ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Device Management</h2>
            <button onClick={openAdd} className="btn-primary">
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add Device
            </button>
          </div>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <FontAwesomeIcon icon={faMobileAlt} className="text-5xl text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No devices registered</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
              You haven't added any ESP32 energy monitors yet. Click the button above to register your first device.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Device Management</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{localDevices.length} device(s) registered</p>
            </div>
            <button onClick={openAdd} className="btn-primary">
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add Device
            </button>
          </div>

          {/* Device Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {localDevices.map((device) => (
              <div
                key={device.id}
                className="glass-card p-6 flex flex-col transition-all hover:shadow-xl hover:-translate-y-1 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white relative">
                      <FontAwesomeIcon icon={faMobileAlt} />
                      {/* Online/Offline dot */}
                      <span
                        className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 backdrop-blur-sm ${
                          onlineStatus[device.id]
                            ? "bg-green-400 pulse-dot"
                            : "bg-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{device.id}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {device.owners?.length || 0} owner(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleConfigureWifi(device.id)}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900"
                      title="Configure WiFi"
                    >
                      <FontAwesomeIcon icon={faWifi} />
                    </button>
                    <button
                      onClick={() => handleRestart(device.id)}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900"
                      title="Restart device"
                    >
                      <FontAwesomeIcon icon={faRedo} />
                    </button>
                    <button
                      onClick={() => openEdit(device)}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      onClick={() => handleDelete(device.id)}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                    >
                      <FontAwesomeIcon icon={faTrashAlt} />
                    </button>
                  </div>
                </div>
                <div className="mt-auto">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Owners:</p>
                  <div className="flex flex-wrap gap-1">
                    {device.owners?.slice(0, 3).map((uid) => (
                      <span
                        key={uid}
                        className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 truncate max-w-[120px]"
                        title={uid}
                      >
                        {uid === currentUser?.uid
                          ? `${uid.substring(0, 8)}… (you)`
                          : uid === ESP32_OWNER_UID
                          ? `${uid.substring(0, 8)}… (ESP32)`
                          : `${uid.substring(0, 8)}…`}
                      </span>
                    ))}
                    {device.owners?.length > 3 && (
                      <span className="text-xs text-gray-400">+{device.owners.length - 3} more</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add/Edit Form Modal */}
          {showAddForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeForm} />
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 z-10 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingDevice ? "Edit Device" : "Add New Device"}
                </h3>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Device ID</label>
                    <input
                      type="text"
                      value={form.deviceId}
                      onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
                      className="input-field"
                      disabled={!!editingDevice}
                      placeholder="e.g., device_001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Owners</label>
                    <div className="space-y-2 mb-3">
                      {form.owners.map((uid) => (
                        <div
                          key={uid}
                          className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2"
                        >
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
                          {uid !== currentUser?.uid && uid !== ESP32_OWNER_UID && (
                            <button
                              onClick={() => handleRemoveOwner(uid)}
                              className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1"
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {!isAddingOwner ? (
                      <button
                        onClick={handleAddOwnerClick}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                      >
                        <FontAwesomeIcon icon={faUserPlus} />
                        Add Owner
                      </button>
                    ) : (
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={newOwnerInput}
                            onChange={(e) => setNewOwnerInput(e.target.value)}
                            placeholder="Enter Firebase UID"
                            className="input-field text-sm"
                            autoFocus
                          />
                        </div>
                        <button
                          onClick={handleConfirmAddOwner}
                          className="px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Add
                        </button>
                        <button
                          onClick={handleDiscardAddOwner}
                          className="px-3 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          Discard
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Your Account ID and the ESP32 device are automatically included. Additional owners are optional.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={closeForm} className="btn-secondary">Cancel</button>
                  <button onClick={handleAddOrEdit} className="btn-primary">
                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                    Save Device
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Generic Confirmation Modal */}
          {modal.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 z-10">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                  {modal.action} Device
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{modal.message}</p>
                <p className="mt-2 text-xs text-red-500 dark:text-red-400 font-medium">
                  This action cannot be undone.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={closeModal} className="btn-secondary">Cancel</button>
                  <button
                    onClick={executeConfirm}
                    disabled={deletingDeviceId !== null}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition ${
                      modal.action === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                    } disabled:opacity-50`}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Restart Confirmation Modal */}
          {restartModalDevice && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRestartModalDevice(null)} />
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 z-10">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Restart {restartModalDevice}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Are you sure you want to restart this device? It will disconnect briefly and then reconnect.
                </p>
                <p className="mt-2 text-xs text-red-500 dark:text-red-400 font-medium">
                  This action cannot be undone during the restart.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setRestartModalDevice(null)} className="btn-secondary">
                    Cancel
                  </button>
                  <button
                    onClick={confirmRestart}
                    disabled={restartingDevice}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition disabled:opacity-50"
                  >
                    {restartingDevice ? "Sending..." : "Restart"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* WiFi Configuration Modal */}
          {wifiModalDevice && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setWifiModalDevice(null)} />
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 z-10">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Configure WiFi – {wifiModalDevice}
                </h3>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SSID</label>
                    <input
                      type="text"
                      value={wifiForm.ssid}
                      onChange={(e) => setWifiForm({ ...wifiForm, ssid: e.target.value })}
                      className="input-field"
                      placeholder="Enter WiFi name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <input
                      type="password"
                      value={wifiForm.password}
                      onChange={(e) => setWifiForm({ ...wifiForm, password: e.target.value })}
                      className="input-field"
                      placeholder="Enter WiFi password"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setWifiModalDevice(null)} className="btn-secondary">
                    Cancel
                  </button>
                  <button
                    onClick={sendWifiCommand}
                    disabled={sendingWifi}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition disabled:opacity-50"
                  >
                    {sendingWifi ? "Sending..." : "Send to Device"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Master Key Verification Modal */}
          {masterKeyModal.open && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setMasterKeyModal({ open: false, deviceId: null })}
              />
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 z-10">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faKey} className="text-yellow-500" />
                  Master Key Required
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Enter your master key to delete <strong>{masterKeyModal.deviceId}</strong>.
                </p>
                <div className="relative mt-4">
                  <input
                    type={showMasterKey ? "text" : "password"}
                    value={masterKeyInput}
                    onChange={(e) => {
                      setMasterKeyInput(e.target.value);
                      if (masterKeyError) setMasterKeyError("");
                    }}
                    placeholder="Enter master key"
                    className={`input-field pr-10 ${masterKeyError ? "border-red-500 focus:ring-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    onClick={() => setShowMasterKey(!showMasterKey)}
                  >
                    <FontAwesomeIcon icon={showMasterKey ? faEyeSlash : faEye} className="h-5 w-5" />
                  </button>
                </div>
                {masterKeyError && (
                  <p className="text-red-500 text-xs mt-1">{masterKeyError}</p>
                )}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setMasterKeyModal({ open: false, deviceId: null })}
                    className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={verifyMasterKeyAndDelete}
                    disabled={verifyingKey || !masterKeyInput}
                    className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-1"
                  >
                    {verifyingKey ? "Verifying..." : "Delete Device"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}