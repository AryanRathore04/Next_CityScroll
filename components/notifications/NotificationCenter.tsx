"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Mail,
  MessageSquare,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

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

interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  page: number;
  limit: number;
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

const NOTIFICATION_COLORS = {
  booking_confirmation: "bg-green-100 text-green-800",
  booking_reminder: "bg-yellow-100 text-yellow-800",
  booking_cancellation: "bg-red-100 text-red-800",
  booking_status_update: "bg-blue-100 text-blue-800",
  payment_confirmation: "bg-green-100 text-green-800",
  staff_assignment: "bg-purple-100 text-purple-800",
  vendor_approval: "bg-emerald-100 text-emerald-800",
  system_announcement: "bg-gray-100 text-gray-800",
};

export function NotificationCenter({ className }: { className?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = async (pageNum = 1, filterType?: string) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
      });

      if (filterType === "unread") {
        params.set("unreadOnly", "true");
      } else if (filterType && filterType !== "all") {
        params.set("types", filterType);
      }

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) throw new Error("Failed to fetch notifications");

      const result = await response.json();
      if (result.success) {
        const data: NotificationResponse = result.data;

        if (pageNum === 1) {
          setNotifications(data.notifications);
        } else {
          setNotifications((prev) => [...prev, ...data.notifications]);
        }

        setUnreadCount(data.unreadCount);
        setHasMore(data.notifications.length === 20); // If we got 20, there might be more
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
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

        toast({
          title: "Marked as read",
          description: "Notification marked as read",
        });
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

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1, activeTab);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
    setNotifications([]);
    fetchNotifications(1, tab);
  };

  useEffect(() => {
    fetchNotifications(1, "all");
  }, []);

  const getNotificationIcon = (type: string) => {
    const IconComponent =
      NOTIFICATION_ICONS[type as keyof typeof NOTIFICATION_ICONS] || Bell;
    return <IconComponent className="h-4 w-4" />;
  };

  const getNotificationColor = (type: string) => {
    return (
      NOTIFICATION_COLORS[type as keyof typeof NOTIFICATION_COLORS] ||
      "bg-gray-100 text-gray-800"
    );
  };

  const formatNotificationType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-2 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          Stay updated with your bookings and important announcements
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="booking_confirmation,booking_reminder,booking_cancellation">
              Bookings
            </TabsTrigger>
            <TabsTrigger value="system_announcement">System</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <ScrollArea className="h-[400px] w-full">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading notifications...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center p-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Notifications</h3>
                  <p className="text-muted-foreground">
                    {activeTab === "unread"
                      ? "You're all caught up! No unread notifications."
                      : "No notifications to show yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <Card
                      key={notification._id}
                      className={`p-3 transition-colors cursor-pointer hover:bg-muted/50 ${
                        notification.status === "read"
                          ? "opacity-75"
                          : "border-l-4 border-l-blue-500"
                      }`}
                      onClick={() => {
                        if (notification.status !== "read") {
                          markAsRead(notification._id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between space-x-3">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold">
                                {notification.title}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getNotificationColor(
                                    notification.type,
                                  )}`}
                                >
                                  {formatNotificationType(notification.type)}
                                </Badge>
                                {notification.status !== "read" && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                )}
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>

                            {notification.data?.bookingId && (
                              <p className="text-xs text-muted-foreground">
                                Booking: {notification.data.bookingId}
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-1">
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(
                                  new Date(notification.createdAt),
                                  { addSuffix: true },
                                )}
                              </p>

                              {notification.status === "read" &&
                                notification.readAt && (
                                  <p className="text-xs text-muted-foreground flex items-center">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Read{" "}
                                    {format(
                                      new Date(notification.readAt),
                                      "MMM d, h:mm a",
                                    )}
                                  </p>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {hasMore && (
                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={loading}
                      >
                        {loading && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Load More
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
