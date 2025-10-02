"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeAnimationProps {
  userName: string;
  userType?: "customer" | "vendor" | "admin";
  show: boolean;
  onComplete?: () => void;
}

export function WelcomeAnimation({
  userName,
  userType = "customer",
  show,
  onComplete,
}: WelcomeAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 animate-scale-in">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Success Icon with Animation */}
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
            <div className="relative bg-green-500 rounded-full p-4">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Sparkles Animation */}
          <div className="relative">
            <Sparkles className="absolute -top-6 -left-8 h-6 w-6 text-coral-500 animate-bounce" />
            <Sparkles className="absolute -top-8 -right-6 h-5 w-5 text-coral-400 animate-bounce delay-75" />
            <Sparkles className="absolute -bottom-2 left-4 h-4 w-4 text-coral-300 animate-bounce delay-150" />
          </div>

          {/* Welcome Message */}
          <div className="space-y-2 pt-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome back, {userName}!
            </h2>
            <p className="text-gray-600">
              {userType === "vendor"
                ? "Ready to manage your services"
                : userType === "admin"
                ? "Admin dashboard is ready"
                : "Let's find your perfect wellness experience"}
            </p>
          </div>

          {/* Success Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-700">
              Successfully signed in
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
