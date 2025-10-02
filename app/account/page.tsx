"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  User,
  Settings,
  Heart,
  Calendar,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronRight,
  Gift,
  Bell,
  MapPin,
  Shield,
  Phone,
  Mail,
  Edit3,
  Star,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserStats {
  totalBookings: number;
  completedBookings: number;
  reviewsReceived: number;
  rating: number;
  verified: boolean;
  memberSince: string;
  daysSinceMember: number;
}

export default function AccountPage() {
  const { user, userProfile, signOut } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await fetch("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats({
            totalBookings: data.user.totalBookings || 0,
            completedBookings: data.user.completedBookings || 0,
            reviewsReceived: data.user.reviewsReceived || 0,
            rating: data.user.rating || 0,
            verified: data.user.verified || false,
            memberSince: data.user.memberSince,
            daysSinceMember: data.user.daysSinceMember || 0,
          });
        } else {
          console.warn("Failed to fetch user stats");
          setStats({
            totalBookings: 0,
            completedBookings: 0,
            reviewsReceived: 0,
            rating: 0,
            verified: false,
            memberSince: new Date().toISOString(),
            daysSinceMember: 0,
          });
        }
      } catch (err) {
        console.error("Error fetching user stats:", err);
        setError("Unable to load account details");
        setStats({
          totalBookings: 0,
          completedBookings: 0,
          reviewsReceived: 0,
          rating: 0,
          verified: false,
          memberSince: new Date().toISOString(),
          daysSinceMember: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStats();
  }, [user]);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/signin" as Route);
    }
  }, [isLoading, user, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/" as Route);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-coral-500 rounded-lg mx-auto mb-4 animate-pulse">
            <span className="flex items-center justify-center h-full text-white font-bold text-lg">
              B
            </span>
          </div>
          <div className="text-gray-600">Loading your account...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-0 h-auto"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </Button>
          <h1 className="text-lg font-bold text-gray-800">My Account</h1>
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
            <p className="text-sm text-yellow-700">{error}</p>
          </div>
        </div>
      )}

      {/* Profile Section */}
      <section className="bg-white px-4 py-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-coral-500 rounded-full flex items-center justify-center">
            {userProfile?.profileImage ? (
              <img
                src={userProfile.profileImage}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-white" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800">
              {userProfile
                ? `${userProfile.firstName} ${userProfile.lastName}`
                : user
                ? `${user.firstName} ${user.lastName}`
                : "Guest User"}
            </h2>
            <p className="text-sm text-gray-600">
              {user?.email || "Not signed in"}
            </p>
            {stats && (
              <div className="flex items-center gap-2 mt-1">
                {stats.rating > 0 && (
                  <>
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">
                      {stats.rating.toFixed(1)}
                    </span>
                  </>
                )}
                {stats.verified && (
                  <span className="text-sm text-gray-600">
                    {stats.rating > 0 ? "• " : ""}Verified member
                  </span>
                )}
                {!stats.verified && stats.rating === 0 && (
                  <span className="text-sm text-gray-500">New member</span>
                )}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={() => router.push("/account/edit" as Route)}
          >
            <Edit3 className="h-5 w-5 text-gray-600" />
          </Button>
        </div>

        {/* Stats Section */}
        {stats && stats.totalBookings > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {stats.totalBookings}
              </div>
              <div className="text-xs text-gray-500">Total Bookings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {stats.completedBookings}
              </div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {stats.daysSinceMember}
              </div>
              <div className="text-xs text-gray-500">Days Active</div>
            </div>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="bg-white px-4 py-4 border-b border-gray-100">
        <div className="grid grid-cols-4 gap-4">
          <QuickAction
            icon={<Calendar className="h-5 w-5" />}
            label="Bookings"
            onClick={() => router.push("/bookings" as Route)}
          />
          <QuickAction
            icon={<Heart className="h-5 w-5" />}
            label="Favorites"
            onClick={() => router.push("/favorites" as Route)}
          />
          <QuickAction
            icon={<Gift className="h-5 w-5" />}
            label="Offers"
            onClick={() => router.push("/offers" as Route)}
          />
          <QuickAction
            icon={<CreditCard className="h-5 w-5" />}
            label="Payments"
            onClick={() => router.push("/payment" as Route)}
          />
        </div>
      </section>

      {/* Menu Items */}
      <section className="bg-white">
        <div className="px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Account & Settings
          </h3>
          <div className="space-y-1">
            <MenuItem
              icon={<User className="h-5 w-5 text-gray-600" />}
              title="Personal Information"
              subtitle="Manage your account details"
              onClick={() => router.push("/account/profile" as Route)}
            />
            <MenuItem
              icon={<Bell className="h-5 w-5 text-gray-600" />}
              title="Notifications"
              subtitle="Manage your preferences"
              onClick={() => router.push("/account/notifications" as Route)}
            />
            <MenuItem
              icon={<MapPin className="h-5 w-5 text-gray-600" />}
              title="Saved Addresses"
              subtitle="Home, work and other addresses"
              onClick={() => router.push("/account/addresses" as Route)}
            />
            <MenuItem
              icon={<CreditCard className="h-5 w-5 text-gray-600" />}
              title="Payment Methods"
              subtitle="Cards, wallets and bank accounts"
              onClick={() => router.push("/account/payments" as Route)}
            />
          </div>
        </div>

        <div className="border-t border-gray-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Support & Legal
          </h3>
          <div className="space-y-1">
            <MenuItem
              icon={<HelpCircle className="h-5 w-5 text-gray-600" />}
              title="Help & Support"
              subtitle="FAQs, contact us, feedback"
              onClick={() => router.push("/help" as Route)}
            />
            <MenuItem
              icon={<Shield className="h-5 w-5 text-gray-600" />}
              title="Privacy & Safety"
              subtitle="Privacy policy, terms of service"
              onClick={() => router.push("/privacy" as Route)}
            />
            <MenuItem
              icon={<Gift className="h-5 w-5 text-gray-600" />}
              title="Refer & Earn"
              subtitle="Invite friends and get rewards"
              onClick={() => router.push("/referral" as Route)}
            />
          </div>
        </div>

        <div className="border-t border-gray-100 px-4 py-4">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start p-4 hover:bg-red-50 text-red-600 hover:text-red-700"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-medium">Sign Out</div>
              <div className="text-sm text-red-500">
                Sign out of your account
              </div>
            </div>
          </Button>
        </div>
      </section>

      {/* App Version */}
      <section className="px-4 py-6 text-center">
        <div className="text-sm text-gray-500">BeautyBook v2.1.0</div>
        <div className="text-xs text-gray-400 mt-1">
          Made with ❤️ for beauty enthusiasts
        </div>
      </section>

      {/* Bottom padding for navigation */}
      <div className="h-20"></div>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="w-10 h-10 bg-coral-100 rounded-full flex items-center justify-center mb-2 text-coral-600">
        {icon}
      </div>
      <span className="text-xs font-medium text-gray-700 text-center">
        {label}
      </span>
    </button>
  );
}

function MenuItem({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 text-left">
        <div className="font-medium text-gray-800">{title}</div>
        <div className="text-sm text-gray-500">{subtitle}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
    </button>
  );
}
