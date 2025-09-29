import React from "react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications | CityScroll",
  description: "View and manage your notifications",
};

export default function NotificationsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground mt-2">
          Stay updated with your bookings, appointments, and important
          announcements
        </p>
      </div>

      <NotificationCenter />
    </div>
  );
}
