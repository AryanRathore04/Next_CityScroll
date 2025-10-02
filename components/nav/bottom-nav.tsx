"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import {
  Search,
  MapPin,
  User,
  Calendar,
  BadgePercent,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface BottomNavProps {
  className?: string;
  activeTab?: "explore" | "nearby" | "bookings" | "offers" | "profile";
}

export function BottomNav({
  className,
  activeTab = "explore",
}: BottomNavProps) {
  const router = useRouter();
  const { user } = useAuth();

  const navItems = [
    { id: "explore", icon: Search, label: "Explore", href: "/salons" },
    { id: "nearby", icon: MapPin, label: "Nearby", href: "/salons?nearby=1" },
    { id: "bookings", icon: Calendar, label: "Bookings", href: "/booking" },
    { id: "offers", icon: BadgePercent, label: "Offers", href: "/membership" },
    {
      id: "profile",
      icon: user ? UserCircle : User,
      label: user ? "Account" : "Profile",
      href: user ? "/account" : "/signin",
    },
  ];

  return (
    <nav
      role="navigation"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden shadow-lg",
        className,
      )}
    >
      <div className="flex items-center justify-around py-1 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isProfileTab = item.id === "profile";

          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href as Route)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-2 min-w-[60px] transition-colors relative",
                isActive
                  ? "text-coral-500"
                  : isProfileTab && user
                  ? "text-coral-600 hover:text-coral-700"
                  : "text-gray-500 hover:text-gray-700",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Online indicator for logged-in user */}
              {isProfileTab && user && (
                <span className="absolute top-1 right-3 w-2 h-2 bg-green-500 rounded-full border border-white" />
              )}
              <Icon className={cn("h-5 w-5 mb-1")} />
              <span
                className={cn(
                  "text-xs font-medium",
                  isActive
                    ? "text-coral-500"
                    : isProfileTab && user
                    ? "text-coral-600"
                    : "text-gray-600",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
