"use client";
import { useState, useEffect } from "react";
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

const stats = [
  {
    title: "Total Users",
    value: "25,486",
    change: "+12.5%",
    trend: "up",
    icon: Users,
  },
  {
    title: "Monthly Bookings",
    value: "5,247",
    change: "+8.2%",
    trend: "up",
    icon: Calendar,
  },
  {
    title: "Revenue",
    value: "₹12.4L",
    change: "+15.3%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "Active Vendors",
    value: "342",
    change: "+5.7%",
    trend: "up",
    icon: TrendingUp,
  },
];

const recentBookings = [
  {
    id: "BK001",
    customer: "Priya Sharma",
    vendor: "Serenity Spa",
    service: "Deep Tissue Massage",
    amount: "₹2,500",
    status: "completed",
    date: "Today, 2:30 PM",
  },
  {
    id: "BK002",
    customer: "Rajesh Kumar",
    vendor: "Zen Beauty Lounge",
    service: "Facial Treatment",
    amount: "₹1,800",
    status: "pending",
    date: "Today, 1:15 PM",
  },
  {
    id: "BK003",
    customer: "Anita Patel",
    vendor: "Natural Glow Studio",
    service: "Hair Spa",
    amount: "₹3,200",
    status: "confirmed",
    date: "Yesterday, 4:45 PM",
  },
];

export default function AdminDashboardPage() {
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
          {stats.map((stat, index) => (
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
                    stat.trend === "up"
                      ? "bg-primary/10 text-primary"
                      : "bg-red-100 text-red-600"
                  } border-0`}
                >
                  {stat.change}
                </Badge>
              </div>
              <div
                className={`text-2xl font-light mb-1 ${
                  darkMode ? "text-white" : "text-spa-charcoal"
                }`}
              >
                {stat.value}
              </div>
              <div
                className={`text-sm font-light ${
                  darkMode ? "text-white/60" : "text-spa-charcoal/60"
                }`}
              >
                {stat.title}
              </div>
            </div>
          ))}
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
                            darkMode ? "text-white/80" : "text-spa-charcoal/80"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking) => (
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
                          {booking.id}
                        </td>
                        <td
                          className={`p-4 text-sm ${
                            darkMode ? "text-white/80" : "text-spa-charcoal/80"
                          }`}
                        >
                          {booking.customer}
                        </td>
                        <td
                          className={`p-4 text-sm ${
                            darkMode ? "text-white/80" : "text-spa-charcoal/80"
                          }`}
                        >
                          {booking.vendor}
                        </td>
                        <td
                          className={`p-4 text-sm ${
                            darkMode ? "text-white/80" : "text-spa-charcoal/80"
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
                Platform Analytics
              </h2>
              <div className="text-center py-20">
                <TrendingUp
                  className={`h-16 w-16 mx-auto mb-4 ${
                    darkMode ? "text-white/20" : "text-spa-charcoal/20"
                  }`}
                />
                <p
                  className={`${
                    darkMode ? "text-white/60" : "text-spa-charcoal/60"
                  } font-light`}
                >
                  Advanced analytics and reporting features coming soon
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
