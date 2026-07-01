import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import AuthLayout from "./AuthLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

function calculateStrength(password) {
  let score = 0;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 18) score++;
  return score;
}

function friendlyError(error) {
  const code = error?.code || "";
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please log in or use a different email.";
    case "auth/account-exists-with-different-credential":
      return "This email is already registered with another sign‑in method (e.g., Google). Please log in with that method.";
    case "auth/invalid-email":
      return "The email address is not valid. Please check and try again.";
    case "auth/weak-password":
      return "Password is too weak. It must be at least 6 characters (our rules require 18+).";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return error?.message || "An unexpected error occurred. Please try again.";
  }
}

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => calculateStrength(password), [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 18) {
      setError("Password must be at least 18 characters long.");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least one lowercase letter.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number.");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setError("Password must contain at least one special character (e.g., !@#$%).");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      navigate("/");
    } catch (err) {
      setError(friendlyError(err));
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const result = await loginWithGoogle();
      const providers = result.user.providerData.map((p) => p.providerId);
      if (!providers.includes("password")) {
        navigate("/change-password");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Start monitoring your energy in minutes"
      footer={
        <span>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="email"
            required
            className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              required
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="At least 18 characters…"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              onClick={() => setShowPassword(!showPassword)}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="h-5 w-5" />
            </button>
          </div>

          {password.length > 0 && (
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
                <li className={password.length >= 18 ? "text-green-600" : "text-gray-400"}>
                  ✓ At least 18 characters
                </li>
                <li className={/[a-z]/.test(password) ? "text-green-600" : "text-gray-400"}>
                  ✓ Lowercase letter
                </li>
                <li className={/[A-Z]/.test(password) ? "text-green-600" : "text-gray-400"}>
                  ✓ Uppercase letter
                </li>
                <li className={/[0-9]/.test(password) ? "text-green-600" : "text-gray-400"}>
                  ✓ Number
                </li>
                <li className={/[^A-Za-z0-9]/.test(password) ? "text-green-600" : "text-gray-400"}>
                  ✓ Special character
                </li>
              </ul>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
          <div className="relative mt-1">
            <input
              type={showConfirm ? "text" : "password"}
              required
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Re‑enter your password"
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
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign up with Email"}
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full py-3 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition flex items-center justify-center gap-2"
        >
          <FontAwesomeIcon icon={faGoogle} className="text-red-500" />
          Continue with Google
        </button>
      </form>
    </AuthLayout>
  );
}