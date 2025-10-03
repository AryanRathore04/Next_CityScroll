"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState, LoadingEmptyState } from "@/components/ui/empty-state";
import {
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Search,
  Filter,
  MoreVertical,
  Star,
  CheckCircle,
  XCircle,
  Leaf,
  Moon,
  Sun,
  Bell,
  Settings,
  Clock,
  UserCheck,
  AlertCircle,
} from "lucide-react";

interface DashboardStats {
  totalUsers: { value: string; change: string; trend: string };
  monthlyBookings: { value: string; change: string; trend: string };
  revenue: { value: string; change: string; trend: string; rawValue: number };
  activeVendors: { value: string; change: string; trend: string };
}

interface Booking {
  id: string;
  customer: string;
  vendor: string;
  service: string;
  amount: string;
  rawAmount: number;
  status: string;
  date: string;
  createdAt: string;
}

interface PopularArea {
  city: string;
  state: string;
  bookingCount: number;
  revenue: number;
  vendorCount: number;
  averageRating: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingVendors, setPendingVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalReason, setApprovalReason] = useState("");
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">(
    "approve",
  );

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [popularAreas, setPopularAreas] = useState<PopularArea[]>([]);
  const [areasLoading, setAreasLoading] = useState(true);

  // Check admin access
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // If not logged in, redirect to signin
    if (!user || !userProfile) {
      router.push("/signin" as Route);
      return;
    }

    // If not admin, redirect to home
    if (userProfile.userType !== "admin") {
      router.push("/" as Route);
      return;
    }
  }, [user, userProfile, authLoading, router]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch("/api/admin/dashboard-stats", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch recent bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch("/api/admin/bookings?limit=20", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setRecentBookings(data.bookings || []);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setBookingsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Fetch popular areas for analytics
  useEffect(() => {
    const fetchPopularAreas = async () => {
      try {
        const response = await fetch("/api/analytics/popular-areas");
        if (response.ok) {
          const data = await response.json();
          setPopularAreas(data.data?.cities || []);
        }
      } catch (error) {
        console.error("Error fetching popular areas:", error);
      } finally {
        setAreasLoading(false);
      }
    };

    fetchPopularAreas();
  }, []);

  // Load pending vendors
  const loadPendingVendors = async () => {
    setIsLoading(true);
    try {
      // For demo purposes, we'll use test data if no auth token
      const response = await fetch("/api/admin/vendor-approval?test=true", {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("accessToken") || "demo-token"
          }`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingVendors(data.pendingVendors || []);
      } else {
        console.error("Failed to load pending vendors");
      }
    } catch (error) {
      console.error("Error loading pending vendors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle vendor approval/rejection
  const handleVendorAction = async () => {
    if (!selectedVendor) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/vendor-approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            localStorage.getItem("accessToken") || "demo-token"
          }`,
        },
        body: JSON.stringify({
          vendorId: selectedVendor.id,
          action: approvalAction,
          reason: approvalReason,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Vendor ${approvalAction}d successfully:`, data);

        // Remove the vendor from pending list
        setPendingVendors((prev) =>
          prev.filter((v) => v.id !== selectedVendor.id),
        );

        // Reset form
        setIsApprovalDialogOpen(false);
        setSelectedVendor(null);
        setApprovalReason("");
        setApprovalAction("approve");

        alert(`Vendor ${approvalAction}d successfully!`);
      } else {
        const error = await response.json();
        alert(`Failed to ${approvalAction} vendor: ${error.message}`);
      }
    } catch (error) {
      console.error(`Error ${approvalAction}ing vendor:`, error);
      alert(`Failed to ${approvalAction} vendor. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load pending vendors on component mount
  useEffect(() => {
    loadPendingVendors();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-primary/10 text-primary";
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "active":
        return "bg-primary/10 text-primary";
      default:
        return "bg-spa-stone text-spa-charcoal/60";
    }
  };

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="text-center">
          <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <p className="text-spa-charcoal/60">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not admin (will redirect via useEffect)
  if (!user || !userProfile || userProfile.userType !== "admin") {
    return null;
  }

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-spa-charcoal text-white" : "bg-gradient-hero"
      }`}
    >
      <nav
        className={`border-b ${
          darkMode
            ? "bg-spa-charcoal/50 border-white/10"
            : "bg-white/95 backdrop-blur-sm border-spa-stone/20"
        } sticky top-0 z-50`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <Leaf className="h-4 w-4 text-white" />
              </div>
              <span
                className={`text-xl font-light tracking-wide ${
                  darkMode ? "text-white" : "text-spa-charcoal"
                }`}
              >
                BeautyBook Admin
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className="p-2"
              >
                {darkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <Settings className="h-4 w-4" />
              </Button>
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">A</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1
            className={`text-3xl font-light mb-2 ${
              darkMode ? "text-white" : "text-spa-charcoal"
            }`}
          >
            Dashboard Overview
          </h1>
          <p
            className={`font-light ${
              darkMode ? "text-white/60" : "text-spa-charcoal/60"
            }`}
          >
            Monitor your platform's performance and manage operations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-6 sophisticated-shadow border animate-pulse ${
                    darkMode
                      ? "bg-spa-charcoal/30 border-white/10"
                      : "bg-white border-spa-stone/10"
                  }`}
                >
                  <div className="h-20"></div>
                </div>
              ))
            : stats
            ? [
                { title: "Total Users", data: stats.totalUsers, icon: Users },
                {
                  title: "Monthly Bookings",
                  data: stats.monthlyBookings,
                  icon: Calendar,
                },
                { title: "Revenue", data: stats.revenue, icon: DollarSign },
                {
                  title: "Active Vendors",
                  data: stats.activeVendors,
                  icon: TrendingUp,
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-6 sophisticated-shadow border ${
                    darkMode
                      ? "bg-spa-charcoal/30 border-white/10"
                      : "bg-white border-spa-stone/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <stat.icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge
                      className={`${
                        stat.data.trend === "up"
                          ? "bg-primary/10 text-primary"
                          : "bg-red-100 text-red-600"
                      } border-0`}
                    >
                      {stat.data.change}
                    </Badge>
                  </div>
                  <div
                    className={`text-2xl font-light mb-1 ${
                      darkMode ? "text-white" : "text-spa-charcoal"
                    }`}
                  >
                    {stat.data.value}
                  </div>
                  <div
                    className={`text-sm font-light ${
                      darkMode ? "text-white/60" : "text-spa-charcoal/60"
                    }`}
                  >
                    {stat.title}
                  </div>
                </div>
              ))
            : null}
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList
            className={`grid w-full max-w-md grid-cols-3 ${
              darkMode ? "bg-spa-charcoal/30" : "bg-white/70 backdrop-blur-sm"
            }`}
          >
            <TabsTrigger value="bookings" className="font-light">
              Bookings
            </TabsTrigger>
            <TabsTrigger value="vendors" className="font-light">
              Vendors
            </TabsTrigger>
            <TabsTrigger value="analytics" className="font-light">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
            <div
              className={`rounded-lg sophisticated-shadow border ${
                darkMode
                  ? "bg-spa-charcoal/30 border-white/10"
                  : "bg-white border-spa-stone/10"
              }`}
            >
              <div className="p-6 border-b border-spa-stone/10">
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className={`text-xl font-light ${
                      darkMode ? "text-white" : "text-spa-charcoal"
                    }`}
                  >
                    Recent Bookings
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                          darkMode ? "text-white/40" : "text-spa-charcoal/40"
                        }`}
                      />
                      <Input
                        placeholder="Search bookings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`pl-10 w-64 ${
                          darkMode
                            ? "bg-spa-charcoal/20 border-white/10"
                            : "border-spa-stone/20"
                        }`}
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                {bookingsLoading ? (
                  <div className="p-8">
                    <LoadingEmptyState
                      title="Loading bookings..."
                      description="Please wait while we fetch recent bookings."
                    />
                  </div>
                ) : recentBookings.length === 0 ? (
                  <div className="p-8">
                    <EmptyState
                      icon={Calendar}
                      title="No Bookings Found"
                      description="There are no bookings matching your criteria."
                      size="md"
                    />
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr
                        className={`border-b ${
                          darkMode ? "border-white/10" : "border-spa-stone/10"
                        }`}
                      >
                        {[
                          "Booking ID",
                          "Customer",
                          "Vendor",
                          "Service",
                          "Amount",
                          "Status",
                          "Actions",
                        ].map((h) => (
                          <th
                            key={h}
                            className={`text-left p-4 font-medium text-sm ${
                              darkMode
                                ? "text-white/80"
                                : "text-spa-charcoal/80"
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings
                        .filter((booking) => {
                          if (!searchQuery) return true;
                          const query = searchQuery.toLowerCase();
                          return (
                            booking.id.toLowerCase().includes(query) ||
                            booking.customer.toLowerCase().includes(query) ||
                            booking.vendor.toLowerCase().includes(query) ||
                            booking.service.toLowerCase().includes(query)
                          );
                        })
                        .map((booking) => (
                          <tr
                            key={booking.id}
                            className={`border-b ${
                              darkMode ? "border-white/5" : "border-spa-stone/5"
                            } hover:bg-spa-stone/5`}
                          >
                            <td
                              className={`p-4 font-medium text-sm ${
                                darkMode ? "text-white" : "text-spa-charcoal"
                              }`}
                            >
                              {booking.id.substring(0, 8)}
                            </td>
                            <td
                              className={`p-4 text-sm ${
                                darkMode
                                  ? "text-white/80"
                                  : "text-spa-charcoal/80"
                              }`}
                            >
                              {booking.customer}
                            </td>
                            <td
                              className={`p-4 text-sm ${
                                darkMode
                                  ? "text-white/80"
                                  : "text-spa-charcoal/80"
                              }`}
                            >
                              {booking.vendor}
                            </td>
                            <td
                              className={`p-4 text-sm ${
                                darkMode
                                  ? "text-white/80"
                                  : "text-spa-charcoal/80"
                              }`}
                            >
                              {booking.service}
                            </td>
                            <td
                              className={`p-4 text-sm font-medium ${
                                darkMode ? "text-white" : "text-spa-charcoal"
                              }`}
                            >
                              {booking.amount}
                            </td>
                            <td className="p-4">
                              <Badge
                                className={`${getStatusColor(
                                  booking.status,
                                )} border-0 font-light`}
                              >
                                {booking.status}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vendors" className="space-y-6">
            <div
              className={`rounded-lg sophisticated-shadow border ${
                darkMode
                  ? "bg-spa-charcoal/30 border-white/10"
                  : "bg-white border-spa-stone/10"
              }`}
            >
              <div className="p-6 border-b border-spa-stone/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2
                      className={`text-xl font-light mb-2 ${
                        darkMode ? "text-white" : "text-spa-charcoal"
                      }`}
                    >
                      Vendor Approval Management
                    </h2>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-white/60" : "text-spa-charcoal/60"
                      }`}
                    >
                      Review and approve pending vendor applications
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={loadPendingVendors}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                    >
                      {isLoading ? "Loading..." : "Refresh"}
                    </Button>
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-700"
                    >
                      {pendingVendors.length} Pending
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {isLoading ? (
                  <LoadingEmptyState
                    title="Loading pending vendors..."
                    description="Please wait while we fetch the vendor approval queue."
                  />
                ) : pendingVendors.length === 0 ? (
                  <EmptyState
                    icon={UserCheck}
                    title="No Pending Approvals"
                    description="All vendor applications have been processed."
                    size="md"
                  />
                ) : (
                  <div className="grid gap-4">
                    {pendingVendors.map((vendor) => (
                      <div
                        key={vendor.id}
                        className={`border rounded-lg p-4 hover:bg-spa-stone/5 transition-colors ${
                          darkMode ? "border-white/10" : "border-spa-stone/10"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                              <AlertCircle className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                              <h3
                                className={`${
                                  darkMode ? "text-white" : "text-spa-charcoal"
                                } font-medium`}
                              >
                                {vendor.businessName}
                              </h3>
                              <div className="flex items-center gap-4 text-sm">
                                <span
                                  className={`${
                                    darkMode
                                      ? "text-white/60"
                                      : "text-spa-charcoal/60"
                                  } font-light`}
                                >
                                  {vendor.email}
                                </span>
                                <span
                                  className={`${
                                    darkMode
                                      ? "text-white/60"
                                      : "text-spa-charcoal/60"
                                  } font-light`}
                                >
                                  Applied:{" "}
                                  {new Date(
                                    vendor.submittedDate,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className="bg-yellow-50 text-yellow-700 border-yellow-200"
                            >
                              Pending Review
                            </Badge>

                            <Dialog
                              open={
                                isApprovalDialogOpen &&
                                selectedVendor?.id === vendor.id
                              }
                              onOpenChange={(open) => {
                                setIsApprovalDialogOpen(open);
                                if (!open) {
                                  setSelectedVendor(null);
                                  setApprovalReason("");
                                  setApprovalAction("approve");
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                  onClick={() => {
                                    setSelectedVendor(vendor);
                                    setApprovalAction("approve");
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              </DialogTrigger>

                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    {approvalAction === "approve"
                                      ? "Approve"
                                      : "Reject"}{" "}
                                    Vendor Application
                                  </DialogTitle>
                                </DialogHeader>

                                <div className="space-y-4">
                                  <div className="border rounded-lg p-4 bg-muted/50">
                                    <h4 className="font-medium mb-2">
                                      Vendor Details
                                    </h4>
                                    <p>
                                      <span className="font-medium">
                                        Business Name:
                                      </span>{" "}
                                      {selectedVendor?.businessName}
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        Email:
                                      </span>{" "}
                                      {selectedVendor?.email}
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        Applied:
                                      </span>{" "}
                                      {selectedVendor?.submittedDate
                                        ? new Date(
                                            selectedVendor.submittedDate,
                                          ).toLocaleDateString()
                                        : "Unknown"}
                                    </p>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="action">Action</Label>
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        variant={
                                          approvalAction === "approve"
                                            ? "default"
                                            : "outline"
                                        }
                                        size="sm"
                                        onClick={() =>
                                          setApprovalAction("approve")
                                        }
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Approve
                                      </Button>
                                      <Button
                                        type="button"
                                        variant={
                                          approvalAction === "reject"
                                            ? "destructive"
                                            : "outline"
                                        }
                                        size="sm"
                                        onClick={() =>
                                          setApprovalAction("reject")
                                        }
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Reject
                                      </Button>
                                    </div>
                                  </div>

                                  <div>
                                    <Label htmlFor="reason">
                                      {approvalAction === "approve"
                                        ? "Approval Notes (Optional)"
                                        : "Rejection Reason"}
                                    </Label>
                                    <Textarea
                                      id="reason"
                                      value={approvalReason}
                                      onChange={(e) =>
                                        setApprovalReason(e.target.value)
                                      }
                                      placeholder={
                                        approvalAction === "approve"
                                          ? "Add any notes about the approval..."
                                          : "Please provide a reason for rejection..."
                                      }
                                      className="mt-1"
                                    />
                                  </div>

                                  <div className="flex gap-2 pt-4">
                                    <Button
                                      onClick={handleVendorAction}
                                      disabled={isLoading}
                                      className="flex-1"
                                      variant={
                                        approvalAction === "approve"
                                          ? "default"
                                          : "destructive"
                                      }
                                    >
                                      {isLoading
                                        ? "Processing..."
                                        : `${
                                            approvalAction === "approve"
                                              ? "Approve"
                                              : "Reject"
                                          } Vendor`}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() =>
                                        setIsApprovalDialogOpen(false)
                                      }
                                      disabled={isLoading}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => {
                                setSelectedVendor(vendor);
                                setApprovalAction("reject");
                                setIsApprovalDialogOpen(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div
              className={`rounded-lg sophisticated-shadow border p-6 ${
                darkMode
                  ? "bg-spa-charcoal/30 border-white/10"
                  : "bg-white border-spa-stone/10"
              }`}
            >
              <h2
                className={`text-xl font-light mb-6 ${
                  darkMode ? "text-white" : "text-spa-charcoal"
                }`}
              >
                Popular Areas - Business Expansion Insights
              </h2>
              {areasLoading ? (
                <LoadingEmptyState
                  title="Loading analytics..."
                  description="Analyzing popular areas across the platform"
                />
              ) : popularAreas.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="No Data Available"
                  description="Not enough booking data to generate area insights yet"
                  size="md"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr
                        className={`border-b ${
                          darkMode ? "border-white/10" : "border-spa-stone/10"
                        }`}
                      >
                        {[
                          "Rank",
                          "City",
                          "State",
                          "Bookings",
                          "Revenue",
                          "Vendors",
                          "Rating",
                        ].map((h) => (
                          <th
                            key={h}
                            className={`text-left p-4 font-medium text-sm ${
                              darkMode
                                ? "text-white/80"
                                : "text-spa-charcoal/80"
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {popularAreas.map((area, index) => (
                        <tr
                          key={`${area.city}-${area.state}`}
                          className={`border-b ${
                            darkMode ? "border-white/5" : "border-spa-stone/5"
                          } hover:bg-spa-stone/5`}
                        >
                          <td
                            className={`p-4 font-medium text-sm ${
                              darkMode ? "text-white" : "text-spa-charcoal"
                            }`}
                          >
                            {index + 1}
                          </td>
                          <td
                            className={`p-4 text-sm ${
                              darkMode
                                ? "text-white/80"
                                : "text-spa-charcoal/80"
                            }`}
                          >
                            {area.city}
                          </td>
                          <td
                            className={`p-4 text-sm ${
                              darkMode
                                ? "text-white/80"
                                : "text-spa-charcoal/80"
                            }`}
                          >
                            {area.state}
                          </td>
                          <td
                            className={`p-4 text-sm ${
                              darkMode ? "text-white" : "text-spa-charcoal"
                            }`}
                          >
                            {area.bookingCount.toLocaleString()}
                          </td>
                          <td
                            className={`p-4 text-sm font-medium ${
                              darkMode ? "text-white" : "text-spa-charcoal"
                            }`}
                          >
                            ₹
                            {area.revenue >= 100000
                              ? `${(area.revenue / 100000).toFixed(1)}L`
                              : area.revenue.toLocaleString()}
                          </td>
                          <td
                            className={`p-4 text-sm ${
                              darkMode ? "text-white" : "text-spa-charcoal"
                            }`}
                          >
                            {area.vendorCount}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Star
                                className={`h-4 w-4 ${
                                  area.averageRating >= 4
                                    ? "fill-spa-gold text-spa-gold"
                                    : "text-spa-stone/50"
                                }`}
                              />
                              <span
                                className={`text-sm ${
                                  darkMode ? "text-white" : "text-spa-charcoal"
                                }`}
                              >
                                {area.averageRating.toFixed(1)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
