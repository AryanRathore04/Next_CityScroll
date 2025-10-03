// Temporary in-app mock vendor service for Next.js pages parity.
// Replace with Firestore-backed implementation or server actions under app/api.

export interface VendorService {
  id?: string;
  vendorId: string;
  name: string;
  description: string;
  category: string;
  duration: number; // minutes
  price: number;
  imageUrl?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VendorProfile {
  id?: string;
  uid: string;
  businessName: string;
  businessType: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  phone: string;
  email: string;
  description: string;
  profileImage?: string; // Featured thumbnail image for home page
  images: string[];
  rating: number;
  totalReviews: number;
  totalBookings: number;
  verified: boolean;
  isOpen: boolean;
  openingHours: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
  amenities: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Booking {
  id?: string;
  customerId: string;
  vendorId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  bookingDate: Date;
  bookingTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Review {
  id?: string;
  customerId: string;
  vendorId: string;
  bookingId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

class VendorServiceApi {
  private base(path: string, qs?: Record<string, any>) {
    const url = new URL(
      `/api/vendor/${path}`,
      typeof window === "undefined"
        ? "http://localhost"
        : window.location.origin,
    );
    if (qs)
      Object.entries(qs).forEach(
        ([k, v]) => v != null && url.searchParams.set(k, String(v)),
      );
    return url.toString();
  }

  async getVendorProfile(uid: string): Promise<VendorProfile | null> {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    const headers: HeadersInit = { "cache-control": "no-store" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(this.base("profile", { vendorId: uid }), {
      cache: "no-store",
      headers,
    });
    if (!res.ok) throw new Error("Failed to fetch profile");
    const data = await res.json();
    return data as VendorProfile | null;
  }

  async updateVendorProfile(
    uid: string,
    updates: Partial<VendorProfile>,
  ): Promise<void> {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(this.base("profile"), {
      method: "PUT",
      headers,
      body: JSON.stringify({ vendorId: uid, ...updates }),
    });
    if (!res.ok) throw new Error("Failed to update profile");
  }

  async createVendorProfile(
    profile: Omit<VendorProfile, "id" | "createdAt" | "updatedAt">,
  ): Promise<void> {
    await this.updateVendorProfile(profile.uid, profile);
  }

  async getVendorServices(vendorId: string): Promise<VendorService[]> {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    const headers: HeadersInit = { "cache-control": "no-store" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(this.base("services", { vendorId }), {
      cache: "no-store",
      headers,
    });
    if (!res.ok) throw new Error("Failed to fetch services");
    const data = await res.json();
    return (data as any[]).map((s) => ({
      ...s,
      duration: Number(s.duration),
      price: Number(s.price),
    }));
  }

  async addService(
    service: Omit<VendorService, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(this.base("services"), {
      method: "POST",
      headers,
      body: JSON.stringify(service),
    });
    if (!res.ok) throw new Error("Failed to add service");
    const data = await res.json();
    return data.id as string;
  }

  async updateService(
    serviceId: string,
    updates: Partial<VendorService>,
  ): Promise<void> {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(this.base("services"), {
      method: "PUT",
      headers,
      body: JSON.stringify({ id: serviceId, ...updates }),
    });
    if (!res.ok) throw new Error("Failed to update service");
  }

  async deleteService(serviceId: string): Promise<void> {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(this.base("services", { id: serviceId }), {
      method: "DELETE",
      headers,
    });
    if (!res.ok) throw new Error("Failed to delete service");
  }

  async getVendorBookings(
    vendorId: string,
    status?: string,
  ): Promise<Booking[]> {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    const headers: HeadersInit = { "cache-control": "no-store" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(this.base("bookings", { vendorId, status }), {
      cache: "no-store",
      headers,
    });
    if (!res.ok) throw new Error("Failed to fetch bookings");
    const data = await res.json();
    // Normalize date strings to Date objects where present
    return (data as any[]).map((b) => ({
      ...b,
      bookingDate: b.bookingDate ? new Date(b.bookingDate) : new Date(),
    }));
  }

  async updateBookingStatus(
    bookingId: string,
    status: Booking["status"],
  ): Promise<void> {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(this.base("bookings"), {
      method: "PUT",
      headers,
      body: JSON.stringify({ id: bookingId, status }),
    });
    if (!res.ok) throw new Error("Failed to update booking status");
  }

  async getVendorReviews(_vendorId: string): Promise<Review[]> {
    // Optional: add API if needed later
    return [];
  }

  async getVendorAnalytics(vendorId: string): Promise<{
    totalBookings: number;
    pendingBookings: number;
    completedBookings: number;
    totalRevenue: number;
    averageRating: number;
    totalReviews: number;
  }> {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    const headers: HeadersInit = { "cache-control": "no-store" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(this.base("analytics", { vendorId }), {
      cache: "no-store",
      headers,
    });
    if (!res.ok) throw new Error("Failed to fetch analytics");
    return (await res.json()) as any;
  }

  async searchVendors(_params: {
    city?: string;
    serviceType?: string;
    priceRange?: string;
    rating?: number;
  }): Promise<VendorProfile[]> {
    // Placeholder: would query Firestore; not used by current pages
    return [];
  }
}

export const vendorService = new VendorServiceApi();
