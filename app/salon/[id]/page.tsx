"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";

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

const services = [
  {
    id: "1",
    name: "Deep Tissue Massage",
    duration: "60 mins",
    price: "₹2,500",
    description:
      "Intensive therapeutic massage targeting muscle tension and knots",
    image:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop&crop=center",
  },
  {
    id: "2",
    name: "Hot Stone Therapy",
    duration: "75 mins",
    price: "₹3,200",
    description: "Relaxing treatment using heated stones to release tension",
    image:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=300&fit=crop&crop=center",
  },
  {
    id: "3",
    name: "Aromatherapy Session",
    duration: "45 mins",
    price: "₹2,000",
    description: "Holistic therapy using essential oils for mind-body wellness",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center",
  },
  {
    id: "4",
    name: "Couples Massage",
    duration: "90 mins",
    price: "₹5,500",
    description: "Shared relaxation experience in our couples suite",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center",
  },
];

const timeSlots = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
];

export default function VendorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [vendorStats, setVendorStats] = useState<VendorStats | null>(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const router = useRouter();

  // Resolve params and fetch vendor data
  useEffect(() => {
    const initializeVendor = async () => {
      try {
        const resolvedParams = await params;
        setVendorId(resolvedParams.id);

        // Fetch reviews
        setIsLoadingReviews(true);
        const response = await fetch(
          `/api/reviews?vendorId=${resolvedParams.id}&limit=10&sortBy=createdAt`,
        );
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews);
          setVendorStats(data.vendorStats);
        }
      } catch (error) {
        console.error("Failed to fetch vendor data:", error);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    initializeVendor();
  }, [params]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <AirbnbHeader />

      {/* Hero Image */}
      <section className="relative">
        <div className="h-64 md:h-80 bg-gray-100 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=400&fit=crop&crop=center"
            alt="Serenity Wellness Spa"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <div className="container mx-auto">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold text-white mb-2">
                  Serenity Wellness Spa
                </h1>
                <div className="flex items-center gap-2 text-white/90">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">
                    Connaught Place, New Delhi
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
                              {service.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-gray-500">
                                <Clock className="h-4 w-4" />
                                <span>{service.duration}</span>
                              </div>
                              <div className="text-lg font-semibold text-coral-500">
                                {service.price}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="coral"
                            className="rounded-lg px-6"
                            onClick={() => {
                              setSelectedService(service.id);
                              router.push("/booking" as Route);
                            }}
                          >
                            Book Now
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&h=300&fit=crop&crop=center",
                      "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=300&h=300&fit=crop&crop=center",
                      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop&crop=center",
                      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=300&h=300&fit=crop&crop=center",
                      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=center",
                      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop&crop=center",
                      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=300&h=300&fit=crop&crop=center",
                      "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=300&h=300&fit=crop&crop=center",
                      "https://images.unsplash.com/photo-1487088678257-3a541e6e3922?w=300&h=300&fit=crop&crop=center",
                    ].map((src, i) => (
                      <div
                        key={i}
                        className="aspect-square bg-gray-100 rounded-xl overflow-hidden"
                      >
                        <img
                          src={src}
                          alt={`Gallery ${i + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
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
                      Open Today
                    </div>
                    <div className="text-sm text-gray-500">
                      9:00 AM - 9:00 PM
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div className="text-sm text-gray-700">+91 98765 43210</div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div className="text-sm text-gray-700">
                    info@serenityspa.com
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 airbnb-shadow border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-4">
                Available Today
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTimeSlot === time ? "coral" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTimeSlot(time)}
                    className="text-xs"
                  >
                    {time}
                  </Button>
                ))}
              </div>
              <Button
                variant="coral"
                className="w-full mt-4 rounded-lg"
                disabled={!selectedTimeSlot}
                onClick={() => {
                  if (selectedTimeSlot) router.push("/booking" as Route);
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Book Appointment
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <div className="bg-white rounded-xl p-6 airbnb-shadow border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-4">Location</h3>
              <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                123 Wellness Street, Connaught Place, New Delhi - 110001
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
    </div>
  );
}
