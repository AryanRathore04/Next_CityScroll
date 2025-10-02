"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoading } from "@/components/ui/loading";
import {
  ToastNotification,
  useToasts,
} from "@/components/ui/toast-notification";
import { WelcomeAnimation } from "@/components/ui/welcome-animation";
import {
  Leaf,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Loader2,
} from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithFacebook, user, userProfile } =
    useAuth();
  const { toasts, removeToast, showSuccess, showError } = useToasts();

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<"customer" | "vendor">("customer");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeData, setWelcomeData] = useState<{
    name: string;
    userType: "customer" | "vendor" | "admin";
  } | null>(null);

  useEffect(() => {
    // If already signed in and profile present, redirect
    if (user && userProfile) {
      router.push(
        (userProfile.userType === "vendor"
          ? "/vendor-dashboard"
          : "/") as Route,
      );
      return;
    }
    const t = setTimeout(() => setIsPageLoading(false), 600);
    return () => clearTimeout(t);
  }, [user, userProfile, router]);

  if (isPageLoading) return <PageLoading />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      showError("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const profile = await signIn(formData.email, formData.password);
      showSuccess(`Welcome back, ${profile.firstName}!`);

      // Show welcome animation
      setWelcomeData({ name: profile.firstName, userType: profile.userType });
      setShowWelcome(true);

      setTimeout(() => {
        router.push(
          (profile.userType === "vendor" ? "/vendor-dashboard" : "/") as Route,
        );
      }, 2000);
    } catch (error: any) {
      showError(error?.message || "Failed to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const profile = await signInWithGoogle();
      showSuccess(`Welcome back, ${profile.firstName}!`);

      // Show welcome animation
      setWelcomeData({ name: profile.firstName, userType: profile.userType });
      setShowWelcome(true);

      setTimeout(() => router.push("/" as Route), 2000);
    } catch (error: any) {
      showError(error?.message || "Failed to sign in with Google");
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      const profile = await signInWithFacebook();
      showSuccess(`Welcome back, ${profile.firstName}!`);

      // Show welcome animation
      setWelcomeData({ name: profile.firstName, userType: profile.userType });
      setShowWelcome(true);

      setTimeout(() => router.push("/" as Route), 2000);
    } catch (error: any) {
      showError(error?.message || "Failed to sign in with Facebook");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <ToastNotification toasts={toasts} removeToast={removeToast} />

      {/* Welcome Animation */}
      {showWelcome && welcomeData && (
        <WelcomeAnimation
          userName={welcomeData.name}
          userType={welcomeData.userType}
          show={showWelcome}
          onComplete={() => setShowWelcome(false)}
        />
      )}

      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div
            className="flex items-center justify-center gap-3 mb-8 cursor-pointer group"
            onClick={() => router.push("/" as Route)}
          >
            <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-heading text-foreground tracking-wide">
              BeautyBook
            </span>
          </div>
          <h1 className="text-3xl font-heading text-foreground mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground font-body">
            Sign in to your wellness account
          </p>
        </div>

        {/* User Type Selection */}
        <div className="bg-card/80 backdrop-blur-sm rounded-full p-1 sophisticated-shadow border border-border relative">
          <div
            className="absolute top-1 bottom-1 bg-primary rounded-full transition-all duration-300 ease-in-out"
            style={{
              left: userType === "customer" ? "4px" : "50%",
              right: userType === "customer" ? "50%" : "4px",
            }}
          />
          <div className="grid grid-cols-2 gap-1 relative">
            <button
              onClick={() => setUserType("customer")}
              className={`py-3 px-4 rounded-full text-sm font-body transition-all duration-300 relative z-10 ${
                userType === "customer"
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => setUserType("vendor")}
              className={`py-3 px-4 rounded-full text-sm font-body transition-all duration-300 relative z-10 ${
                userType === "vendor"
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Business Partner
            </button>
          </div>
        </div>

        {/* Sign In Form */}
        <div className="bg-card/90 backdrop-blur-sm rounded-2xl sophisticated-shadow border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <Label className="text-sm font-body text-foreground mb-3 block">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="pl-10 h-12 font-body"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <Label className="text-sm font-body text-foreground mb-3 block">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="pl-10 pr-10 h-12 font-body"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) =>
                    setFormData({ ...formData, rememberMe: e.target.checked })
                  }
                  className="rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-sm font-body text-muted-foreground">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                onClick={() => router.push("/forgot-password" as Route)}
                className="text-sm font-body text-primary hover:text-cta transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-cta hover:bg-cta/90 text-cta-foreground rounded-lg py-3 h-12 font-heading"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing In...
                </div>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground font-body">
                  Or continue with
                </span>
              </div>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="font-body hover:bg-accent"
              onClick={handleGoogleSignIn}
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="font-body hover:bg-accent"
              onClick={handleFacebookSignIn}
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </Button>
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => router.push("/" as Route)}
            className="flex items-center gap-2 font-body text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-muted-foreground font-body">
            Don't have an account?{" "}
            <button
              onClick={() => router.push("/signup" as Route)}
              className="text-primary hover:text-cta font-heading transition-colors"
            >
              Create one here
            </button>
          </p>
        </div>

        {/* Vendor perks */}
        {userType === "vendor" && (
          <div className="bg-card/70 backdrop-blur-sm rounded-lg p-6 sophisticated-shadow border border-border">
            <h3 className="font-heading text-foreground mb-4 text-center">
              Why Partner with BeautyBook?
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-body text-muted-foreground">
                  Increase your bookings by 3x
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-body text-muted-foreground">
                  Professional business dashboard
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-body text-muted-foreground">
                  Marketing and customer insights
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
