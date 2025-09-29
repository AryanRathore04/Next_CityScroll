"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  MapPin,
  Star,
  Activity,
  Download,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
  subtitle,
}: MetricCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3" />;
      case "down":
        return <TrendingDown className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={`text-xs ${getTrendColor()} flex items-center mt-1`}>
            {getTrendIcon()}
            <span className="ml-1">
              {change > 0 ? "+" : ""}
              {change.toFixed(1)}% from last month
            </span>
          </p>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface AnalyticsDashboardProps {
  userType: "admin" | "vendor";
  vendorId?: string;
}

export function AnalyticsDashboard({
  userType,
  vendorId,
}: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [dateRange, setDateRange] = useState("30d");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const endpoint =
        userType === "admin"
          ? "/api/analytics/platform"
          : `/api/analytics/vendor${vendorId ? `?vendorId=${vendorId}` : ""}`;

      const params = new URLSearchParams({ range: dateRange });

      const response = await fetch(`${endpoint}?${params}`);
      const result = await response.json();

      if (result.success) {
        setAnalyticsData(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch analytics");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, userType, vendorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
        <span>Loading analytics...</span>
      </div>
    );
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Activity className="h-6 w-6 mr-2" />
            {userType === "admin" ? "Platform Analytics" : "Business Analytics"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights and performance metrics
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {analyticsData && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Revenue"
                value={`$${
                  analyticsData.revenue?.total?.toLocaleString() || 0
                }`}
                change={analyticsData.revenue?.growth || 0}
                trend={analyticsData.revenue?.growth > 0 ? "up" : "down"}
                icon={DollarSign}
              />

              <MetricCard
                title="Total Bookings"
                value={analyticsData.bookings?.total?.toLocaleString() || 0}
                change={analyticsData.bookings?.growth || 0}
                trend={analyticsData.bookings?.growth > 0 ? "up" : "down"}
                icon={Calendar}
              />

              <MetricCard
                title="Active Customers"
                value={analyticsData.customers?.total?.toLocaleString() || 0}
                subtitle={`${analyticsData.customers?.new || 0} new this month`}
                icon={Users}
              />

              {userType === "admin" ? (
                <MetricCard
                  title="Active Vendors"
                  value={analyticsData.vendors?.active?.toLocaleString() || 0}
                  subtitle={`${analyticsData.vendors?.verified || 0} verified`}
                  icon={MapPin}
                />
              ) : (
                <MetricCard
                  title="Average Rating"
                  value={analyticsData.ratings?.average?.toFixed(1) || "0.0"}
                  subtitle={`${analyticsData.ratings?.total || 0} reviews`}
                  icon={Star}
                />
              )}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Daily revenue over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.revenue?.daily || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#8884d8"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Booking Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Status</CardTitle>
                  <CardDescription>
                    Distribution by booking status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.bookings?.byStatus || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) =>
                          `${entry.name} ${(entry.percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(analyticsData.bookings?.byStatus || []).map(
                          (entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Performance Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Popular Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Popular Services</CardTitle>
                  <CardDescription>Top performing services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(analyticsData.services?.popular || [])
                      .slice(0, 5)
                      .map((service: any, index: number) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <Badge
                              variant="outline"
                              className="w-6 h-6 rounded-full p-0 flex items-center justify-center"
                            >
                              {index + 1}
                            </Badge>
                            <div>
                              <p className="font-medium">{service.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {service.bookings} bookings
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              ${service.revenue?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Geographic Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Locations</CardTitle>
                  <CardDescription>Revenue by geographic area</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(analyticsData.geography?.cities || [])
                      .slice(0, 5)
                      .map((location: any, index: number) => (
                        <div
                          key={location.city}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <Badge
                              variant="outline"
                              className="w-6 h-6 rounded-full p-0 flex items-center justify-center"
                            >
                              {index + 1}
                            </Badge>
                            <div>
                              <p className="font-medium">{location.city}</p>
                              <p className="text-sm text-muted-foreground">
                                {location.bookings} bookings
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              ${location.revenue?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            {/* Revenue specific charts and metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <MetricCard
                title="Gross Revenue"
                value={`$${
                  analyticsData.revenue?.total?.toLocaleString() || 0
                }`}
                icon={DollarSign}
              />
              <MetricCard
                title="This Month"
                value={`$${
                  analyticsData.revenue?.thisMonth?.toLocaleString() || 0
                }`}
                change={analyticsData.revenue?.growth || 0}
                trend={analyticsData.revenue?.growth > 0 ? "up" : "down"}
                icon={TrendingUp}
              />
              <MetricCard
                title="Average Order Value"
                value={`$${(
                  analyticsData.revenue?.total /
                    analyticsData.bookings?.total || 0
                ).toFixed(2)}`}
                icon={Activity}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
                <CardDescription>
                  Revenue performance over the last 12 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analyticsData.revenue?.monthly || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Bookings"
                value={analyticsData.bookings?.total?.toLocaleString() || 0}
                icon={Calendar}
              />
              <MetricCard
                title="This Month"
                value={analyticsData.bookings?.thisMonth?.toLocaleString() || 0}
                icon={Calendar}
              />
              <MetricCard
                title="Completion Rate"
                value={`${(
                  (analyticsData.bookings?.completed /
                    analyticsData.bookings?.total) *
                    100 || 0
                ).toFixed(1)}%`}
                icon={Activity}
              />
              <MetricCard
                title="Cancellation Rate"
                value={`${(
                  (analyticsData.bookings?.cancelled /
                    analyticsData.bookings?.total) *
                    100 || 0
                ).toFixed(1)}%`}
                icon={TrendingDown}
              />
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Customers"
                value={analyticsData.customers?.total?.toLocaleString() || 0}
                icon={Users}
              />
              <MetricCard
                title="Active Customers"
                value={analyticsData.customers?.active?.toLocaleString() || 0}
                icon={Users}
              />
              <MetricCard
                title="New Customers"
                value={analyticsData.customers?.new?.toLocaleString() || 0}
                icon={Users}
              />
              <MetricCard
                title="Retention Rate"
                value={`${(analyticsData.customers?.retention || 0).toFixed(
                  1,
                )}%`}
                icon={TrendingUp}
              />
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {userType === "vendor" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Performance</CardTitle>
                    <CardDescription>
                      Bookings and revenue trends
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analyticsData.trends?.daily || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar
                          yAxisId="left"
                          dataKey="bookings"
                          fill="#8884d8"
                          name="Bookings"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="revenue"
                          stroke="#82ca9d"
                          name="Revenue"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Rating Distribution</CardTitle>
                    <CardDescription>
                      Customer satisfaction breakdown
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count =
                          analyticsData.ratings?.distribution?.find(
                            (d: any) => d.rating === rating,
                          )?.count || 0;
                        const total = analyticsData.ratings?.total || 1;
                        const percentage = (count / total) * 100;

                        return (
                          <div
                            key={rating}
                            className="flex items-center space-x-3"
                          >
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">
                                {rating}
                              </span>
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-yellow-400 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
