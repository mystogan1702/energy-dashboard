import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  linkWithCredential,
  deleteUser,                           // ← new
} from "firebase/auth";
import { auth } from "./firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Email / password
  function register(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Google sign‑in
  function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  // Password management
  function reauthenticateUser(password) {
    const credential = EmailAuthProvider.credential(
      currentUser.email,
      password
    );
    return reauthenticateWithCredential(currentUser, credential);
  }

  function changePassword(newPassword) {
    return updatePassword(currentUser, newPassword);
  }

  function setPasswordForGoogleUser(email, password) {
    const credential = EmailAuthProvider.credential(email, password);
    return linkWithCredential(currentUser, credential);
  }

  // Delete account
  function deleteAccount() {
    return deleteUser(currentUser);
  }

  const value = {
    currentUser,
    login,
    register,
    logout,
    resetPassword,
    loginWithGoogle,
    reauthenticateUser,
    changePassword,
    setPasswordForGoogleUser,
    deleteAccount,              // ← new
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}