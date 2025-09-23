"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import {
  vendorService,
  type VendorProfile,
  type VendorService as Service,
  type Booking,
} from "@/services/vendor";
import {
  Leaf,
  BarChart3,
  Calendar,
  Settings,
  Users,
  Star,
  Plus,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  LogOut,
  DollarSign,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Route } from "next";

export default function VendorDashboardPage() {
  const router = useRouter();
  const { user, userProfile, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(
    null,
  );
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [analytics, setAnalytics] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalReviews: 0,
  });

  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    category: "",
    duration: 30,
    price: 0,
    active: true,
  });
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);

  const [profileForm, setProfileForm] = useState({
    businessName: "",
    businessType: "",
    businessAddress: "",
    city: "",
    phone: "",
    description: "",
    amenities: [] as string[],
  });

  useEffect(() => {
    loadVendorData();
  }, []);

  const loadVendorData = async () => {
    try {
      setIsLoading(true);
      const uid = user?.id || "demo-vendor";
      const profile = await vendorService.getVendorProfile(uid);
      setVendorProfile(profile);
      if (profile) {
        setProfileForm({
          businessName: profile.businessName,
          businessType: profile.businessType,
          businessAddress: profile.businessAddress,
          city: profile.city,
          phone: profile.phone,
          description: profile.description,
          amenities: profile.amenities || [],
        });
      }
      const vendorServices = await vendorService.getVendorServices(uid);
      setServices(vendorServices);
      const vendorBookings = await vendorService.getVendorBookings(uid);
      setBookings(vendorBookings);
      const analyticsData = await vendorService.getVendorAnalytics(uid);
      setAnalytics(analyticsData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    const uid = user?.id || "demo-vendor";
    await vendorService.updateVendorProfile(uid, {
      ...profileForm,
      uid,
      email: vendorProfile?.email || "",
    } as any);
    await loadVendorData();
  };

  const handleServiceSubmit = async () => {
    if (editingService) {
      await vendorService.updateService(editingService.id!, serviceForm);
    } else {
      await vendorService.addService({
        ...serviceForm,
        vendorId: vendorProfile?.id || "demo-vendor",
      });
    }
    setIsServiceDialogOpen(false);
    setEditingService(null);
    setServiceForm({
      name: "",
      description: "",
      category: "",
      duration: 30,
      price: 0,
      active: true,
    });
    await loadVendorData();
  };

  const handleDeleteService = async (serviceId: string) => {
    await vendorService.deleteService(serviceId);
    await loadVendorData();
  };

  const handleUpdateBookingStatus = async (
    bookingId: string,
    status: Booking["status"],
  ) => {
    await vendorService.updateBookingStatus(bookingId, status);
    await loadVendorData();
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/" as Route);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => router.push("/" as Route)}
              >
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Leaf className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-xl font-heading text-foreground">
                  BeautyBook
                </span>
              </div>
              <Badge variant="secondary" className="ml-4">
                Vendor Dashboard
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/" as Route)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Site
              </Button>
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <div className="w-64 space-y-2">
            <nav className="space-y-2">
              {[
                { id: "overview", label: "Overview", icon: BarChart3 },
                { id: "bookings", label: "Bookings", icon: Calendar },
                { id: "services", label: "Services", icon: Settings },
                { id: "profile", label: "Profile", icon: Users },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="font-body">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="flex-1">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-heading text-foreground">
                    Welcome back, {vendorProfile?.businessName || "Partner"}!
                  </h1>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-card p-6 rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-body text-muted-foreground">
                          Total Bookings
                        </p>
                        <p className="text-2xl font-heading text-foreground">
                          {analytics.totalBookings}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-card p-6 rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-cta/10 rounded-full">
                        <DollarSign className="h-6 w-6 text-cta" />
                      </div>
                      <div>
                        <p className="text-sm font-body text-muted-foreground">
                          Total Revenue
                        </p>
                        <p className="text-2xl font-heading text-foreground">
                          ₹{analytics.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-card p-6 rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-secondary/20 rounded-full">
                        <Star className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm font-body text-muted-foreground">
                          Average Rating
                        </p>
                        <p className="text-2xl font-heading text-foreground">
                          {analytics.averageRating}/5
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-card p-6 rounded-lg border border-border">
                  <h2 className="text-xl font-heading text-foreground mb-4">
                    Recent Bookings
                  </h2>
                  <div className="space-y-4">
                    {bookings.slice(0, 5).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-body text-foreground">
                            {booking.customerName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {booking.serviceName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {booking.bookingDate.toLocaleDateString()} at{" "}
                            {booking.bookingTime}
                          </p>
                        </div>
                        <Badge
                          variant={
                            booking.status === "completed"
                              ? "default"
                              : booking.status === "pending"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "bookings" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-heading text-foreground">
                  Bookings
                </h1>
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  <div className="space-y-1">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-6 border-t border-border"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-heading text-foreground">
                                {booking.customerName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {booking.customerEmail}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {booking.customerPhone}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="font-body text-foreground">
                              {booking.serviceName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {booking.bookingDate.toLocaleDateString()} at{" "}
                              {booking.bookingTime}
                            </p>
                            <p className="text-sm font-body text-foreground">
                              ₹{booking.servicePrice}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              booking.status === "completed"
                                ? "default"
                                : booking.status === "pending"
                                ? "secondary"
                                : booking.status === "confirmed"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {booking.status}
                          </Badge>
                          {booking.status === "pending" && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleUpdateBookingStatus(
                                    booking.id!,
                                    "confirmed",
                                  )
                                }
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleUpdateBookingStatus(
                                    booking.id!,
                                    "cancelled",
                                  )
                                }
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {booking.status === "confirmed" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateBookingStatus(
                                  booking.id!,
                                  "completed",
                                )
                              }
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "services" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-heading text-foreground">
                    Services
                  </h1>
                  <Dialog
                    open={isServiceDialogOpen}
                    onOpenChange={setIsServiceDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Service
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingService ? "Edit Service" : "Add New Service"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="serviceName">Service Name</Label>
                          <Input
                            id="serviceName"
                            value={serviceForm.name}
                            onChange={(e) =>
                              setServiceForm({
                                ...serviceForm,
                                name: e.target.value,
                              })
                            }
                            placeholder="e.g., Swedish Massage"
                          />
                        </div>
                        <div>
                          <Label htmlFor="serviceDescription">
                            Description
                          </Label>
                          <Textarea
                            id="serviceDescription"
                            value={serviceForm.description}
                            onChange={(
                              e: React.ChangeEvent<HTMLTextAreaElement>,
                            ) =>
                              setServiceForm({
                                ...serviceForm,
                                description: e.target.value,
                              })
                            }
                            placeholder="Describe your service..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="serviceCategory">Category</Label>
                            <Input
                              id="serviceCategory"
                              value={serviceForm.category}
                              onChange={(e) =>
                                setServiceForm({
                                  ...serviceForm,
                                  category: e.target.value,
                                })
                              }
                              placeholder="massage, hair, facial..."
                            />
                          </div>
                          <div>
                            <Label htmlFor="serviceDuration">
                              Duration (minutes)
                            </Label>
                            <Input
                              id="serviceDuration"
                              type="number"
                              value={serviceForm.duration}
                              onChange={(e) =>
                                setServiceForm({
                                  ...serviceForm,
                                  duration: parseInt(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="servicePrice">Price (₹)</Label>
                          <Input
                            id="servicePrice"
                            type="number"
                            value={serviceForm.price}
                            onChange={(e) =>
                              setServiceForm({
                                ...serviceForm,
                                price: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="serviceActive"
                            checked={serviceForm.active}
                            onChange={(e) =>
                              setServiceForm({
                                ...serviceForm,
                                active: e.target.checked,
                              })
                            }
                            className="rounded border-border"
                          />
                          <Label htmlFor="serviceActive">Active</Label>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleServiceSubmit}
                            className="flex-1"
                          >
                            {editingService ? "Update" : "Add"} Service
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsServiceDialogOpen(false);
                              setEditingService(null);
                              setServiceForm({
                                name: "",
                                description: "",
                                category: "",
                                duration: 30,
                                price: 0,
                                active: true,
                              });
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="bg-card p-6 rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-heading text-foreground">
                            {service.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {service.category}
                          </p>
                        </div>
                        <Badge
                          variant={service.active ? "default" : "secondary"}
                        >
                          {service.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-body text-foreground">
                          ₹{service.price}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {service.duration} mins
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingService(service);
                            setServiceForm({
                              name: service.name,
                              description: service.description,
                              category: service.category,
                              duration: service.duration,
                              price: service.price,
                              active: service.active,
                            });
                            setIsServiceDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteService(service.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-heading text-foreground">
                    Business Profile
                  </h1>
                </div>
                <div className="bg-card p-6 rounded-lg border border-border">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleUpdateProfile();
                    }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                          id="businessName"
                          value={profileForm.businessName}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              businessName: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="businessType">Business Type</Label>
                        <Input
                          id="businessType"
                          value={profileForm.businessType}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              businessType: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="businessAddress">Business Address</Label>
                      <Input
                        id="businessAddress"
                        value={profileForm.businessAddress}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            businessAddress: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={profileForm.city}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              city: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              phone: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Business Description</Label>
                      <Textarea
                        id="description"
                        value={profileForm.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setProfileForm({
                            ...profileForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Tell customers about your business..."
                        rows={4}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Update Profile
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
