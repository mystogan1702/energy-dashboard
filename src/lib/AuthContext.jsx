import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./firebase";
import { logEvent } from "./logEvent"; 

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe; // cleanup on unmount
  }, []);

  // Register new user
  function register(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // Login existing user
  function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Log the login event (use a dummy device ID or a global one)
      logEvent("device_001", "userLogin", `User ${email} logged in`, "info", email);
      return userCredential;
    });
  }

  // Logout
  function logout() {
    return signOut(auth);
  }

  // Send password reset email
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  const value = {
    currentUser,
    login,
    register,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Only render children after the initial auth state is known */}
      {!loading && children}
    </AuthContext.Provider>
  );
}