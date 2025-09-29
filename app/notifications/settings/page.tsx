import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Mail,
  MessageSquare,
  Calendar,
  DollarSign,
  Settings,
  Save,
} from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notification Settings | CityScroll",
  description: "Manage your notification preferences",
};

export default function NotificationSettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Settings className="h-6 w-6 mr-2" />
          Notification Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure how and when you want to receive notifications
        </p>
      </div>

      <div className="space-y-6">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Email Notifications
            </CardTitle>
            <CardDescription>Receive notifications via email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-booking-confirmations" className="flex-1">
                Booking confirmations
              </Label>
              <Switch id="email-booking-confirmations" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-booking-reminders" className="flex-1">
                Booking reminders (24 hours before)
              </Label>
              <Switch id="email-booking-reminders" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-booking-cancellations" className="flex-1">
                Booking cancellations
              </Label>
              <Switch id="email-booking-cancellations" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-payment-confirmations" className="flex-1">
                Payment confirmations
              </Label>
              <Switch id="email-payment-confirmations" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-promotions" className="flex-1">
                Promotional offers and updates
              </Label>
              <Switch id="email-promotions" />
            </div>
          </CardContent>
        </Card>

        {/* SMS Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              SMS Notifications
            </CardTitle>
            <CardDescription>
              Receive notifications via text message
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-booking-confirmations" className="flex-1">
                Booking confirmations
              </Label>
              <Switch id="sms-booking-confirmations" />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="sms-booking-reminders" className="flex-1">
                Booking reminders (2 hours before)
              </Label>
              <Switch id="sms-booking-reminders" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="sms-urgent-updates" className="flex-1">
                Urgent updates (cancellations, changes)
              </Label>
              <Switch id="sms-urgent-updates" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* In-App Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              In-App Notifications
            </CardTitle>
            <CardDescription>
              Receive notifications within the app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="app-all-notifications" className="flex-1">
                All notifications
              </Label>
              <Switch id="app-all-notifications" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="app-desktop-notifications" className="flex-1">
                Browser/Desktop notifications
              </Label>
              <Switch id="app-desktop-notifications" />
            </div>
          </CardContent>
        </Card>

        {/* Notification Timing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Notification Timing
            </CardTitle>
            <CardDescription>
              Configure when you receive certain notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Booking Reminders</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="reminder-24h"
                    className="rounded"
                    defaultChecked
                  />
                  <Label htmlFor="reminder-24h" className="text-sm">
                    24 hours before
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="reminder-2h" className="rounded" />
                  <Label htmlFor="reminder-2h" className="text-sm">
                    2 hours before
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="reminder-30m"
                    className="rounded"
                  />
                  <Label htmlFor="reminder-30m" className="text-sm">
                    30 minutes before
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium">Quiet Hours</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Don't send notifications during these hours (except urgent ones)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quiet-start" className="text-sm">
                    From
                  </Label>
                  <input
                    type="time"
                    id="quiet-start"
                    defaultValue="22:00"
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="quiet-end" className="text-sm">
                    Until
                  </Label>
                  <input
                    type="time"
                    id="quiet-end"
                    defaultValue="08:00"
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button className="flex items-center">
            <Save className="h-4 w-4 mr-2" />
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
