"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useAuth } from "@/hooks/useAuth";
import { AirbnbHeader } from "@/components/nav/airbnb-header";
import { BottomNav } from "@/components/nav/bottom-nav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  User as UserIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface Booking {
  _id: string;
  serviceId: {
    _id: string;
    name: string;
    price: number;
    duration: number;
  };
  vendorId: {
    _id: string;
    businessName: string;
    city?: string;
    businessAddress?: string;
  };
  staffId?: {
    _id: string;
    name: string;
  };
  datetime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  totalPrice: number;
  notes?: string;
  createdAt: string;
}

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function BookingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/signin" as Route);
      return;
    }
    fetchBookings();
  }, [user, router]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/bookings", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const result = await response.json();
      if (result.success) {
        setBookings(result.data.bookings || []);
      } else {
        throw new Error(result.error || "Failed to load bookings");
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(err instanceof Error ? err.message : "Failed to load bookings");
      toast({
        title: "Error",
        description: "Failed to load your bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBookingsByStatus = (status: string[]) => {
    return bookings.filter((booking) => status.includes(booking.status));
  };

  const upcomingBookings = filterBookingsByStatus(["pending", "confirmed"]);
  const pastBookings = filterBookingsByStatus(["completed", "cancelled"]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <AirbnbHeader />
        <main className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-coral-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading your bookings...</p>
            </div>
          </div>
        </main>
        <BottomNav activeTab="bookings" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <AirbnbHeader />
        <main className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Error Loading Bookings
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchBookings}>Try Again</Button>
            </div>
          </div>
        </main>
        <BottomNav activeTab="bookings" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <AirbnbHeader />
        <main className="container mx-auto px-6 py-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-12 w-12 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-700 mb-4">
              No bookings yet!
            </h1>
            <p className="text-gray-500 mb-8">
              Time to book your first appointment and start your wellness
              journey.
            </p>
            <Button
              onClick={() => router.push("/salons" as Route)}
              className="bg-coral-500 hover:bg-coral-600"
            >
              Browse Salons
            </Button>
          </div>
        </main>
        <BottomNav activeTab="bookings" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <AirbnbHeader />

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Bookings</h1>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">Past ({pastBookings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No upcoming bookings</p>
              </div>
            ) : (
              upcomingBookings.map((booking) => (
                <BookingCard key={booking._id} booking={booking} />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No past bookings</p>
              </div>
            ) : (
              pastBookings.map((booking) => (
                <BookingCard key={booking._id} booking={booking} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav activeTab="bookings" />
    </div>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-1">
              {booking.serviceId.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {booking.vendorId.businessName}
            </CardDescription>
          </div>
          <Badge className={STATUS_COLORS[booking.status]}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(booking.datetime), "EEEE, MMMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>
              {format(new Date(booking.datetime), "h:mm a")} •{" "}
              {booking.serviceId.duration} min
            </span>
          </div>
          {booking.staffId && (
            <div className="flex items-center gap-2 text-gray-600">
              <UserIcon className="h-4 w-4" />
              <span>{booking.staffId.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600 font-semibold">
            <DollarSign className="h-4 w-4" />
            <span>${booking.totalPrice}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
