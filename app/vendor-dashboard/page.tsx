"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/client-error-helpers";
import { NotificationBell } from "@/components/notifications/NotificationBell";
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
  UserCheck,
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
  Upload,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { OnboardingWizard } from "@/components/vendor/OnboardingWizard";

export default function VendorDashboardPage() {
  const router = useRouter();
  const { user, userProfile, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [vendorStatus, setVendorStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(
    null,
  );
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalReviews: 0,
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [vendorImages, setVendorImages] = useState<string[]>([]);

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

  const [staffForm, setStaffForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialization: [] as string[],
    services: [] as string[],
    schedule: {
      monday: {
        isAvailable: true,
        startTime: "09:00",
        endTime: "18:00",
        breaks: [],
      },
      tuesday: {
        isAvailable: true,
        startTime: "09:00",
        endTime: "18:00",
        breaks: [],
      },
      wednesday: {
        isAvailable: true,
        startTime: "09:00",
        endTime: "18:00",
        breaks: [],
      },
      thursday: {
        isAvailable: true,
        startTime: "09:00",
        endTime: "18:00",
        breaks: [],
      },
      friday: {
        isAvailable: true,
        startTime: "09:00",
        endTime: "18:00",
        breaks: [],
      },
      saturday: {
        isAvailable: true,
        startTime: "09:00",
        endTime: "17:00",
        breaks: [],
      },
      sunday: {
        isAvailable: false,
        startTime: "09:00",
        endTime: "17:00",
        breaks: [],
      },
    },
  });
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);

  const [profileForm, setProfileForm] = useState({
    businessName: "",
    businessType: "",
    customBusinessType: "",
    businessAddress: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    description: "",
    amenities: [] as string[],
  });

  // Predefined business types
  const businessTypes = [
    "Salon",
    "Spa",
    "Wellness Center",
    "Beauty Studio",
    "Massage Parlor",
    "Hair Studio",
    "Nail Salon",
    "Barbershop",
    "Makeup Studio",
    "Skin Care Clinic",
    "Other",
  ];

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]); // Reload when user changes

  const checkOnboardingStatus = async () => {
    try {
      setIsLoading(true);

      // Wait for user to be loaded if not ready yet
      if (!user?.id) {
        console.log("⏳ [DASHBOARD] User not ready yet, waiting...");
        setIsLoading(false);
        return;
      }

      console.log("🔵 [DASHBOARD] Checking onboarding status for user:", {
        userId: user.id,
        userType: user.userType,
        email: user.email,
      });

      // Redirect customers to home page
      if (user.userType === "customer") {
        console.log(
          "⚠️ [DASHBOARD] Customer trying to access vendor dashboard, redirecting...",
        );
        alert(
          "This page is only accessible to vendors. Please sign up as a vendor to access this feature.",
        );
        router.push("/" as Route);
        return;
      }

      // Only allow vendors and admins
      if (user.userType !== "vendor" && user.userType !== "admin") {
        console.log("⚠️ [DASHBOARD] Unauthorized user type:", user.userType);
        router.push("/signin" as Route);
        return;
      }

      // Check vendor approval status first
      if (user.userType === "vendor") {
        console.log(
          "🔵 [DASHBOARD] Fetching vendor profile with vendorId:",
          user.id,
        );

        // CRITICAL FIX: Must pass vendorId as query parameter
        const profileResponse = await fetch(
          `/api/vendor/profile?vendorId=${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          },
        );

        console.log(
          "🔵 [DASHBOARD] Profile response status:",
          profileResponse.status,
        );

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log("🔵 [DASHBOARD] Profile data received:", {
            status: profileData.status,
            businessName: profileData.businessName,
            onboardingCompleted: profileData.onboardingCompleted,
          });

          setVendorStatus(profileData.status); // Store vendor status

          // CRITICAL: If vendor is not approved, show pending/rejected screen and STOP
          // Do NOT show onboarding wizard for unapproved vendors
          if (profileData.status === "pending_approval") {
            console.log(
              "⏸️ [DASHBOARD] Vendor status is pending_approval, showing pending screen",
            );
            setIsLoading(false);
            return; // Stop here, will show pending approval UI
          }

          // If vendor is rejected or suspended
          if (
            profileData.status === "rejected" ||
            profileData.status === "suspended"
          ) {
            console.log(
              "❌ [DASHBOARD] Vendor status is rejected/suspended, showing appropriate message",
            );
            setIsLoading(false);
            return; // Will show appropriate message
          }

          // ONLY if vendor is approved, check onboarding status
          if (profileData.status === "approved") {
            console.log(
              "✅ [DASHBOARD] Vendor is approved, checking onboarding completion",
            );

            const response = await fetch("/api/vendor/onboarding", {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              console.log("🔵 [DASHBOARD] Onboarding status:", {
                completed: data.onboardingCompleted,
              });

              if (!data.onboardingCompleted) {
                console.log(
                  "📋 [DASHBOARD] Onboarding not completed, showing wizard",
                );
                setShowOnboarding(true);
                setIsLoading(false);
                return;
              }

              console.log(
                "✅ [DASHBOARD] Onboarding completed, loading dashboard data",
              );
            }
          }
        } else {
          console.error(
            "🔴 [DASHBOARD] Failed to fetch vendor profile:",
            profileResponse.status,
            await profileResponse.text(),
          );
          // If profile fetch fails, show error state
          setLoadError(
            "Failed to load your vendor profile. Please try refreshing the page.",
          );
          setIsLoading(false);
          return;
        }
      }

      // If onboarding is completed or not needed, load dashboard data
      console.log("🔵 [DASHBOARD] Loading dashboard data...");
      await loadVendorData();
    } catch (error) {
      console.error("🔴 [DASHBOARD] Error checking onboarding status:", error);
      setLoadError(
        "An unexpected error occurred. Please try refreshing the page.",
      );
      setIsLoading(false);
    }
  };

  const loadVendorData = async () => {
    try {
      setIsLoading(true);

      const uid = user?.id;
      if (!uid) return;

      console.log("Loading vendor data for user:", uid);
      const profile = await vendorService.getVendorProfile(uid);
      setVendorProfile(profile);
      if (profile) {
        // Check if business type is in predefined list
        const predefinedTypes = [
          "Salon",
          "Spa",
          "Wellness Center",
          "Beauty Studio",
          "Massage Parlor",
          "Hair Studio",
          "Nail Salon",
          "Barbershop",
          "Makeup Studio",
          "Skin Care Clinic",
        ];
        const isCustomType =
          profile.businessType &&
          !predefinedTypes.includes(profile.businessType);

        setProfileForm({
          businessName: profile.businessName || "",
          businessType: isCustomType ? "Other" : profile.businessType || "",
          customBusinessType: isCustomType ? profile.businessType : "",
          businessAddress: profile.businessAddress?.street || "",
          city: profile.businessAddress?.city || "",
          state: profile.businessAddress?.state || "",
          zipCode: profile.businessAddress?.zipCode || "",
          phone: profile.phone || "",
          description: profile.description || "",
          amenities: profile.amenities || [],
        });
        // Load vendor images
        setVendorImages(profile.images || []);
      }
      const vendorServices = await vendorService.getVendorServices(uid);
      setServices(vendorServices);
      const vendorBookings = await vendorService.getVendorBookings(uid);
      setBookings(vendorBookings);

      // Load staff data
      try {
        const response = await fetch(`/api/staff?vendorId=${uid}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        if (response.ok) {
          const staffData = await response.json();
          setStaff(staffData.data || []);
        }
      } catch (error) {
        console.error("Error loading staff:", error);
      }

      const analyticsData = await vendorService.getVendorAnalytics(uid);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error loading vendor data:", error);
      // If it's an authentication error, redirect to signin
      const errorMessage = getErrorMessage(error);
      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("401")
      ) {
        console.log("Authentication error, redirecting to signin");
        router.push("/signin" as Route);
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const uid = user?.id || "demo-vendor";
      console.log("Updating profile for user:", uid);

      // Structure the businessAddress object properly
      const updateData = {
        businessName: profileForm.businessName,
        // Use custom business type if "Other" is selected, otherwise use the selected type
        businessType:
          profileForm.businessType === "Other"
            ? profileForm.customBusinessType
            : profileForm.businessType,
        businessAddress: {
          street: profileForm.businessAddress,
          city: profileForm.city,
          state: profileForm.state,
          zipCode: profileForm.zipCode,
        },
        phone: profileForm.phone,
        description: profileForm.description,
        amenities: profileForm.amenities,
      };

      await vendorService.updateVendorProfile(uid, updateData as any);

      console.log("Profile updated successfully");
      await loadVendorData();
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage = getErrorMessage(error);
      alert(`Failed to update profile: ${errorMessage}`);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setUploadingImages(true);

      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
      }

      const response = await fetch("/api/vendor/images", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload images");
      }

      const data = await response.json();
      setVendorImages(data.images || []);
      alert("Images uploaded successfully!");

      // Reset file input
      event.target.value = "";
    } catch (error) {
      console.error("Error uploading images:", error);
      const errorMessage = getErrorMessage(error);
      alert(`Failed to upload images: ${errorMessage}`);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    try {
      const response = await fetch("/api/vendor/images", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      const data = await response.json();
      setVendorImages(data.images || []);
      alert("Image deleted successfully!");
    } catch (error) {
      console.error("Error deleting image:", error);
      const errorMessage = getErrorMessage(error);
      alert(`Failed to delete image: ${errorMessage}`);
    }
  };

  const handleThumbnailUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }

      setUploadingImages(true);

      const formData = new FormData();
      formData.append("thumbnail", file);

      console.log("🔵 [THUMBNAIL] Uploading featured thumbnail...");

      const response = await fetch("/api/vendor/thumbnail", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload thumbnail");
      }

      const data = await response.json();
      console.log("✅ [THUMBNAIL] Thumbnail uploaded successfully:", data);

      // Update vendor profile with new thumbnail
      setVendorProfile((prev) =>
        prev ? { ...prev, profileImage: data.thumbnailUrl } : prev,
      );

      alert("Featured thumbnail uploaded successfully!");

      // Reset file input
      event.target.value = "";

      // Reload vendor data to get updated profile
      await loadVendorData();
    } catch (error) {
      console.error("🔴 [THUMBNAIL] Error uploading thumbnail:", error);
      const errorMessage = getErrorMessage(error);
      alert(`Failed to upload thumbnail: ${errorMessage}`);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleServiceSubmit = async () => {
    try {
      console.log("Submitting service:", serviceForm);

      if (editingService) {
        await vendorService.updateService(editingService.id!, serviceForm);
        console.log("Service updated successfully");
      } else {
        const result = await vendorService.addService({
          ...serviceForm,
          vendorId: vendorProfile?.id || user?.id || "demo-vendor",
        });
        console.log("Service created successfully:", result);
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
    } catch (error) {
      console.error("Error submitting service:", error);
      const errorMessage = getErrorMessage(error);
      alert(
        `Failed to ${
          editingService ? "update" : "create"
        } service: ${errorMessage}`,
      );
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      console.log("🔵 [ONBOARDING] Marking onboarding as complete...");

      // Mark onboarding as complete
      const response = await fetch("/api/vendor/onboarding", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to complete onboarding");
      }

      console.log("✅ [ONBOARDING] Onboarding marked as complete");

      // Hide onboarding wizard
      setShowOnboarding(false);

      // IMPORTANT: Recheck approval status before showing dashboard
      // This ensures vendors who completed onboarding but are still pending_approval
      // will see the pending approval screen instead of the full dashboard
      console.log(
        "🔵 [ONBOARDING] Rechecking status after onboarding completion...",
      );
      await checkOnboardingStatus();
    } catch (error) {
      console.error("🔴 [ONBOARDING] Error completing onboarding:", error);
      alert(`Failed to complete onboarding: ${getErrorMessage(error)}`);
    }
  };
  const handleDeleteService = async (serviceId: string) => {
    try {
      console.log("Deleting service:", serviceId);
      await vendorService.deleteService(serviceId);
      console.log("Service deleted successfully");
      await loadVendorData();
    } catch (error) {
      console.error("Error deleting service:", error);
      const errorMessage = getErrorMessage(error);
      alert(`Failed to delete service: ${errorMessage}`);
    }
  };

  // Staff Management Functions
  const handleSubmitStaff = async () => {
    try {
      const uid = user?.id || "demo-vendor";
      console.log("Submitting staff:", staffForm);

      if (editingStaff) {
        const response = await fetch(`/api/staff/${editingStaff._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify(staffForm),
        });

        if (!response.ok) {
          throw new Error("Failed to update staff member");
        }
        console.log("Staff member updated successfully");
      } else {
        const response = await fetch("/api/staff", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            ...staffForm,
            vendorId: uid,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create staff member");
        }
        console.log("Staff member created successfully");
      }

      setIsStaffDialogOpen(false);
      setEditingStaff(null);
      setStaffForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        specialization: [],
        services: [],
        schedule: {
          monday: {
            isAvailable: false,
            startTime: "09:00",
            endTime: "17:00",
            breaks: [],
          },
          tuesday: {
            isAvailable: false,
            startTime: "09:00",
            endTime: "17:00",
            breaks: [],
          },
          wednesday: {
            isAvailable: false,
            startTime: "09:00",
            endTime: "17:00",
            breaks: [],
          },
          thursday: {
            isAvailable: false,
            startTime: "09:00",
            endTime: "17:00",
            breaks: [],
          },
          friday: {
            isAvailable: false,
            startTime: "09:00",
            endTime: "17:00",
            breaks: [],
          },
          saturday: {
            isAvailable: false,
            startTime: "09:00",
            endTime: "17:00",
            breaks: [],
          },
          sunday: {
            isAvailable: false,
            startTime: "09:00",
            endTime: "17:00",
            breaks: [],
          },
        },
      });

      await loadVendorData();
    } catch (error) {
      console.error("Error submitting staff:", error);
      const errorMessage = getErrorMessage(error);
      alert(
        `Failed to ${
          editingStaff ? "update" : "create"
        } staff member: ${errorMessage}`,
      );
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    try {
      console.log("Deleting staff:", staffId);
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete staff member");
      }
      console.log("Staff member deleted successfully");
      await loadVendorData();
    } catch (error) {
      console.error("Error deleting staff:", error);
      const errorMessage = getErrorMessage(error);
      alert(`Failed to delete staff member: ${errorMessage}`);
    }
  };

  const handleUpdateBookingStatus = async (
    bookingId: string,
    status: Booking["status"],
  ) => {
    try {
      console.log("Updating booking status:", bookingId, "to", status);
      await vendorService.updateBookingStatus(bookingId, status);
      console.log("Booking status updated successfully");
      await loadVendorData();
    } catch (error) {
      console.error("Error updating booking status:", error);
      const errorMessage = getErrorMessage(error);
      alert(`Failed to update booking status: ${errorMessage}`);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log("Signing out user");
      await signOut();
      router.push("/" as Route);
    } catch (error) {
      console.error("Error signing out:", error);
      const errorMessage = getErrorMessage(error);
      alert(`Failed to sign out: ${errorMessage}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Check if user is authorized (vendor or admin only)
  if (user && user.userType !== "vendor" && user.userType !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-card rounded-2xl shadow-lg border border-border p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto h-20 w-20 bg-orange-500/10 rounded-full flex items-center justify-center">
              <XCircle className="h-10 w-10 text-orange-500" />
            </div>
          </div>

          <h1 className="text-3xl font-heading text-foreground mb-4">
            Access Denied
          </h1>

          <p className="text-muted-foreground mb-6">
            This page is only accessible to vendors. Please sign up as a vendor
            to access the vendor dashboard.
          </p>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => router.push("/" as Route)}
              className="flex items-center gap-2"
            >
              Go to Home
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/signup" as Route)}
              className="flex items-center gap-2"
            >
              Sign Up as Vendor
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if profile loading failed
  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-card rounded-2xl shadow-lg border border-border p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto h-20 w-20 bg-red-500/10 rounded-full flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
          </div>

          <h1 className="text-3xl font-heading text-foreground mb-4">
            Something Went Wrong
          </h1>

          <p className="text-muted-foreground mb-6">{loadError}</p>

          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setLoadError(null);
                setIsLoading(true);
                checkOnboardingStatus();
              }}
              className="flex items-center gap-2"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/" as Route)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <Button
              variant="ghost"
              onClick={async () => await handleSignOut()}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show pending approval screen for vendors awaiting approval
  if (vendorStatus === "pending_approval") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-card rounded-2xl shadow-lg border border-border p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto h-20 w-20 bg-yellow-500/10 rounded-full flex items-center justify-center">
              <Clock className="h-10 w-10 text-yellow-500" />
            </div>
          </div>

          <h1 className="text-3xl font-heading text-foreground mb-4">
            Account Pending Approval
          </h1>

          <p className="text-muted-foreground mb-6 text-lg">
            Thank you for registering as a vendor with BeautyBook!
          </p>

          <div className="bg-muted/50 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold text-foreground mb-3">
              What happens next?
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Our admin team is reviewing your registration</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>You'll receive an email notification once approved</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>This typically takes 24-48 hours</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            If you have any questions, please contact us at{" "}
            <a
              href="mailto:support@beautybook.com"
              className="text-primary hover:underline"
            >
              support@beautybook.com
            </a>
          </p>

          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => router.push("/" as Route)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <Button
              variant="ghost"
              onClick={async () => await handleSignOut()}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show rejected/suspended screen
  if (vendorStatus === "rejected" || vendorStatus === "suspended") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-card rounded-2xl shadow-lg border border-border p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto h-20 w-20 bg-red-500/10 rounded-full flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
          </div>

          <h1 className="text-3xl font-heading text-foreground mb-4">
            {vendorStatus === "rejected"
              ? "Account Rejected"
              : "Account Suspended"}
          </h1>

          <p className="text-muted-foreground mb-6">
            {vendorStatus === "rejected"
              ? "Unfortunately, your vendor application was not approved."
              : "Your vendor account has been suspended."}
          </p>

          <p className="text-sm text-muted-foreground mb-6">
            For more information, please contact us at{" "}
            <a
              href="mailto:support@beautybook.com"
              className="text-primary hover:underline"
            >
              support@beautybook.com
            </a>
          </p>

          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => router.push("/" as Route)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <Button
              variant="ghost"
              onClick={async () => await handleSignOut()}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show onboarding wizard for new vendors
  if (showOnboarding) {
    return (
      <OnboardingWizard
        userId={user?.id || ""}
        userEmail={user?.email || ""}
        onComplete={handleOnboardingComplete}
      />
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
              <NotificationBell />
              <Button
                variant="ghost"
                onClick={() => router.push("/" as Route)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Site
              </Button>
              <Button
                variant="ghost"
                onClick={async () => await handleSignOut()}
              >
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
                { id: "staff", label: "Staff", icon: UserCheck },
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
                                onClick={async () =>
                                  await handleUpdateBookingStatus(
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
                                onClick={async () =>
                                  await handleUpdateBookingStatus(
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
                              onClick={async () =>
                                await handleUpdateBookingStatus(
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
                            value={serviceForm.name || ""}
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
                            value={serviceForm.description || ""}
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
                              value={serviceForm.category || ""}
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
                            onClick={async () => await handleServiceSubmit()}
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
                              name: service.name || "",
                              description: service.description || "",
                              category: service.category || "",
                              duration: service.duration || 30,
                              price: service.price || 0,
                              active: service.active ?? true,
                            });
                            setIsServiceDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () =>
                            await handleDeleteService(service.id!)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "staff" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-heading text-foreground">
                    Staff Management
                  </h1>
                  <Button
                    onClick={() => {
                      // Reset form when adding new staff
                      setEditingStaff(null);
                      setStaffForm({
                        firstName: "",
                        lastName: "",
                        email: "",
                        phone: "",
                        specialization: [],
                        services: [],
                        schedule: {
                          monday: {
                            isAvailable: true,
                            startTime: "09:00",
                            endTime: "18:00",
                            breaks: [],
                          },
                          tuesday: {
                            isAvailable: true,
                            startTime: "09:00",
                            endTime: "18:00",
                            breaks: [],
                          },
                          wednesday: {
                            isAvailable: true,
                            startTime: "09:00",
                            endTime: "18:00",
                            breaks: [],
                          },
                          thursday: {
                            isAvailable: true,
                            startTime: "09:00",
                            endTime: "18:00",
                            breaks: [],
                          },
                          friday: {
                            isAvailable: true,
                            startTime: "09:00",
                            endTime: "18:00",
                            breaks: [],
                          },
                          saturday: {
                            isAvailable: true,
                            startTime: "09:00",
                            endTime: "17:00",
                            breaks: [],
                          },
                          sunday: {
                            isAvailable: false,
                            startTime: "09:00",
                            endTime: "17:00",
                            breaks: [],
                          },
                        },
                      });
                      setIsStaffDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff Member
                  </Button>
                  <Dialog
                    open={isStaffDialogOpen}
                    onOpenChange={(open) => {
                      setIsStaffDialogOpen(open);
                      if (!open) {
                        setEditingStaff(null);
                      }
                    }}
                  >
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingStaff
                            ? "Edit Staff Member"
                            : "Add New Staff Member"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="staff-firstName">First Name</Label>
                            <Input
                              id="staff-firstName"
                              name="firstName"
                              value={staffForm.firstName}
                              onChange={(e) => {
                                console.log(
                                  "First name changed:",
                                  e.target.value,
                                );
                                setStaffForm({
                                  ...staffForm,
                                  firstName: e.target.value,
                                });
                              }}
                              placeholder="John"
                              autoComplete="off"
                            />
                          </div>
                          <div>
                            <Label htmlFor="staff-lastName">Last Name</Label>
                            <Input
                              id="staff-lastName"
                              name="lastName"
                              value={staffForm.lastName}
                              onChange={(e) => {
                                console.log(
                                  "Last name changed:",
                                  e.target.value,
                                );
                                setStaffForm({
                                  ...staffForm,
                                  lastName: e.target.value,
                                });
                              }}
                              placeholder="Doe"
                              autoComplete="off"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="staff-email">Email</Label>
                          <Input
                            id="staff-email"
                            name="email"
                            type="email"
                            value={staffForm.email}
                            onChange={(e) => {
                              console.log("Email changed:", e.target.value);
                              setStaffForm({
                                ...staffForm,
                                email: e.target.value,
                              });
                            }}
                            placeholder="john.doe@example.com"
                            autoComplete="off"
                          />
                        </div>
                        <div>
                          <Label htmlFor="staff-phone">Phone</Label>
                          <Input
                            id="staff-phone"
                            name="phone"
                            value={staffForm.phone}
                            onChange={(e) => {
                              console.log("Phone changed:", e.target.value);
                              setStaffForm({
                                ...staffForm,
                                phone: e.target.value,
                              });
                            }}
                            placeholder="+91 9876543210"
                            autoComplete="off"
                          />
                        </div>
                        <div>
                          <Label htmlFor="staff-specialization">
                            Specialization
                          </Label>
                          <Input
                            id="staff-specialization"
                            name="specialization"
                            value={staffForm.specialization.join(", ")}
                            onChange={(e) => {
                              console.log(
                                "Specialization changed:",
                                e.target.value,
                              );
                              setStaffForm({
                                ...staffForm,
                                specialization: e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter((s) => s),
                              });
                            }}
                            placeholder="Hair Styling, Massage, Facial"
                            autoComplete="off"
                          />
                        </div>

                        <div>
                          <Label>Weekly Schedule</Label>
                          <div className="space-y-3 mt-2">
                            {Object.entries(staffForm.schedule).map(
                              ([day, schedule]) => (
                                <div
                                  key={day}
                                  className="flex items-center gap-4 p-3 border rounded-lg"
                                >
                                  <div className="w-24">
                                    <Label className="capitalize">{day}</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={schedule.isAvailable}
                                      onCheckedChange={(checked) =>
                                        setStaffForm({
                                          ...staffForm,
                                          schedule: {
                                            ...staffForm.schedule,
                                            [day]: {
                                              ...schedule,
                                              isAvailable: checked as boolean,
                                            },
                                          },
                                        })
                                      }
                                    />
                                    <Label>Available</Label>
                                  </div>
                                  {schedule.isAvailable && (
                                    <>
                                      <Input
                                        type="time"
                                        value={schedule.startTime}
                                        onChange={(e) =>
                                          setStaffForm({
                                            ...staffForm,
                                            schedule: {
                                              ...staffForm.schedule,
                                              [day]: {
                                                ...schedule,
                                                startTime: e.target.value,
                                              },
                                            },
                                          })
                                        }
                                        className="w-24"
                                      />
                                      <span>to</span>
                                      <Input
                                        type="time"
                                        value={schedule.endTime}
                                        onChange={(e) =>
                                          setStaffForm({
                                            ...staffForm,
                                            schedule: {
                                              ...staffForm.schedule,
                                              [day]: {
                                                ...schedule,
                                                endTime: e.target.value,
                                              },
                                            },
                                          })
                                        }
                                        className="w-24"
                                      />
                                    </>
                                  )}
                                </div>
                              ),
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={async () => await handleSubmitStaff()}
                            className="flex-1"
                          >
                            {editingStaff ? "Update" : "Add"} Staff Member
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsStaffDialogOpen(false);
                              setEditingStaff(null);
                              setStaffForm({
                                firstName: "",
                                lastName: "",
                                email: "",
                                phone: "",
                                specialization: [],
                                services: [],
                                schedule: {
                                  monday: {
                                    isAvailable: false,
                                    startTime: "09:00",
                                    endTime: "17:00",
                                    breaks: [],
                                  },
                                  tuesday: {
                                    isAvailable: false,
                                    startTime: "09:00",
                                    endTime: "17:00",
                                    breaks: [],
                                  },
                                  wednesday: {
                                    isAvailable: false,
                                    startTime: "09:00",
                                    endTime: "17:00",
                                    breaks: [],
                                  },
                                  thursday: {
                                    isAvailable: false,
                                    startTime: "09:00",
                                    endTime: "17:00",
                                    breaks: [],
                                  },
                                  friday: {
                                    isAvailable: false,
                                    startTime: "09:00",
                                    endTime: "17:00",
                                    breaks: [],
                                  },
                                  saturday: {
                                    isAvailable: false,
                                    startTime: "09:00",
                                    endTime: "17:00",
                                    breaks: [],
                                  },
                                  sunday: {
                                    isAvailable: false,
                                    startTime: "09:00",
                                    endTime: "17:00",
                                    breaks: [],
                                  },
                                },
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
                  {staff.map((member) => (
                    <div
                      key={member._id}
                      className="bg-card p-6 rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-heading text-foreground">
                            {member.firstName} {member.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {member.specialization?.join(", ")}
                          </p>
                        </div>
                        <Badge
                          variant={member.isActive ? "default" : "secondary"}
                        >
                          {member.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      {member.email && (
                        <p className="text-sm text-muted-foreground mb-2">
                          📧 {member.email}
                        </p>
                      )}
                      {member.phone && (
                        <p className="text-sm text-muted-foreground mb-4">
                          📞 {member.phone}
                        </p>
                      )}

                      <div className="mb-4">
                        <Label className="text-sm font-medium">
                          Working Days
                        </Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(member.schedule || {}).map(
                            ([day, schedule]: [string, any]) =>
                              schedule?.isAvailable && (
                                <Badge
                                  key={day}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {day.slice(0, 3)}
                                </Badge>
                              ),
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingStaff(member);
                            setStaffForm({
                              firstName: member.firstName,
                              lastName: member.lastName,
                              email: member.email || "",
                              phone: member.phone || "",
                              specialization: member.specialization || [],
                              services: member.services || [],
                              schedule: member.schedule || {
                                monday: {
                                  isAvailable: false,
                                  startTime: "09:00",
                                  endTime: "17:00",
                                  breaks: [],
                                },
                                tuesday: {
                                  isAvailable: false,
                                  startTime: "09:00",
                                  endTime: "17:00",
                                  breaks: [],
                                },
                                wednesday: {
                                  isAvailable: false,
                                  startTime: "09:00",
                                  endTime: "17:00",
                                  breaks: [],
                                },
                                thursday: {
                                  isAvailable: false,
                                  startTime: "09:00",
                                  endTime: "17:00",
                                  breaks: [],
                                },
                                friday: {
                                  isAvailable: false,
                                  startTime: "09:00",
                                  endTime: "17:00",
                                  breaks: [],
                                },
                                saturday: {
                                  isAvailable: false,
                                  startTime: "09:00",
                                  endTime: "17:00",
                                  breaks: [],
                                },
                                sunday: {
                                  isAvailable: false,
                                  startTime: "09:00",
                                  endTime: "17:00",
                                  breaks: [],
                                },
                              },
                            });
                            setIsStaffDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () =>
                            await handleDeleteStaff(member._id)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {staff.length === 0 && (
                    <div className="col-span-full">
                      <EmptyState
                        icon={UserCheck}
                        title="No Staff Members"
                        description="Add staff members to manage their schedules and services."
                        action={{
                          label: "Add Your First Staff Member",
                          onClick: () => setIsStaffDialogOpen(true),
                          icon: Plus,
                        }}
                        size="md"
                      />
                    </div>
                  )}
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
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await handleUpdateProfile();
                    }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                          id="businessName"
                          value={profileForm.businessName || ""}
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
                        <Select
                          value={profileForm.businessType || ""}
                          onValueChange={(value) => {
                            setProfileForm({
                              ...profileForm,
                              businessType: value,
                              // Clear custom input if switching away from "Other"
                              customBusinessType:
                                value !== "Other"
                                  ? ""
                                  : profileForm.customBusinessType,
                            });
                          }}
                        >
                          <SelectTrigger id="businessType">
                            <SelectValue placeholder="Select business type" />
                          </SelectTrigger>
                          <SelectContent>
                            {businessTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {profileForm.businessType === "Other" && (
                        <div>
                          <Label htmlFor="customBusinessType">
                            Specify Business Type
                          </Label>
                          <Input
                            id="customBusinessType"
                            placeholder="Enter your business type"
                            value={profileForm.customBusinessType || ""}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                customBusinessType: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="businessAddress">
                        Business Address (Street)
                      </Label>
                      <Input
                        id="businessAddress"
                        value={profileForm.businessAddress || ""}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            businessAddress: e.target.value,
                          })
                        }
                        placeholder="123 Main Street"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={profileForm.city || ""}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              city: e.target.value,
                            })
                          }
                          placeholder="Mumbai"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={profileForm.state || ""}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              state: e.target.value,
                            })
                          }
                          placeholder="Maharashtra"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          value={profileForm.zipCode || ""}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              zipCode: e.target.value,
                            })
                          }
                          placeholder="400001"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profileForm.phone || ""}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              phone: e.target.value,
                            })
                          }
                          placeholder="+91 9876543210"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Business Description</Label>
                      <Textarea
                        id="description"
                        value={profileForm.description || ""}
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

                    {/* Featured Thumbnail Image Section */}
                    <div className="space-y-4 border-t pt-6">
                      <div>
                        <Label className="text-lg font-semibold">
                          Featured Thumbnail
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          This image will be displayed as your business
                          thumbnail on the home page and in search results.
                          Choose a high-quality image that best represents your
                          business.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {/* Current Thumbnail Display */}
                        {vendorProfile?.profileImage && (
                          <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border-2 border-primary">
                            <img
                              src={vendorProfile.profileImage}
                              alt="Current featured thumbnail"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
                              Current Thumbnail
                            </div>
                          </div>
                        )}

                        {/* Upload New Thumbnail */}
                        <div className="flex items-center gap-4">
                          <label
                            htmlFor="thumbnail-upload"
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary/90 transition-colors"
                          >
                            <ImageIcon className="h-4 w-4" />
                            {uploadingImages
                              ? "Uploading..."
                              : vendorProfile?.profileImage
                              ? "Change Thumbnail"
                              : "Upload Thumbnail"}
                          </label>
                          <input
                            id="thumbnail-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailUpload}
                            disabled={uploadingImages}
                            className="hidden"
                          />
                          <span className="text-sm text-muted-foreground">
                            Recommended: 1200x800px, max 5MB
                          </span>
                        </div>

                        {!vendorProfile?.profileImage && (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-muted/30">
                            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                            <p className="text-muted-foreground text-sm">
                              No featured thumbnail set yet.
                            </p>
                            <p className="text-muted-foreground text-xs mt-1">
                              Upload a featured image to make your business
                              stand out!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Business Images Section */}
                    <div className="space-y-4 border-t pt-6">
                      <Label className="text-lg font-semibold">
                        Business Gallery Images
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Upload multiple images to showcase your business,
                        services, and facilities.
                      </p>
                      <div className="space-y-4">
                        {/* Upload Button */}
                        <div className="flex items-center gap-4">
                          <label
                            htmlFor="image-upload"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                          >
                            <Upload className="h-4 w-4" />
                            {uploadingImages ? "Uploading..." : "Upload Images"}
                          </label>
                          <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            disabled={uploadingImages}
                            className="hidden"
                          />
                          <span className="text-sm text-gray-500">
                            Upload multiple images of your business
                          </span>
                        </div>

                        {/* Image Gallery */}
                        {vendorImages.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {vendorImages.map((imageUrl, index) => (
                              <div
                                key={index}
                                className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors"
                              >
                                <img
                                  src={imageUrl}
                                  alt={`Business image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteImage(imageUrl)}
                                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                  title="Delete image"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {vendorImages.length === 0 && (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-500">
                              No images uploaded yet. Add images to showcase
                              your business!
                            </p>
                          </div>
                        )}
                      </div>
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
