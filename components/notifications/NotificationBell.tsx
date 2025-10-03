"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  MessageSquare,
  Settings,
  Eye,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  status: "pending" | "sent" | "delivered" | "failed" | "read";
  data?: Record<string, any>;
  createdAt: string;
  readAt?: string;
}

const NOTIFICATION_ICONS = {
  booking_confirmation: Calendar,
  booking_reminder: Clock,
  booking_cancellation: Calendar,
  booking_status_update: Calendar,
  payment_confirmation: DollarSign,
  staff_assignment: MessageSquare,
  vendor_approval: CheckCircle,
  system_announcement: Bell,
};

export function NotificationBell({ className }: { className?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchRecentNotifications = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        // User not logged in, skip fetching
        setLoading(false);
        return;
      }

      const response = await fetch(
        "/api/notifications?limit=5&unreadOnly=false",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Failed to fetch notifications (${response.status})`,
        );
      }

      const result = await response.json();
      if (result.success) {
        setNotifications(result.data.notifications || []);
        setUnreadCount(result.data.unreadCount || 0);
      }
    } catch (error) {
      console.error(
        "Error fetching notifications:",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to mark as read");

      const result = await response.json();
      if (result.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId
              ? { ...notif, status: "read", readAt: new Date().toISOString() }
              : notif,
          ),
        );

        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    const IconComponent =
      NOTIFICATION_ICONS[type as keyof typeof NOTIFICATION_ICONS] || Bell;
    return <IconComponent className="h-4 w-4" />;
  };

  // Fetch notifications when component mounts and when dropdown opens
  useEffect(() => {
    fetchRecentNotifications();
  }, []);

  useEffect(() => {
    if (open) {
      fetchRecentNotifications();
    }
  }, [open]);

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchRecentNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={`relative ${className}`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 text-xs p-0 flex items-center justify-center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">
            Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={5}>
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Notifications</CardTitle>
              <div className="flex items-center space-x-1">
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} new
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  asChild
                >
                  <Link href="/notifications">
                    <Eye className="h-3 w-3 mr-1" />
                    View All
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {loading ? (
                <div className="flex items-center justify-center p-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center p-6">
                  <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No notifications yet
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                        notification.status === "read" ? "opacity-75" : ""
                      }`}
                      onClick={() => {
                        if (notification.status !== "read") {
                          markAsRead(notification._id);
                        }
                        setOpen(false);
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5 text-muted-foreground">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium line-clamp-1">
                              {notification.title}
                            </p>
                            {notification.status !== "read" && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              { addSuffix: true },
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <DropdownMenuSeparator />

            <div className="p-3">
              <div className="flex items-center justify-between space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  asChild
                >
                  <Link href="/notifications">View All Notifications</Link>
                </Button>

                <Button variant="ghost" size="sm" className="px-2" asChild>
                  <Link href="/notifications/settings">
                    <Settings className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
