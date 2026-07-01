import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { useAuth } from "../lib/AuthContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faKey,
  faSignOutAlt,
  faCopy,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

export default function UserMenu({ onLogout }) {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (showLogoutConfirm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showLogoutConfirm]);

  const handleChangePassword = async () => {
    if (!currentUser?.email) return;
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 4000);
    } catch (err) {
      alert("Failed to send reset email: " + err.message);
    }
  };

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

  // ---- The dropdown remains exactly as before ----
  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* Avatar button ... (unchanged) */}
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
              {/* ... user info, change password, logout ... */}
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
                <button onClick={handleChangePassword} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                  <FontAwesomeIcon icon={faKey} className="text-gray-400" />
                  Change Password
                  {resetSent && <span className="ml-auto text-xs text-green-600">Email sent!</span>}
                </button>
                <button onClick={handleLogoutClick} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                  <FontAwesomeIcon icon={faSignOutAlt} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---- Logout confirmation modal rendered directly into body ---- */}
      {showLogoutConfirm &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          >
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl max-w-sm w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Logout</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Are you sure you want to log out?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={cancelLogout} className="btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}