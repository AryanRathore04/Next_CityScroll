"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Edit3,
  Copy,
  Trash2,
  Tag,
  TrendingUp,
  Users,
  DollarSign,
  Calendar as CalendarIcon,
  Percent,
  Gift,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CouponService } from "@/lib/coupon-service";

interface Coupon {
  _id: string;
  code: string;
  title: string;
  description?: string;
  type: "percentage" | "fixed_amount" | "free_service";
  value: number;
  minimumAmount?: number;
  maximumDiscount?: number;
  vendorId?: string;
  serviceCategories?: string[];
  maxUses?: number;
  maxUsesPerCustomer?: number;
  currentUses: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  firstTimeCustomersOnly?: boolean;
  usagePercentage: number;
  isCurrentlyValid: boolean;
}

interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  totalUsage: number;
  totalDiscount: number;
  popularCoupons: Array<{
    code: string;
    title: string;
    uses: number;
    discountGiven: number;
  }>;
}

export const CouponManagement: React.FC<{ vendorId?: string }> = ({
  vendorId,
}) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [selectedTab, setSelectedTab] = useState("coupons");

  const form = useForm({
    defaultValues: {
      code: "",
      title: "",
      description: "",
      type: "percentage" as "percentage" | "fixed_amount" | "free_service",
      value: 0,
      minimumAmount: "",
      maximumDiscount: "",
      serviceCategories: [] as string[],
      maxUses: "",
      maxUsesPerCustomer: 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
      firstTimeCustomersOnly: false,
    },
  });

  useEffect(() => {
    loadCouponsAndStats();
  }, [vendorId]);

  const loadCouponsAndStats = async () => {
    try {
      setLoading(true);

      // Load stats
      const statsResponse = await fetch(
        `/api/coupons/stats?${vendorId ? `vendorId=${vendorId}` : ""}`,
      );
      const statsData = await statsResponse.json();

      if (statsData.success) {
        setStats(statsData.data);
      }

      // Note: In a real implementation, you would load coupons from an API
      // For now, we'll use mock data
      const mockCoupons: Coupon[] = [
        {
          _id: "1",
          code: "WELCOME20",
          title: "20% Off First Booking",
          description: "Get 20% off your first salon visit",
          type: "percentage",
          value: 20,
          minimumAmount: 50,
          maximumDiscount: 25,
          maxUses: 100,
          maxUsesPerCustomer: 1,
          currentUses: 45,
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-12-31"),
          isActive: true,
          firstTimeCustomersOnly: true,
          usagePercentage: 45,
          isCurrentlyValid: true,
        },
        {
          _id: "2",
          code: "HAIRCUT50",
          title: "$50 Off Hair Services",
          description: "Fixed discount on hair services",
          type: "fixed_amount",
          value: 50,
          serviceCategories: ["haircut", "coloring"],
          maxUses: 50,
          maxUsesPerCustomer: 2,
          currentUses: 23,
          startDate: new Date("2024-02-01"),
          endDate: new Date("2024-03-31"),
          isActive: true,
          usagePercentage: 46,
          isCurrentlyValid: true,
        },
      ];

      setCoupons(mockCoupons);
    } catch (error) {
      console.error("Error loading coupons:", error);
      toast({
        title: "Error",
        description: "Failed to load coupons",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (data: any) => {
    try {
      setLoading(true);

      // Generate random code if not provided
      if (!data.code) {
        data.code = CouponService.generateCouponCode("SAVE", 8);
      }

      const response = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponData: {
            ...data,
            vendorId: vendorId || undefined,
            minimumAmount: data.minimumAmount
              ? parseInt(data.minimumAmount) * 100
              : undefined,
            maximumDiscount: data.maximumDiscount
              ? parseInt(data.maximumDiscount) * 100
              : undefined,
            maxUses: data.maxUses ? parseInt(data.maxUses) : undefined,
          },
          createdBy: vendorId || "admin", // Mock creator ID
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Coupon created successfully",
        });
        setShowCreateDialog(false);
        form.reset();
        loadCouponsAndStats();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error creating coupon:", error);
      toast({
        title: "Error",
        description: "Failed to create coupon",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = () => {
    const code = CouponService.generateCouponCode("SAVE");
    form.setValue("code", code);
  };

  const CouponCard = ({ coupon }: { coupon: Coupon }) => (
    <Card
      className={cn(
        "hover:shadow-md transition-shadow",
        !coupon.isCurrentlyValid && "opacity-60",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-mono">{coupon.code}</CardTitle>
            <p className="text-sm text-muted-foreground">{coupon.title}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant={coupon.isCurrentlyValid ? "default" : "secondary"}>
              {coupon.isCurrentlyValid ? "Active" : "Inactive"}
            </Badge>
            {coupon.firstTimeCustomersOnly && (
              <Badge variant="outline">First-Time</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {coupon.description && (
            <p className="text-sm text-muted-foreground">
              {coupon.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Type: </span>
              {coupon.type === "percentage"
                ? `${coupon.value}% off`
                : coupon.type === "fixed_amount"
                ? `$${coupon.value / 100} off`
                : "Free service"}
            </div>
            <div>
              <span className="font-medium">Usage: </span>
              {coupon.currentUses}/{coupon.maxUses || "∞"}
            </div>
            <div>
              <span className="font-medium">Valid until: </span>
              {format(new Date(coupon.endDate), "MMM dd, yyyy")}
            </div>
            {coupon.minimumAmount && (
              <div>
                <span className="font-medium">Min spend: </span>$
                {coupon.minimumAmount / 100}
              </div>
            )}
          </div>

          {coupon.maxUses && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Usage</span>
                <span>{coupon.usagePercentage}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${coupon.usagePercentage}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigator.clipboard.writeText(coupon.code)}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy Code
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditingCoupon(coupon)}
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const StatsCard = ({ title, value, icon: Icon, description }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );

  const CreateCouponDialog = () => (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Coupon
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleCreateCoupon)}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coupon Code</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="AUTO-GENERATED"
                          className="font-mono"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        size="sm"
                        onClick={generateRandomCode}
                      >
                        Generate
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">
                          Percentage Off
                        </SelectItem>
                        <SelectItem value="fixed_amount">
                          Fixed Amount Off
                        </SelectItem>
                        <SelectItem value="free_service">
                          Free Service
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., 20% Off First Booking"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Describe the offer..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {form.watch("type") === "percentage"
                        ? "Percentage (%)"
                        : form.watch("type") === "fixed_amount"
                        ? "Amount ($)"
                        : "Value"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minimumAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Spend ($)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder="0" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < form.watch("startDate")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Coupon"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Coupon Management</h2>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="coupons" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Coupons
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coupons" className="space-y-6">
          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Total Coupons"
                value={stats.totalCoupons}
                icon={Tag}
                description="All created coupons"
              />
              <StatsCard
                title="Active Coupons"
                value={stats.activeCoupons}
                icon={Gift}
                description="Currently valid"
              />
              <StatsCard
                title="Total Usage"
                value={stats.totalUsage}
                icon={Users}
                description="Times used"
              />
              <StatsCard
                title="Total Discount"
                value={`$${(stats.totalDiscount / 100).toLocaleString()}`}
                icon={DollarSign}
                description="Amount saved by customers"
              />
            </div>
          )}

          {/* Coupons Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {coupons.map((coupon) => (
              <CouponCard key={coupon._id} coupon={coupon} />
            ))}
          </div>

          {coupons.length === 0 && !loading && (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No coupons yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first coupon to start offering discounts to
                customers
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Coupon
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {stats && stats.popularCoupons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Popular Coupons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.popularCoupons.map((coupon, index) => (
                    <div
                      key={coupon.code}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <div>
                          <p className="font-medium font-mono">{coupon.code}</p>
                          <p className="text-sm text-muted-foreground">
                            {coupon.title}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{coupon.uses} uses</p>
                        <p className="text-sm text-muted-foreground">
                          ${(coupon.discountGiven / 100).toFixed(2)} saved
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(!stats || stats.popularCoupons.length === 0) && (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No analytics data yet
                </h3>
                <p className="text-muted-foreground">
                  Analytics will appear once customers start using your coupons
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <CreateCouponDialog />
    </div>
  );
};
