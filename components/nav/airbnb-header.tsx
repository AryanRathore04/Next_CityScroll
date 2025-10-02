"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Menu, User, LogOut, UserCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

interface AirbnbHeaderProps {
  className?: string;
}

export function AirbnbHeader({ className }: AirbnbHeaderProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      router.push("/" as Route);
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "";
    const firstInitial = user.firstName?.charAt(0).toUpperCase() || "";
    const lastInitial = user.lastName?.charAt(0).toUpperCase() || "";
    return (
      firstInitial + lastInitial || user.email?.charAt(0).toUpperCase() || "U"
    );
  };

  const getUserDisplayName = () => {
    if (!user) return "";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    return user.email?.split("@")[0] || "User";
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-white border-b border-gray-200 transition-all duration-200 shadow-sm",
        className,
      )}
    >
      <div className="w-full px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <div className="w-8 h-8 bg-coral-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="text-xl font-bold text-coral-500">BeautyBook</span>
          </Link>

          {/* Navigation Links - Desktop */}
          <nav className="hidden lg:flex flex-1 justify-center">
            <div className="flex items-center space-x-8">
              <Link
                href="/salons"
                className="text-gray-700 hover:text-coral-600 font-medium transition-colors"
              >
                Find Salons
              </Link>
              <Link
                href="/booking"
                className="text-gray-700 hover:text-coral-600 font-medium transition-colors"
              >
                My Bookings
              </Link>
              <Link
                href="/favorites"
                className="text-gray-700 hover:text-coral-600 font-medium transition-colors"
              >
                Favorites
              </Link>
              <Link
                href="/about"
                className="text-gray-700 hover:text-coral-600 font-medium transition-colors"
              >
                About
              </Link>
              <Link
                href="/signup?type=vendor"
                className="text-coral-600 hover:text-coral-700 font-semibold transition-colors"
              >
                Become a Partner
              </Link>
            </div>
          </nav>

          {/* Right Menu */}
          <div className="flex items-center gap-2 relative z-50">
            {/* Become a Host - Mobile Hidden */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex text-gray-700 hover:bg-gray-100 rounded-lg font-semibold"
              onClick={() => router.push("/signup?type=vendor" as Route)}
            >
              Partner with us
            </Button>

            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <div className="flex items-center border border-gray-300 rounded-lg p-1 hover:shadow-sm transition-shadow">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 rounded-md"
                  >
                    <Menu className="h-4 w-4 text-gray-700" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  side="bottom"
                  sideOffset={8}
                  className="w-64 p-0 rounded-lg border border-gray-200 shadow-xl z-50"
                >
                  <div className="py-2">
                    {user && (
                      <>
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="font-semibold text-gray-900">
                            {getUserDisplayName()}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          <p className="text-xs text-coral-600 mt-1 capitalize">
                            {user.userType} Account
                          </p>
                        </div>
                        <button
                          onClick={() => router.push("/account" as Route)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm text-gray-700 flex items-center gap-2"
                        >
                          <UserCircle className="h-4 w-4" />
                          My Account
                        </button>
                        <button
                          onClick={() => router.push("/booking" as Route)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm text-gray-700"
                        >
                          My bookings
                        </button>
                        <button
                          onClick={() => router.push("/favorites" as Route)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm text-gray-700"
                        >
                          My Favorites
                        </button>
                        {user.userType === "vendor" && (
                          <button
                            onClick={() =>
                              router.push("/vendor-dashboard" as Route)
                            }
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm text-coral-600 font-medium"
                          >
                            Vendor Dashboard
                          </button>
                        )}
                        {user.userType === "admin" && (
                          <button
                            onClick={() => router.push("/admin" as Route)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm text-coral-600 font-medium"
                          >
                            Admin Panel
                          </button>
                        )}
                        <div className="my-1 border-t border-gray-100" />
                      </>
                    )}
                    {!user && (
                      <>
                        <button
                          onClick={() => router.push("/about" as Route)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm text-gray-700"
                        >
                          Help Centre
                        </button>
                        <div className="my-1 border-t border-gray-100" />
                      </>
                    )}
                    <button
                      onClick={() =>
                        router.push("/signup?type=vendor" as Route)
                      }
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm text-gray-700"
                    >
                      Become a host
                      <div className="text-xs text-gray-500">
                        Start hosting and earn income
                      </div>
                    </button>
                    <button
                      onClick={() => router.push("/membership" as Route)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm text-gray-700"
                    >
                      Membership
                    </button>
                    {!user && (
                      <button
                        onClick={() =>
                          router.push("/vendor-dashboard" as Route)
                        }
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm text-gray-700"
                      >
                        Vendor dashboard
                      </button>
                    )}
                    <div className="my-1 border-t border-gray-100" />
                    {user ? (
                      <button
                        onClick={handleSignOut}
                        disabled={isLoggingOut}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 transition-colors text-sm text-red-600 font-medium flex items-center gap-2 disabled:opacity-50"
                      >
                        <LogOut className="h-4 w-4" />
                        {isLoggingOut ? "Logging out..." : "Log out"}
                      </button>
                    ) : (
                      <button
                        onClick={() => router.push("/signin" as Route)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm text-gray-700 font-medium"
                      >
                        Log in or sign up
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "w-7 h-7 rounded-md ml-1 transition-all",
                  user
                    ? "bg-coral-500 hover:bg-coral-600"
                    : "bg-gray-500 hover:bg-gray-600",
                )}
                onClick={() =>
                  router.push(
                    user ? ("/account" as Route) : ("/signin" as Route),
                  )
                }
                title={user ? getUserDisplayName() : "Sign in"}
              >
                {user ? (
                  <span className="text-white text-xs font-bold">
                    {getUserInitials()}
                  </span>
                ) : (
                  <User className="h-4 w-4 text-white" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className="lg:hidden mt-3 pt-3 border-t border-gray-100">
          <nav className="flex flex-wrap gap-4">
            <Link
              href="/salons"
              className="text-gray-700 hover:text-coral-600 font-medium transition-colors text-sm"
            >
              Find Salons
            </Link>
            <Link
              href="/booking"
              className="text-gray-700 hover:text-coral-600 font-medium transition-colors text-sm"
            >
              My Bookings
            </Link>
            <Link
              href="/favorites"
              className="text-gray-700 hover:text-coral-600 font-medium transition-colors text-sm"
            >
              Favorites
            </Link>
            <Link
              href="/about"
              className="text-gray-700 hover:text-coral-600 font-medium transition-colors text-sm"
            >
              About
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
