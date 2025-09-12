"use client"
import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail, signOut as fbSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: "customer" | "vendor";
  createdAt: Date;
  updatedAt: Date;
  businessName?: string;
  businessType?: string;
  businessAddress?: string;
  city?: string;
  description?: string;
  verified?: boolean;
  rating?: number;
  totalBookings?: number;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  // Minimal auth actions so pages can function; replace with real implementations later
  signIn: (email: string, password: string) => Promise<{ userType: UserProfile["userType"]; firstName: string }>;
  signInWithGoogle: () => Promise<{ userType: UserProfile["userType"]; firstName: string }>;
  signInWithFacebook: () => Promise<{ userType: UserProfile["userType"]; firstName: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      // TODO: fetch user profile via server action or client Firestore read
      setUserProfile(null);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Temporary minimal implementations; swap with Firebase/Firestore-backed versions later
  async function signIn(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const firstName = cred.user.email?.split("@")[0] || "User";
    // TODO: fetch user profile to determine userType; default to customer
    const userType: UserProfile["userType"] = /vendor/i.test(email) ? "vendor" : "customer";
    return { userType, firstName };
  }
  async function signInWithGoogle() {
    return { userType: "customer" as const, firstName: "Google User" };
  }
  async function signInWithFacebook() {
    return { userType: "customer" as const, firstName: "Facebook User" };
  }
  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }
  async function signOut() {
    await fbSignOut(auth);
    setUser(null);
    setUserProfile(null);
  }

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signIn,
    signInWithGoogle,
    signInWithFacebook,
    signOut,
    resetPassword,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
