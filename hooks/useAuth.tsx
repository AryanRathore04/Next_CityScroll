"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: "customer" | "vendor" | "admin";
  createdAt: string;
  updatedAt: string;
  businessName?: string;
  businessType?: string;
  businessAddress?: string;
  city?: string;
  description?: string;
  verified?: boolean;
  status?: string;
  rating?: number;
  totalBookings?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ userType: UserProfile["userType"]; firstName: string }>;
  signInWithGoogle: () => Promise<{
    userType: UserProfile["userType"];
    firstName: string;
  }>;
  signInWithFacebook: () => Promise<{
    userType: UserProfile["userType"];
    firstName: string;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token and validate on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (token) {
          const response = await fetch("/api/auth/verify", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user);
            setUserProfile(userData.user);
          } else {
            // Token invalid, try to refresh
            localStorage.removeItem("accessToken");
            await attemptSilentRefresh();
          }
        } else {
          // No access token, try to refresh with HttpOnly cookie
          await attemptSilentRefresh();
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Clear any stale tokens
        localStorage.removeItem("accessToken");
      } finally {
        setLoading(false);
      }
    };

    // Silent refresh helper that doesn't throw errors on failure
    const attemptSilentRefresh = async () => {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("accessToken", data.accessToken);
          setUser(data.user);
          setUserProfile(data.user);
        }
        // If refresh fails, just stay logged out (don't throw)
      } catch (error) {
        // Silent failure - user just stays logged out
        console.log("No valid session found, staying logged out");
      }
    };

    initializeAuth();
  }, []);

  // Normalize arbitrary thrown values to Error instances
  function normalizeError(e: unknown): Error {
    if (e instanceof Error) return e;
    if (typeof e === "string") return new Error(e);
    try {
      // Try to stringify objects (including Event-ish objects)
      const json = JSON.stringify(e);
      return new Error(json.length ? json : String(e));
    } catch {
      return new Error(String(e));
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Include cookies for HttpOnly refresh token
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Sign in failed");
      }

      const data = await response.json();

      // Store access token only (refresh token is now HttpOnly cookie)
      localStorage.setItem("accessToken", data.accessToken);

      // Set user state
      setUser(data.user);
      setUserProfile(data.user);

      return {
        userType: data.user.userType,
        firstName: data.user.firstName,
      };
    } catch (error) {
      console.error("Sign in error:", error);
      throw normalizeError(error);
    }
  }

  async function signInWithGoogle(): Promise<{
    userType: UserProfile["userType"];
    firstName: string;
  }> {
    // TODO: Implement Google OAuth with backend
    throw new Error("Google sign-in not implemented yet");
  }

  async function signInWithFacebook(): Promise<{
    userType: UserProfile["userType"];
    firstName: string;
  }> {
    // TODO: Implement Facebook OAuth with backend
    throw new Error("Facebook sign-in not implemented yet");
  }

  async function resetPassword(email: string) {
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Password reset failed");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      throw normalizeError(error);
    }
  }

  async function refreshToken() {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include", // Include HttpOnly cookies
      });

      if (!response.ok) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem("accessToken");
        setUser(null);
        setUserProfile(null);
        throw new Error("Session expired");
      }

      const data = await response.json();

      // Update access token (refresh token is automatically updated in HttpOnly cookie)
      localStorage.setItem("accessToken", data.accessToken);

      // Update user state
      setUser(data.user);
      setUserProfile(data.user);
    } catch (error) {
      console.error("Token refresh error:", error);
      // Clear local state on refresh failure
      localStorage.removeItem("accessToken");
      setUser(null);
      setUserProfile(null);
      throw normalizeError(error);
    }
  }

  async function signOut() {
    try {
      // Call backend to invalidate tokens and clear HttpOnly cookie
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include", // Include HttpOnly cookies
      });

      // Clear access token from localStorage
      localStorage.removeItem("accessToken");

      // Clear user state
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Sign out error:", error);
      // Still clear local state even if backend call fails
      localStorage.removeItem("accessToken");
      setUser(null);
      setUserProfile(null);
      throw normalizeError(error);
    }
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
    refreshToken,
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
