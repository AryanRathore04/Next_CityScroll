"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PageLoading } from "@/components/ui/loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToastNotification,
  useToasts,
} from "@/components/ui/toast-notification";
import {
  Leaf,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  MapPin,
  Building,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Shield,
  Star,
  Users,
  Loader2,
} from "lucide-react";

export default function SignUpPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <SignUpInner />
    </Suspense>
  );
}

function SignUpInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp } = useAuth();
  const { toasts, removeToast, showSuccess, showError } = useToasts();

  const initialType = useMemo(
    () =>
      (searchParams.get("type") === "vendor" ? "vendor" : "customer") as
        | "customer"
        | "vendor",
    [searchParams],
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState<"customer" | "vendor">(initialType);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    agreeMarketing: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return <PageLoading />;

  const businessTypes = [
    "Spa & Wellness Center",
    "Hair Salon",
    "Beauty Salon",
    "Massage Therapy",
    "Nail Salon",
    "Ayurvedic Center",
    "Fitness & Yoga",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      showError("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    // Password strength check
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    if (!passwordRegex.test(formData.password)) {
      showError(
        "Password must be at least 12 characters with uppercase, lowercase, number and special character",
      );
      return;
    }

    if (!formData.agreeTerms) {
      showError("Please agree to the Terms of Service");
      return;
    }

    // Submit registration
    setIsSubmitting(true);
    try {
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        userType: userType,
      };

      const profile = await signUp(registrationData);

      // Show success message
      if (userType === "vendor") {
        showSuccess(
          `Welcome to BeautyBook, ${profile.firstName}! Let's set up your business.`,
        );
      } else {
        showSuccess(`Welcome to BeautyBook, ${profile.firstName}!`);
      }

      // Redirect to appropriate page
      setTimeout(() => {
        router.push(
          (profile.userType === "vendor" ? "/vendor-dashboard" : "/") as Route,
        );
      }, 1500);
    } catch (error: any) {
      showError(error?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <ToastNotification toasts={toasts} removeToast={removeToast} />
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
            Join BeautyBook
          </h1>
          <p className="text-muted-foreground font-body">
            {userType === "customer"
              ? "Start your wellness journey today"
              : "Grow your business with us"}
          </p>
        </div>

        {/* User Type */}
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

        {/* Form */}
        <div className="bg-card/90 backdrop-blur-sm rounded-2xl sophisticated-shadow border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-body text-foreground mb-3 block">
                  First Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        firstName: e.target.value,
                      })
                    }
                    className="pl-10 rounded-lg font-body"
                    placeholder="John"
                    required
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-body text-foreground mb-3 block">
                  Last Name
                </Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="rounded-lg font-body"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

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
                  className="pl-10 rounded-lg font-body"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-body text-foreground mb-3 block">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="pl-10 rounded-lg font-body"
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>

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
                  className="pl-10 pr-10 rounded-lg font-body"
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Min 12 characters with uppercase, lowercase, number & special
                character
              </p>
            </div>

            <div>
              <Label className="text-sm font-body text-foreground mb-3 block">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="pl-10 pr-10 rounded-lg font-body"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms */}
            <div className="space-y-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) =>
                    setFormData({ ...formData, agreeTerms: e.target.checked })
                  }
                  className="mt-1 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                  required
                />
                <span className="text-sm font-body text-muted-foreground">
                  I agree to the{" "}
                  <a href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.agreeMarketing}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      agreeMarketing: e.target.checked,
                    })
                  }
                  className="mt-1 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-sm font-body text-muted-foreground">
                  I'd like to receive wellness tips and special offers via email
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full py-3 font-heading"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Social */}
          <div className="my-6">
            <Separator />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground font-body">
                  Or sign up with
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="font-body hover:bg-accent">
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
            <Button variant="outline" className="font-body hover:bg-accent">
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

        {/* Back */}
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

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-muted-foreground font-body">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/signin" as Route)}
              className="text-primary hover:text-cta font-heading transition-colors"
            >
              Sign in here
            </button>
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-card/70 backdrop-blur-sm rounded-lg p-6 sophisticated-shadow border border-border">
          <h3 className="font-heading text-foreground mb-4 text-center">
            {userType === "customer"
              ? "Why Join BeautyBook?"
              : "Partner Benefits"}
          </h3>
          <div className="space-y-3">
            {userType === "customer" ? (
              <>
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-body text-muted-foreground">
                    Verified & trusted wellness providers
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="text-sm font-body text-muted-foreground">
                    Exclusive member discounts and offers
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-body text-muted-foreground">
                    Easy booking and rescheduling
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-body text-muted-foreground">
                    Reach 25,000+ potential customers
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="text-sm font-body text-muted-foreground">
                    Professional business dashboard
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-body text-muted-foreground">
                    Marketing support and insights
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
