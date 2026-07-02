import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./lib/AuthContext"; // make sure this path matches your file
import { AuthProvider } from "./lib/AuthContext";
import { ThemeProvider } from "./lib/ThemeContext";


// Auth pages
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import ForgotPassword from "./components/ForgotPassword";

// App pages
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import HistoryPage from "./components/HistoryPage";
import NotificationsPage from "./components/NotificationsPage";
import EventLogsPage from "./components/EventLogsPage";
import SettingsPage from "./components/SettingsPage";
import DeviceSetup from "./components/DeviceSetup";
import SystemHealthPage from "./components/SystemHealthPage";
import ChangePasswordPage from "./components/ChangePasswordPage";


// Protected route wrapper
// force rebuild
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function AppContent() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      {/* Protected routes with shared Layout */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout onLogout={handleLogout} />
          </PrivateRoute>
        }
      >
        {/* Nested routes render inside Layout's <Outlet /> */}
        <Route index element={<Dashboard />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="device-setup" element={<DeviceSetup />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="event-logs" element={<EventLogsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="system-health" element={<SystemHealthPage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
      </Route>
    </Routes>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}