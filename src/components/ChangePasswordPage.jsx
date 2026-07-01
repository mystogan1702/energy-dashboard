import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faKey } from "@fortawesome/free-solid-svg-icons";

function calculateStrength(password) {
  let score = 0;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 18) score++;
  return score;
}

export default function ChangePasswordPage() {
  const {
    currentUser,
    reauthenticateUser,
    changePassword,
    setPasswordForGoogleUser,
  } = useAuth();
  const navigate = useNavigate();

  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const strength = calculateStrength(newPassword);
  const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];

  useEffect(() => {
    if (currentUser) {
      const providers = currentUser.providerData.map((p) => p.providerId);
      setHasPassword(providers.includes("password"));
      setLoading(false);
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 18) {
      setError("Password must be at least 18 characters long.");
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setError("Password must contain at least one lowercase letter.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setError("Password must contain at least one number.");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      setError("Password must contain at least one special character (e.g., !@#$%).");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      if (hasPassword) {
        await reauthenticateUser(currentPassword);
        await changePassword(newPassword);
      } else {
        await setPasswordForGoogleUser(currentUser.email, newPassword);
      }
      setSuccess("Password updated successfully!");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3">
            <FontAwesomeIcon icon={faKey} className="text-2xl text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {hasPassword ? "Change Password" : "Set Password"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {hasPassword
              ? "Enter your current password and a new one"
              : "Create a strong password for your account"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl text-sm mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {hasPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showCurrent ? "text" : "password"}
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  <FontAwesomeIcon icon={showCurrent ? faEyeSlash : faEye} className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              New Password
            </label>
            <div className="relative mt-1">
              <input
                type={showNew ? "text" : "password"}
                required
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="At least 18 characters…"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                onClick={() => setShowNew(!showNew)}
              >
                <FontAwesomeIcon icon={showNew ? faEyeSlash : faEye} className="h-5 w-5" />
              </button>
            </div>

            {newPassword.length > 0 && (
              <div className="mt-2">
                <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strengthColors[strength] || "bg-gray-400"} transition-all duration-300`}
                    style={{ width: `${((strength + 1) / 5) * 100}%` }}
                  />
                </div>
                <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                  {strengthLabels[strength] || "Weak"} —{" "}
                  {strength < 4
                    ? "Must include lower, UPPER, number, special character, and be at least 18 characters."
                    : "Great password!"}
                </p>
                <ul className="mt-2 space-y-0.5 text-xs">
                  <li className={newPassword.length >= 18 ? "text-green-600" : "text-gray-400"}>
                    ✓ At least 18 characters
                  </li>
                  <li className={/[a-z]/.test(newPassword) ? "text-green-600" : "text-gray-400"}>
                    ✓ Lowercase letter
                  </li>
                  <li className={/[A-Z]/.test(newPassword) ? "text-green-600" : "text-gray-400"}>
                    ✓ Uppercase letter
                  </li>
                  <li className={/[0-9]/.test(newPassword) ? "text-green-600" : "text-gray-400"}>
                    ✓ Number
                  </li>
                  <li className={/[^A-Za-z0-9]/.test(newPassword) ? "text-green-600" : "text-gray-400"}>
                    ✓ Special character
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm New Password
            </label>
            <div className="relative mt-1">
              <input
                type={showConfirm ? "text" : "password"}
                required
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Re‑enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} className="h-5 w-5" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition disabled:opacity-50"
          >
            {submitting
              ? "Updating..."
              : hasPassword
              ? "Update Password"
              : "Set Password"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}