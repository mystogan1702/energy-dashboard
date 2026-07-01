import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faKey,
  faSignOutAlt,
  faCopy,
  faCheck,
  faTrashAlt,
} from "@fortawesome/free-solid-svg-icons";

export default function UserMenu({ onLogout }) {
  const { currentUser, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Prevent background scrolling when any modal is open
  useEffect(() => {
    if (showLogoutConfirm || showDeleteConfirm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showLogoutConfirm, showDeleteConfirm]);

  const copyUID = async () => {
    if (!currentUser?.uid) return;
    try {
      await navigator.clipboard.writeText(currentUser.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = currentUser.uid;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const initials = currentUser?.email
    ? currentUser.email.charAt(0).toUpperCase()
    : "?";

  // ---------- Logout ----------
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    setOpen(false);
    onLogout();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // ---------- Delete Account ----------
  const handleDeleteAccountClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    setDeleting(true);
    setShowDeleteConfirm(false);
    setOpen(false);

    try {
      const uid = currentUser.uid;

      // 1. Remove this user from all device owner lists
      const devicesRef = collection(db, "devices");
      const q = query(devicesRef, where("owners", "array-contains", uid));
      const snapshot = await getDocs(q);

      const updates = snapshot.docs.map(async (docSnap) => {
        const deviceData = docSnap.data();
        const newOwners = (deviceData.owners || []).filter((o) => o !== uid);

        if (newOwners.length === 0) {
          // No more owners → delete the device
          await deleteDoc(doc(db, "devices", docSnap.id));
        } else {
          // Remove only this user from owners
          await updateDoc(doc(db, "devices", docSnap.id), { owners: newOwners });
        }
      });
      await Promise.all(updates);

      // 2. Delete the Firebase Auth account
      await deleteAccount();

      // 3. Logout
      onLogout();
    } catch (err) {
      alert("Failed to delete account: " + err.message);
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* Avatar button */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow">
            {initials}
          </div>
          <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentUser?.email?.split("@")[0]}
          </span>
          <svg
            className={`hidden sm:block w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-72 origin-top-right animate-dropdown">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-5 space-y-4">
              {/* User info */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {currentUser?.email || "Unknown"}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono select-all">
                      UID: {currentUser?.uid?.slice(0, 12)}…
                    </span>
                    <button onClick={copyUID} className="text-gray-400 hover:text-blue-500 transition" title="Copy UID">
                      <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-xs" />
                    </button>
                  </div>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              <div className="space-y-1">
                <button
                  onClick={() => {
                    navigate("/change-password");
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <FontAwesomeIcon icon={faKey} className="text-gray-400" />
                  Change Password
                </button>
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} />
                  Logout
                </button>
                <hr className="border-gray-200 dark:border-gray-700" />
                <button
                  onClick={handleDeleteAccountClick}
                  disabled={deleting}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  <FontAwesomeIcon icon={faTrashAlt} />
                  {deleting ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Logout confirmation modal */}
      {showLogoutConfirm &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
               style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl max-w-sm w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Logout</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Are you sure you want to log out?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={cancelLogout} className="btn-secondary">Cancel</button>
                <button onClick={confirmLogout} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition">
                  Logout
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Account confirmation modal */}
      {showDeleteConfirm &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
               style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl max-w-sm w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Account</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                This will permanently delete your account and remove you from all devices. This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={cancelDelete} className="btn-secondary">Cancel</button>
                <button onClick={confirmDeleteAccount} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition">
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}