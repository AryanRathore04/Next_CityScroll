"use client";

import { AirbnbHeader } from "@/components/nav/airbnb-header";
import { BottomNav } from "@/components/nav/bottom-nav";
import { Calendar } from "lucide-react";

export default function BookingsPage() {
  return (
    <div className="min-h-screen bg-white">
      <AirbnbHeader />

      <main className="container mx-auto px-6 py-12">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-12 w-12 text-gray-400" />
          </div>

          <h1 className="text-2xl font-bold text-gray-700 mb-4">
            No trips booked...yet!
          </h1>

          <p className="text-gray-500 mb-8">
            Time to dust off your bags and start planning your next adventure.
          </p>
        </div>
      </main>

      <BottomNav activeTab="bookings" />
    </div>
  );
}
