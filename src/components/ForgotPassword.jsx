import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import AuthLayout from "./AuthLayout";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await resetPassword(email);
      setMessage("Password reset email sent! Check your inbox.");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="We'll send you a reset link"
      footer={
        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
          ← Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl text-sm">
            {message}
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
    </AuthLayout>
  );
}