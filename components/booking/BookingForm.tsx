"use client";

import React, { useState } from "react";
import { BookingCalendar } from "./BookingCalendar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  Clock,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
}

interface Vendor {
  _id: string;
  businessName: string;
  firstName: string;
  lastName: string;
}

interface BookingData {
  datetime: Date;
  staffId?: string;
  staffPreference: "any" | "specific";
}

interface BookingFormProps {
  service: Service;
  vendor: Vendor;
  onBack?: () => void;
}

enum BookingStep {
  CALENDAR = "calendar",
  DETAILS = "details",
  CONFIRMATION = "confirmation",
}

export function BookingForm({ service, vendor, onBack }: BookingFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<BookingStep>(
    BookingStep.CALENDAR,
  );
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const handleCalendarSelect = (data: BookingData) => {
    setBookingData(data);
    setCurrentStep(BookingStep.DETAILS);
  };

  const handleBackToCalendar = () => {
    setCurrentStep(BookingStep.CALENDAR);
  };

  const handleConfirmBooking = async () => {
    if (!bookingData) return;

    setLoading(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: service._id,
          vendorId: vendor._id,
          datetime: bookingData.datetime.toISOString(),
          notes: notes.trim() || undefined,
          staffId: bookingData.staffId,
          staffPreference: bookingData.staffPreference,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create booking");
      }

      if (result.success) {
        setBookingId(result.id);
        setCurrentStep(BookingStep.CONFIRMATION);
        toast({
          title: "Booking Created!",
          description: "Your booking has been successfully created.",
        });
      } else {
        throw new Error(result.error || "Booking creation failed");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoToBookings = () => {
    router.push("/bookings");
  };

  const handleBookAnother = () => {
    setCurrentStep(BookingStep.CALENDAR);
    setBookingData(null);
    setNotes("");
    setBookingId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Service Info Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{service.name}</CardTitle>
              <CardDescription className="text-lg mt-1">
                at {vendor.businessName}
              </CardDescription>
              <div className="flex items-center gap-4 mt-3">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {service.duration} minutes
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />${service.price}
                </Badge>
                <Badge variant="outline">{service.category}</Badge>
              </div>
            </div>
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          {service.description && (
            <p className="text-muted-foreground mt-4">{service.description}</p>
          )}
        </CardHeader>
      </Card>

      {/* Step Content */}
      {currentStep === BookingStep.CALENDAR && (
        <BookingCalendar
          serviceId={service._id}
          vendorId={vendor._id}
          service={service}
          onBookingSelect={handleCalendarSelect}
        />
      )}

      {currentStep === BookingStep.DETAILS && bookingData && (
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
            <CardDescription>
              Confirm your booking details and add any special notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Booking Summary */}
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span className="font-medium">{service.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span className="font-medium">
                    {format(bookingData.datetime, "EEEE, MMMM d, yyyy")} at{" "}
                    {format(bookingData.datetime, "h:mm a")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">
                    {service.duration} minutes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Staff:</span>
                  <span className="font-medium">
                    {bookingData.staffPreference === "any"
                      ? "Any available"
                      : "Specific staff selected"}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>Total:</span>
                  <span>${service.price}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Additional Notes (Optional)
              </label>
              <Textarea
                id="notes"
                placeholder="Any special requests or notes for your appointment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {notes.length}/500 characters
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleBackToCalendar}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Calendar
              </Button>
              <Button
                onClick={handleConfirmBooking}
                disabled={loading}
                className="flex-1"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm Booking
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === BookingStep.CONFIRMATION && bookingId && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
                <p className="text-muted-foreground mt-2">
                  Your booking has been successfully created and is pending
                  confirmation.
                </p>
              </div>

              {bookingData && (
                <div className="p-4 bg-muted rounded-lg max-w-md mx-auto">
                  <h3 className="font-semibold mb-2">Booking Details</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Booking ID:</strong> {bookingId}
                    </p>
                    <p>
                      <strong>Service:</strong> {service.name}
                    </p>
                    <p>
                      <strong>Date & Time:</strong>{" "}
                      {format(
                        bookingData.datetime,
                        "EEEE, MMMM d, yyyy 'at' h:mm a",
                      )}
                    </p>
                    <p>
                      <strong>Duration:</strong> {service.duration} minutes
                    </p>
                    <p>
                      <strong>Total:</strong> ${service.price}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center pt-4">
                <Button variant="outline" onClick={handleBookAnother}>
                  Book Another
                </Button>
                <Button onClick={handleGoToBookings}>View My Bookings</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
