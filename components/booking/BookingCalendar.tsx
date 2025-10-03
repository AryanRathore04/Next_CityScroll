"use client";

import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Users, Calendar as CalendarIcon } from "lucide-react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface Staff {
  _id: string;
  name: string;
  position: string;
  serviceIds: string[];
  isActive: boolean;
}

interface TimeSlot {
  time: string;
  available: boolean;
  staffId?: string;
}

interface Service {
  _id: string;
  name: string;
  duration: number;
  price: number;
}

interface BookingCalendarProps {
  serviceId: string;
  vendorId: string;
  service: Service;
  onBookingSelect: (booking: {
    datetime: Date;
    staffId?: string;
    staffPreference: "any" | "specific";
  }) => void;
  className?: string;
}

export function BookingCalendar({
  serviceId,
  vendorId,
  service,
  onBookingSelect,
  className,
}: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [staffPreference, setStaffPreference] = useState<"any" | "specific">(
    "any",
  );
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Fetch available staff for this service
  useEffect(() => {
    async function fetchStaff() {
      if (!serviceId || !vendorId) {
        console.log("Missing serviceId or vendorId:", { serviceId, vendorId });
        return;
      }

      setLoadingStaff(true);
      try {
        console.log("Fetching staff for vendor:", vendorId);

        const token = localStorage.getItem("accessToken");
        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
          console.log("Using auth token for staff request");
        } else {
          console.log("No auth token - public staff request");
        }

        const url = `/api/staff?vendorId=${vendorId}`;
        console.log("Fetching staff from:", url);

        const response = await fetch(url, { headers });

        console.log("Staff API response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to fetch staff:", response.status, errorText);
          // Continue without staff data - show message to user
          setAvailableStaff([]);
          setLoadingStaff(false);
          toast({
            title: "Staff Information Unavailable",
            description:
              "Continuing with booking. Staff will be assigned automatically.",
            variant: "default",
          });
          return;
        }

        const result = await response.json();
        if (result.success) {
          console.log("Staff data received:", result.data);
          // Filter staff who can perform this service
          const eligibleStaff = result.data
            .filter(
              (staff: any) =>
                staff.isActive &&
                (!staff.services ||
                  staff.services.length === 0 ||
                  staff.services.includes(serviceId)),
            )
            .map((staff: any) => ({
              _id: staff._id,
              name: `${staff.firstName} ${staff.lastName}`,
              position: staff.specialization?.[0] || "Staff",
              serviceIds: staff.services || [],
              isActive: staff.isActive,
            }));
          console.log("Eligible staff:", eligibleStaff);
          setAvailableStaff(eligibleStaff);
        }
      } catch (error) {
        console.error("Error fetching staff:", error);
        toast({
          title: "Error",
          description: "Failed to load available staff",
          variant: "destructive",
        });
      } finally {
        setLoadingStaff(false);
      }
    }

    fetchStaff();
  }, [serviceId, vendorId]);

  // Fetch available time slots when date or staff selection changes
  useEffect(() => {
    async function fetchTimeSlots() {
      if (!selectedDate) {
        setTimeSlots([]);
        return;
      }

      setLoading(true);
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");

        if (staffPreference === "specific" && selectedStaff) {
          // Fetch slots for specific staff member
          const response = await fetch(
            `/api/staff/${selectedStaff}/availability?date=${dateStr}&duration=${service.duration}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              },
            },
          );
          if (!response.ok) throw new Error("Failed to fetch availability");

          const result = await response.json();
          if (result.success) {
            const slots: TimeSlot[] = result.data.availableSlots.map(
              (time: string) => ({
                time,
                available: true,
                staffId: selectedStaff,
              }),
            );
            setTimeSlots(slots);
          }
        } else {
          // Fetch slots for any available staff
          const allSlots: TimeSlot[] = [];

          for (const staff of availableStaff) {
            try {
              const response = await fetch(
                `/api/staff/${staff._id}/availability?date=${dateStr}&duration=${service.duration}`,
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem(
                      "accessToken",
                    )}`,
                  },
                },
              );
              if (response.ok) {
                const result = await response.json();
                if (result.success && result.data.isAvailable) {
                  result.data.availableSlots.forEach((time: string) => {
                    if (!allSlots.some((slot) => slot.time === time)) {
                      allSlots.push({
                        time,
                        available: true,
                        staffId: staff._id,
                      });
                    }
                  });
                }
              }
            } catch (error) {
              console.error(
                `Error fetching slots for staff ${staff._id}:`,
                error,
              );
            }
          }

          // Sort slots by time
          allSlots.sort((a, b) => a.time.localeCompare(b.time));
          setTimeSlots(allSlots);
        }
      } catch (error) {
        console.error("Error fetching time slots:", error);
        toast({
          title: "Error",
          description: "Failed to load available time slots",
          variant: "destructive",
        });
        setTimeSlots([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTimeSlots();
  }, [
    selectedDate,
    selectedStaff,
    staffPreference,
    availableStaff,
    service.duration,
  ]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // Prevent selecting past dates
    if (isBefore(date, startOfDay(new Date()))) {
      toast({
        title: "Invalid Date",
        description: "Please select a future date",
        variant: "destructive",
      });
      return;
    }

    setSelectedDate(date);
    setSelectedTime(""); // Reset time selection
  };

  const handleStaffPreferenceChange = (preference: "any" | "specific") => {
    setStaffPreference(preference);
    setSelectedStaff("");
    setSelectedTime("");

    if (preference === "any") {
      setSelectedStaff("");
    }
  };

  const handleBookingConfirm = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Incomplete Selection",
        description: "Please select both date and time",
        variant: "destructive",
      });
      return;
    }

    // Parse the time
    const [hours, minutes] = selectedTime.split(":").map(Number);

    // Create a new date object with the selected date
    // Use the selected date at midnight in local timezone
    const bookingDateTime = new Date(selectedDate);

    // Set the time in local timezone
    bookingDateTime.setHours(hours, minutes, 0, 0);

    // Log for debugging
    console.log("Creating booking:", {
      selectedDate: selectedDate.toISOString(),
      selectedTime,
      bookingDateTime: bookingDateTime.toISOString(),
      bookingDateTimeLocal: bookingDateTime.toString(),
      now: new Date().toISOString(),
      isInFuture: bookingDateTime > new Date(),
    });

    // Verify the booking is in the future
    if (bookingDateTime <= new Date()) {
      toast({
        title: "Invalid Time",
        description: "Please select a future date and time",
        variant: "destructive",
      });
      return;
    }

    const bookingData = {
      datetime: bookingDateTime,
      staffId: staffPreference === "specific" ? selectedStaff : undefined,
      staffPreference,
    };

    onBookingSelect(bookingData);
  };

  const isBookingReady =
    selectedDate &&
    selectedTime &&
    (staffPreference === "any" ||
      (staffPreference === "specific" && selectedStaff));

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Select Date & Time
          </CardTitle>
          <CardDescription>
            Choose your preferred date and time for {service.name}(
            {service.duration} minutes, ${service.price})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Staff Preference Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Staff Preference</label>
            <Select
              value={staffPreference}
              onValueChange={handleStaffPreferenceChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Available Staff</SelectItem>
                <SelectItem value="specific">Choose Specific Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Specific Staff Selection */}
          {staffPreference === "specific" && (
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Select Staff Member
              </label>
              {loadingStaff ? (
                <div className="flex items-center gap-2 p-4 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading staff...</span>
                </div>
              ) : (
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStaff.map((staff) => (
                      <SelectItem key={staff._id} value={staff._id}>
                        <div className="flex items-center gap-2">
                          <span>{staff.name}</span>
                          <Badge variant="outline">{staff.position}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Calendar */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Date</label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => isBefore(date, startOfDay(new Date()))}
              className="rounded-md border"
            />
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Available Times for {format(selectedDate, "EEEE, MMMM d")}
              </label>

              {loading ? (
                <div className="flex items-center gap-2 p-4 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading available times...</span>
                </div>
              ) : timeSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={
                        selectedTime === slot.time ? "default" : "outline"
                      }
                      size="sm"
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className="h-10"
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="p-4 border rounded-md bg-muted">
                  <p className="text-sm text-muted-foreground">
                    No available time slots for this date. Please try another
                    date.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Booking Confirmation */}
          {isBookingReady && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ready to book:</p>
                  <p className="text-sm text-muted-foreground">
                    {format(selectedDate!, "EEEE, MMMM d")} at {selectedTime}
                    {staffPreference === "specific" && selectedStaff && (
                      <span>
                        {" "}
                        with{" "}
                        {
                          availableStaff.find((s) => s._id === selectedStaff)
                            ?.name
                        }
                      </span>
                    )}
                  </p>
                </div>
                <Button onClick={handleBookingConfirm}>
                  Continue to Booking
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
