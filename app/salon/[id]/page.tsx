"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookingForm } from "@/components/booking/BookingForm";
import { AirbnbHeader } from "@/components/nav/airbnb-header";
import { BottomNav } from "@/components/nav/bottom-nav";
import {
  Star,
  MapPin,
  Clock,
  Phone,
  Mail,
  Share2,
  Heart,
  ChevronLeft,
  Calendar,
  CheckCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface VendorData {
  _id: string;
  businessName: string;
  businessType?: string;
  businessAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  rating?: number;
  totalBookings?: number;
  profileImage?: string;
  images?: string[]; // Gallery images array
  description?: string;
  phone?: string;
  email?: string;
}

interface ServiceData {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
  category?: string;
  active: boolean;
}

interface Review {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  isAnonymous: boolean;
  customer: {
    firstName: string;
    lastName: string;
    profileImage?: string;
  } | null;
  service: {
    name: string;
  };
  vendorResponse?: {
    message: string;
    respondedAt: string;
  };
}

interface VendorStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface AvailabilityData {
  isOpen: boolean;
  businessHours: {
    open: string;
    close: string;
    display: string;
  } | null;
  timeSlots: Array<{
    time: string;
    available: boolean;
  }>;
  availableSlots: string[];
  message?: string;
}

export default function VendorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedService, setSelectedService] = useState<{
    id: string;
    name: string;
    duration: string;
    price: string;
    description?: string;
    _id?: string;
    durationInMinutes?: number;
    priceValue?: number;
    category?: string;
  } | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [vendorStats, setVendorStats] = useState<VendorStats | null>(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityData | null>(
    null,
  );
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const router = useRouter();

  // Resolve params and fetch vendor data
  useEffect(() => {
    const initializeVendor = async () => {
      try {
        const resolvedParams = await params;
        setVendorId(resolvedParams.id);

        // Fetch vendor profile
        setLoading(true);
        const vendorResponse = await fetch(
          `/api/vendor/profile?vendorId=${resolvedParams.id}`,
        );
        if (vendorResponse.ok) {
          const vendorData = await vendorResponse.json();
          setVendor(vendorData);
        }

        // Fetch services
        setLoadingServices(true);
        const servicesResponse = await fetch(
          `/api/vendor/services?vendorId=${resolvedParams.id}`,
        );
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          setServices(servicesData || []);
        }

        // Fetch reviews
        setIsLoadingReviews(true);
        const reviewsResponse = await fetch(
          `/api/reviews?vendorId=${resolvedParams.id}&limit=10&sortBy=createdAt`,
        );
        if (reviewsResponse.ok) {
          const data = await reviewsResponse.json();
          setReviews(data.reviews);
          setVendorStats(data.vendorStats);
        }

        // Fetch availability
        setLoadingAvailability(true);
        const availabilityResponse = await fetch(
          `/api/vendor/${resolvedParams.id}/availability`,
        );
        if (availabilityResponse.ok) {
          const availData = await availabilityResponse.json();
          setAvailability(availData.data);
        }
      } catch (error) {
        console.error("Failed to fetch vendor data:", error);
      } finally {
        setLoading(false);
        setLoadingServices(false);
        setIsLoadingReviews(false);
        setLoadingAvailability(false);
      }
    };

    initializeVendor();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-coral-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading vendor profile...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Vendor Not Found
          </h1>
          <Button onClick={() => router.push("/salons" as Route)}>
            Browse Salons
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <AirbnbHeader />

      {/* Hero Image */}
      <section className="relative">
        <div className="h-64 md:h-80 bg-gray-100 overflow-hidden">
          <img
            src={
              vendor.profileImage ||
              (vendor.images && vendor.images.length > 0
                ? vendor.images[0]
                : null) ||
              "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=400&fit=crop&crop=center"
            }
            alt={vendor.businessName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <div className="container mx-auto">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold text-white mb-2">
                  {vendor.businessName}
                </h1>
                <div className="flex items-center gap-2 text-white/90">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">
                    {vendor.businessAddress?.city || "Location"}
                    {vendor.businessAddress?.state &&
                      `, ${vendor.businessAddress.state}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-full">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-white font-medium">
                  {vendorStats?.averageRating || "New"}
                </span>
                <span className="text-white/80 text-sm">
                  ({vendorStats?.totalReviews || 0} reviews)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white/90 backdrop-blur-sm border-white"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white/90 backdrop-blur-sm border-white"
            onClick={() => setIsFavorited(!isFavorited)}
          >
            <Heart
              className={`h-4 w-4 ${
                isFavorited ? "fill-coral-500 text-coral-500" : ""
              }`}
            />
          </Button>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="services" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-100">
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
              </TabsList>

              <TabsContent value="services" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-700 mb-6">
                    Our Treatments
                  </h2>
                  {loadingServices ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-coral-500 mx-auto mb-4" />
                      <p className="text-gray-600">Loading services...</p>
                    </div>
                  ) : services.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-lg mb-2">
                        No services available
                      </p>
                      <p className="text-sm text-gray-500">
                        This vendor hasn't added any services yet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {services.map((service) => (
                        <div
                          key={service.id}
                          className="bg-white rounded-xl p-6 airbnb-shadow border border-gray-200 hover:airbnb-shadow-hover transition-all"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                {service.name}
                              </h3>
                              <p className="text-gray-500 text-sm mb-3">
                                {service.description || "Professional service"}
                              </p>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1 text-gray-500">
                                  <Clock className="h-4 w-4" />
                                  <span>{service.duration} mins</span>
                                </div>
                                <div className="text-lg font-semibold text-coral-500">
                                  ₹{service.price.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="coral"
                              className="rounded-lg px-6"
                              onClick={() => {
                                setSelectedService({
                                  id: service.id,
                                  name: service.name,
                                  duration: `${service.duration} mins`,
                                  price: `₹${service.price.toLocaleString()}`,
                                  description: service.description,
                                  _id: service.id,
                                  durationInMinutes: service.duration,
                                  priceValue: service.price,
                                  category: service.category,
                                });
                                setIsBookingDialogOpen(true);
                              }}
                            >
                              Book Now
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-700">
                      Client Reviews
                    </h2>
                    {vendorStats && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-lg">
                            {vendorStats.averageRating}
                          </span>
                        </div>
                        <span className="text-gray-500">
                          ({vendorStats.totalReviews} reviews)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Rating Distribution */}
                  {vendorStats && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <div className="grid grid-cols-5 gap-2 text-sm">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div key={rating} className="flex items-center gap-2">
                            <span className="w-3">{rating}</span>
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-yellow-400 h-2 rounded-full"
                                style={{
                                  width:
                                    vendorStats.totalReviews > 0
                                      ? `${
                                          (vendorStats.ratingDistribution[
                                            rating as keyof typeof vendorStats.ratingDistribution
                                          ] /
                                            vendorStats.totalReviews) *
                                          100
                                        }%`
                                      : "0%",
                                }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 w-6">
                              {
                                vendorStats.ratingDistribution[
                                  rating as keyof typeof vendorStats.ratingDistribution
                                ]
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    {isLoadingReviews ? (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center gap-2 text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-coral-500"></div>
                          Loading reviews...
                        </div>
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-lg mb-2">No reviews yet</p>
                        <p className="text-sm">
                          Be the first to leave a review after your visit!
                        </p>
                      </div>
                    ) : (
                      reviews.map((review) => (
                        <div
                          key={review._id}
                          className="bg-white rounded-xl p-6 airbnb-shadow border border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-coral-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-coral-700">
                                  {review.isAnonymous || !review.customer
                                    ? "A"
                                    : review.customer.firstName
                                        .charAt(0)
                                        .toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-700">
                                    {review.isAnonymous || !review.customer
                                      ? "Anonymous"
                                      : `${
                                          review.customer.firstName
                                        } ${review.customer.lastName.charAt(
                                          0,
                                        )}.`}
                                  </span>
                                  <CheckCircle className="h-4 w-4 text-coral-500" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-3 w-3 ${
                                          i < review.rating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {new Date(
                                      review.createdAt,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-600 leading-relaxed mb-3">
                            {review.comment}
                          </p>
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-600 mb-3"
                          >
                            {review.service.name}
                          </Badge>

                          {/* Vendor Response */}
                          {review.vendorResponse && (
                            <div className="mt-4 bg-gray-50 rounded-lg p-4 border-l-4 border-coral-200">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                  Response from business
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(
                                    review.vendorResponse.respondedAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {review.vendorResponse.message}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="gallery" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-700 mb-6">
                    Our Spaces
                  </h2>
                  {vendor.images && vendor.images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {vendor.images.map((src: string, i: number) => (
                        <div
                          key={i}
                          className="aspect-square bg-gray-100 rounded-xl overflow-hidden"
                        >
                          <img
                            src={src}
                            alt={`${vendor.businessName} - Gallery ${i + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              // Fallback if image fails to load
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&h=300&fit=crop&crop=center";
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-lg mb-2">
                        No gallery images yet
                      </p>
                      <p className="text-sm text-gray-500">
                        This venue hasn't added any gallery images.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 airbnb-shadow border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      {loadingAvailability
                        ? "Loading..."
                        : availability?.isOpen
                        ? "Open Today"
                        : "Closed Today"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {loadingAvailability
                        ? "..."
                        : availability?.businessHours?.display ||
                          availability?.message ||
                          "Hours not available"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div className="text-sm text-gray-700">
                    {vendor.phone || "Not available"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div className="text-sm text-gray-700">
                    {vendor.email || "Not available"}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 airbnb-shadow border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-4">
                Available Today
              </h3>
              {loadingAvailability ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-coral-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Loading availability...
                  </p>
                </div>
              ) : !availability?.isOpen ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium mb-1">
                    {availability?.message || "Closed Today"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Please check back on another day
                  </p>
                </div>
              ) : !availability.timeSlots ||
                availability.timeSlots.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium mb-1">
                    No Time Slots
                  </p>
                  <p className="text-sm text-gray-500">
                    No time slots configured for today
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-3 text-xs text-gray-500 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-coral-500 rounded-full"></span>
                      Available
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                      Booked
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {availability.timeSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={
                          selectedTimeSlot === slot.time ? "coral" : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          if (slot.available) {
                            setSelectedTimeSlot(slot.time);
                            // Open booking dialog with first service if available
                            if (services.length > 0) {
                              const firstService = services[0];
                              setSelectedService({
                                id: firstService.id,
                                name: firstService.name,
                                duration: `${firstService.duration} mins`,
                                price: `₹${firstService.price.toLocaleString()}`,
                                description: firstService.description,
                                _id: firstService.id,
                                durationInMinutes: firstService.duration,
                                priceValue: firstService.price,
                                category: firstService.category,
                              });
                              setIsBookingDialogOpen(true);
                            }
                          }
                        }}
                        disabled={!slot.available}
                        className={`text-xs transition-all ${
                          !slot.available
                            ? "opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200"
                            : selectedTimeSlot === slot.time
                            ? "bg-coral-500 text-white border-coral-500"
                            : "hover:border-coral-500 hover:text-coral-500"
                        }`}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 airbnb-shadow border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-4">Location</h3>
              <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {vendor.businessAddress?.street ||
                vendor.businessAddress?.city ||
                vendor.businessAddress?.state
                  ? [
                      vendor.businessAddress?.street,
                      vendor.businessAddress?.city,
                      vendor.businessAddress?.state,
                      vendor.businessAddress?.zipCode,
                    ]
                      .filter(Boolean)
                      .join(", ")
                  : "Address not available"}
              </p>
              <Button variant="outline" size="sm" className="w-full mt-3">
                Get Directions
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book {selectedService?.name}</DialogTitle>
          </DialogHeader>
          {selectedService && vendor && (
            <BookingForm
              service={{
                _id: selectedService._id || selectedService.id,
                name: selectedService.name,
                description: selectedService.description || "",
                price:
                  selectedService.priceValue ||
                  parseFloat(selectedService.price.replace(/[^\d.]/g, "")),
                duration:
                  selectedService.durationInMinutes ||
                  parseInt(selectedService.duration),
                category: selectedService.category || "Spa",
              }}
              vendor={{
                _id: vendor._id,
                businessName: vendor.businessName,
                firstName: vendor.businessName,
                lastName: "",
              }}
              onBack={() => setIsBookingDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
