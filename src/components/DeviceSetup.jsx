import React, { useState, useEffect } from "react";
import { useUserDevices } from "../hooks/useUserDevices";
import { useAuth } from "../lib/AuthContext";
import { db } from "../lib/firebase";
import { doc, setDoc, deleteDoc, Timestamp } from "firebase/firestore";
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
} from "@fortawesome/free-solid-svg-icons";

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

  // Restart modal state
  const [restartModalDevice, setRestartModalDevice] = useState(null);
  const [restartingDevice, setRestartingDevice] = useState(null);

  // WiFi modal state
  const [wifiModalDevice, setWifiModalDevice] = useState(null);
  const [wifiForm, setWifiForm] = useState({ ssid: "", password: "" });
  const [sendingWifi, setSendingWifi] = useState(false);

  useEffect(() => {
    if (devices) setLocalDevices(devices);
  }, [devices]);

  const openAdd = () => {
    setForm({ deviceId: "", owners: [] });
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

  // Owner management (local, not saved until Save)
  const handleRemoveOwner = (uidToRemove) => {
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

  // Confirmation modal helpers
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

  // Add / Edit device handler
  const handleAddOrEdit = async () => {
    if (!form.deviceId || form.owners.length === 0) {
      alert("Device ID and at least one owner are required.");
      return;
    }

    const action = editingDevice ? "edit" : "add";
    const message = editingDevice
      ? `Update device "${form.deviceId}"?`
      : `Add new device "${form.deviceId}"?`;

    confirmAction(action, message, async () => {
      const deviceRef = doc(db, "devices", form.deviceId);
      const newData = { owners: form.owners, name: form.deviceId };
      if (!editingDevice) {
        newData.createdAt = new Date().toISOString();
      }
      await setDoc(deviceRef, newData, { merge: true });
      await logEvent(
        form.deviceId,
        editingDevice ? "deviceUpdated" : "deviceCreated",
        `${editingDevice ? "Updated" : "Created"} device ${form.deviceId} by ${currentUser?.email || "unknown"}`,
        "info",
        currentUser?.email
      );
      if (editingDevice) {
        setLocalDevices((prev) =>
          prev.map((d) => (d.id === form.deviceId ? { ...d, owners: form.owners } : d))
        );
      } else {
        setLocalDevices((prev) => [...prev, { id: form.deviceId, owners: form.owners }]);
      }
      closeForm();
      alert("Device saved successfully.");
    });
  };

  // Delete device handler
  const handleDelete = (deviceId) => {
    confirmAction("delete", `Permanently delete device "${deviceId}"? This cannot be undone.`, async () => {
      await deleteDoc(doc(db, "devices", deviceId));
      await logEvent(
        deviceId,
        "deviceDeleted",
        `Device ${deviceId} deleted by ${currentUser?.email || "unknown"}`,
        "warning",
        currentUser?.email
      );
      setLocalDevices((prev) => prev.filter((d) => d.id !== deviceId));
      alert("Device deleted.");
    });
  };

  // Restart device
  const handleRestart = (deviceId) => {
    setRestartModalDevice(deviceId);
  };

  const confirmRestart = async () => {
    if (!restartModalDevice) return;
    const deviceId = restartModalDevice;
    setRestartingDevice(deviceId);
    setRestartModalDevice(null);
    try {
      const cmdRef = doc(db, "devices", deviceId, "commands", "restart");
      await setDoc(cmdRef, {
        command: "restart",
        status: "pending",
        createdAt: Timestamp.fromDate(new Date()),
      });
      alert(`Restart command sent to ${deviceId}.`);
    } catch (err) {
      alert("Failed to send command: " + err.message);
    } finally {
      setRestartingDevice(null);
    }
  };

  // ---------- WiFi configuration ----------
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
      alert("WiFi configuration command sent. The device will apply the new settings soon.");
      setWifiModalDevice(null);
    } catch (err) {
      alert("Failed to send command: " + err.message);
    } finally {
      setSendingWifi(false);
    }
  };

  // ---------- Loading & empty states ----------
  if (devicesLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (!localDevices.length && !showAddForm) {
    return (
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
    );
  }

  return (
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
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white">
                  <FontAwesomeIcon icon={faMobileAlt} />
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
                    {uid.substring(0, 8)}…
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

      {/* Add/Edit Form Modal (unchanged) */}
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

              {/* Owners management */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Owners</label>
                <div className="space-y-2 mb-3">
                  {form.owners.map((uid) => (
                    <div
                      key={uid}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2"
                    >
                      <span className="text-sm font-mono text-gray-800 dark:text-gray-200 truncate flex-1 mr-2">
                        {uid}
                      </span>
                      <button
                        onClick={() => handleRemoveOwner(uid)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  ))}
                  {form.owners.length === 0 && (
                    <p className="text-sm text-gray-400 italic">No owners added yet.</p>
                  )}
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

      {/* Generic Confirmation Modal (for add/edit/delete) */}
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
                className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition ${
                  modal.action === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                }`}
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
                disabled={restartingDevice === restartModalDevice}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition disabled:opacity-50"
              >
                {restartingDevice === restartModalDevice ? "Sending..." : "Restart"}
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
    </div>
  );
}

/* -------- Empty State Component -------- */
function Empty({ icon, title, desc }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <FontAwesomeIcon icon={icon} className="text-5xl mb-4 text-gray-400" />
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 mt-1">{desc}</p>
    </div>
  );
}