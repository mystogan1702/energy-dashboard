import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import AuthLayout from "./AuthLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

function calculateStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

export default function RegisterPage() {
  const { register } = useAuth();
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
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await register(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const strengthLabels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
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
              placeholder="••••••••"
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
          {/* Password strength bar */}
          {password.length > 0 && (
            <div className="mt-2">
              <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strengthColors[strength]} transition-all duration-300`}
                  style={{ width: `${((strength + 1) / 5) * 100}%` }}
                />
              </div>
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                {strengthLabels[strength]} — {strength < 3 ? "Use at least 8 characters with upper, lower, numbers and symbols." : "Great password!"}
              </p>
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
              placeholder="••••••••"
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
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}