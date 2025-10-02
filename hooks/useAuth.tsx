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
  profileImage?: string;
}

interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  userType: "customer" | "vendor";
  businessName?: string;
  businessType?: string;
  businessAddress?: string;
  city?: string;
  description?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (
    data: SignUpData,
  ) => Promise<{ userType: UserProfile["userType"]; firstName: string }>;
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
      console.log("🔵 [AUTH] Initializing authentication...");
      try {
        const token = localStorage.getItem("accessToken");
        console.log(
          "🔵 [AUTH] Checking for existing access token:",
          token ? "[TOKEN PRESENT]" : "[NO TOKEN]",
        );
        if (token) {
          console.log("🔵 [AUTH] Verifying existing token with server...");
          const response = await fetch("/api/auth/verify", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            console.log(
              "🟢 [AUTH] Token verification successful, user loaded:",
              {
                userId: userData.user?.id,
                email: userData.user?.email,
                userType: userData.user?.userType,
              },
            );
            setUser(userData.user);
            setUserProfile(userData.user);
          } else {
            console.log(
              "🔴 [AUTH] Token verification failed, attempting refresh...",
            );
            // Token invalid, try to refresh
            localStorage.removeItem("accessToken");
            await attemptSilentRefresh();
          }
        } else {
          console.log(
            "🔵 [AUTH] No access token found, attempting silent refresh...",
          );
          // No access token, try to refresh with HttpOnly cookie
          await attemptSilentRefresh();
        }
      } catch (error) {
        console.error("🔴 [AUTH] Auth initialization error:", error);
        // Clear any stale tokens
        localStorage.removeItem("accessToken");
      } finally {
        console.log("🔵 [AUTH] Authentication initialization completed");
        setLoading(false);
      }
    };

    // Silent refresh helper that doesn't throw errors on failure
    const attemptSilentRefresh = async () => {
      try {
        console.log("🔵 [AUTH] Attempting silent refresh...");
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          console.log("🟢 [AUTH] Silent refresh successful, user restored:", {
            userId: data.user?.id,
            email: data.user?.email,
          });
          localStorage.setItem("accessToken", data.accessToken);
          setUser(data.user);
          setUserProfile(data.user);
        } else {
          console.log("🔴 [AUTH] Silent refresh failed, staying logged out");
        }
        // If refresh fails, just stay logged out (don't throw)
      } catch (error) {
        console.log(
          "🔴 [AUTH] Silent refresh error (staying logged out):",
          error,
        );
        // Silent failure - user just stays logged out
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
    console.log("🔵 [AUTH] Starting signin process for email:", email);
    try {
      console.log("🔵 [AUTH] Sending signin request to server...");
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Include cookies for HttpOnly refresh token
      });

      console.log("🔵 [AUTH] Signin response status:", response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error("🔴 [AUTH] Signin failed:", error);
        throw new Error(error.message || "Sign in failed");
      }

      const data = await response.json();
      console.log("🟢 [AUTH] Signin successful, received user data:", {
        userId: data.user?.id,
        email: data.user?.email,
        userType: data.user?.userType,
        hasAccessToken: !!data.accessToken,
      });

      // Store access token only (refresh token is now HttpOnly cookie)
      localStorage.setItem("accessToken", data.accessToken);
      console.log("🔵 [AUTH] Access token stored in localStorage");

      // Set user state
      setUser(data.user);
      setUserProfile(data.user);
      console.log("🟢 [AUTH] User state updated successfully");

      return {
        userType: data.user.userType,
        firstName: data.user.firstName,
      };
    } catch (error) {
      console.error("🔴 [AUTH] SignIn error occurred:", error);
      // Error will be handled by the calling component
      throw normalizeError(error);
    }
  }

  async function signUp(data: SignUpData) {
    console.log("🔵 [AUTH] Starting signup process for email:", data.email);
    try {
      console.log("🔵 [AUTH] Sending registration request to server...");
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include", // Include cookies for HttpOnly refresh token
      });

      console.log("🔵 [AUTH] Registration response status:", response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error("🔴 [AUTH] Registration failed:", error);
        throw new Error(error.message || "Registration failed");
      }

      const responseData = await response.json();
      console.log("🟢 [AUTH] Registration successful, received user data:", {
        userId: responseData.user?.id,
        email: responseData.user?.email,
        userType: responseData.user?.userType,
        status: responseData.user?.status,
        hasAccessToken: !!responseData.accessToken,
      });

      // Store access token (refresh token is HttpOnly cookie)
      localStorage.setItem("accessToken", responseData.accessToken);
      console.log("🔵 [AUTH] Access token stored in localStorage");

      // Set user state
      setUser(responseData.user);
      setUserProfile(responseData.user);
      console.log("🟢 [AUTH] User state updated successfully");

      return {
        userType: responseData.user.userType,
        firstName: responseData.user.firstName,
      };
    } catch (error) {
      console.error("🔴 [AUTH] Registration error occurred:", error);
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
    console.log("🔵 [AUTH] Starting signout process...");
    try {
      // Call backend to invalidate tokens and clear HttpOnly cookie
      console.log("🔵 [AUTH] Calling signout API...");
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include", // Include HttpOnly cookies
      });

      // Clear access token from localStorage
      console.log("🔵 [AUTH] Clearing access token from localStorage...");
      localStorage.removeItem("accessToken");

      // Clear user state
      console.log("🔵 [AUTH] Clearing user state...");
      setUser(null);
      setUserProfile(null);
      console.log("🟢 [AUTH] Signout completed successfully");
    } catch (error) {
      console.error("🔴 [AUTH] Sign out error:", error);
      // Still clear local state even if backend call fails
      localStorage.removeItem("accessToken");
      setUser(null);
      setUserProfile(null);
      console.log("🔵 [AUTH] Local state cleared despite signout error");
      throw normalizeError(error);
    }
  }

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signUp,
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
