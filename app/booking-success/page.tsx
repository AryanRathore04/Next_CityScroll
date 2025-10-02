"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  User,
  CreditCard,
  ArrowLeft,
  Share2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { clientLogger as logger } from "@/lib/logger";
import { getErrorMessage } from "@/lib/client-error-helpers";

interface BookingDetails {
  id: string;
  serviceName: string;
  vendorName: string;
  datetime: string;
  duration: number;
  price: number;
  status: string;
  paymentStatus: string;
  customerName: string;
  address: string;
}

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookingId = searchParams.get("id");
  const paymentId = searchParams.get("paymentId");

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) {
        setError("Invalid booking ID");
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/signin");
          return;
        }

        const response = await fetch(`/api/bookings/${bookingId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch booking details");
        }

        const data = await response.json();
        setBookingDetails(data.booking);

        logger.info("Booking success page viewed", {
          bookingId,
          paymentId,
          serviceName: data.booking?.serviceName,
        });
      } catch (error) {
        logger.error("Failed to fetch booking details on success page", {
          error: getErrorMessage(error),
          bookingId,
          paymentId,
        });
        setError("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, paymentId, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const shareBooking = async () => {
    if (navigator.share && bookingDetails) {
      try {
        await navigator.share({
          title: "BeautyBook Appointment Confirmed",
          text: `My appointment for ${bookingDetails.serviceName} at ${
            bookingDetails.vendorName
          } is confirmed for ${formatDate(
            bookingDetails.datetime,
          )} at ${formatTime(bookingDetails.datetime)}.`,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to clipboard
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    if (bookingDetails) {
      const text = `My appointment for ${bookingDetails.serviceName} at ${
        bookingDetails.vendorName
      } is confirmed for ${formatDate(bookingDetails.datetime)} at ${formatTime(
        bookingDetails.datetime,
      )}. Booking ID: ${bookingDetails.id}`;
      navigator.clipboard.writeText(text);
      // You could add a toast notification here
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !bookingDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Unable to Load Booking
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push("/")} className="w-full">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/")}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </button>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">
                BeautyBook
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>

          <p className="text-lg text-gray-600 mb-4">
            Your appointment has been successfully booked and payment received.
          </p>

          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <CreditCard className="w-4 h-4" />
              Payment ID: {paymentId?.substring(0, 12)}...
            </span>
            <span className="flex items-center gap-1">
              Booking ID: {bookingDetails.id.substring(0, 8)}...
            </span>
          </div>
        </div>

        {/* Booking Details */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Appointment Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Appointment Details
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {bookingDetails.serviceName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {bookingDetails.vendorName}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDate(bookingDetails.datetime)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatTime(bookingDetails.datetime)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {bookingDetails.duration} minutes
                  </p>
                  <p className="text-sm text-gray-600">Session duration</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {bookingDetails.address || "Address details"}
                  </p>
                  <p className="text-sm text-gray-600">Venue location</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Payment & Status
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Service Fee</span>
                <span className="font-medium text-gray-900">
                  ₹{bookingDetails.price}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Booking Status</span>
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  {bookingDetails.status}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Status</span>
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  {bookingDetails.paymentStatus}
                </Badge>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Paid</span>
                  <span className="text-primary">₹{bookingDetails.price}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={shareBooking}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share Booking
            </Button>

            <Link href="/bookings">
              <Button className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                View All Bookings
              </Button>
            </Link>

            <Link href="/">
              <Button variant="outline">Book Another Service</Button>
            </Link>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            What's Next?
          </h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li>• You'll receive a confirmation email with all the details</li>
            <li>
              • We'll send you a reminder 24 hours before your appointment
            </li>
            <li>• The vendor will contact you if any changes are needed</li>
            <li>• Please arrive 5-10 minutes early for your appointment</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}
