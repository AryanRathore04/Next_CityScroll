"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tag,
  Percent,
  DollarSign,
  Gift,
  Check,
  X,
  Sparkles,
  Calendar,
  Users,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  CouponService,
  type CouponValidationResult,
} from "@/lib/coupon-service";
import { format } from "date-fns";

interface BookingDetails {
  vendorId: string;
  serviceId: string;
  datetime: Date;
  totalPrice: number;
  service?: { category: string };
}

interface AvailableCoupon {
  _id: string;
  code: string;
  title: string;
  description?: string;
  type: "percentage" | "fixed_amount" | "free_service";
  value: number;
  minimumAmount?: number;
  maximumDiscount?: number;
  endDate: Date;
  firstTimeCustomersOnly?: boolean;
  serviceCategories?: string[];
}

interface CouponApplicationProps {
  customerId: string;
  bookingDetails: BookingDetails;
  onCouponApplied?: (coupon: any, discountAmount: number) => void;
  onCouponRemoved?: () => void;
  appliedCoupon?: { code: string; discountAmount: number } | null;
}

export const CouponApplication: React.FC<CouponApplicationProps> = ({
  customerId,
  bookingDetails,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon,
}) => {
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>(
    [],
  );
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);
  const [validationResult, setValidationResult] =
    useState<CouponValidationResult | null>(null);

  useEffect(() => {
    loadAvailableCoupons();
  }, [customerId, bookingDetails.vendorId]);

  const loadAvailableCoupons = async () => {
    try {
      const serviceCategory = bookingDetails.service?.category;
      const response = await fetch(
        `/api/coupons?customerId=${customerId}&vendorId=${
          bookingDetails.vendorId
        }${serviceCategory ? `&serviceCategory=${serviceCategory}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        setAvailableCoupons(data.data.coupons);
      }
    } catch (error) {
      console.error("Error loading available coupons:", error);
    }
  };

  const validateCoupon = async (code: string) => {
    if (!code.trim()) {
      setValidationResult(null);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          couponCode: code,
          customerId,
          bookingDetails,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setValidationResult(data.data);
        if (data.data.valid) {
          toast({
            title: "Coupon valid!",
            description: `You'll save $${(
              data.data.discountAmount / 100
            ).toFixed(2)}`,
          });
        } else {
          toast({
            title: "Coupon not valid",
            description: data.data.reason,
            variant: "destructive",
          });
        }
      } else {
        setValidationResult({
          valid: false,
          reason: data.error,
        });
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      toast({
        title: "Error",
        description: "Failed to validate coupon",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async () => {
    if (
      !validationResult?.valid ||
      !validationResult.coupon ||
      !validationResult.discountAmount
    ) {
      return;
    }

    try {
      setLoading(true);

      // In a real implementation, you would apply the coupon when booking is confirmed
      // For now, we'll just call the callback
      onCouponApplied?.(
        validationResult.coupon,
        validationResult.discountAmount,
      );

      toast({
        title: "Coupon applied!",
        description: `You saved $${(
          validationResult.discountAmount / 100
        ).toFixed(2)}`,
      });

      setCouponCode(validationResult.coupon.code);
      setValidationResult(null);
    } catch (error) {
      console.error("Error applying coupon:", error);
      toast({
        title: "Error",
        description: "Failed to apply coupon",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    onCouponRemoved?.();
    setCouponCode("");
    setValidationResult(null);
    toast({
      title: "Coupon removed",
      description: "Coupon has been removed from your booking",
    });
  };

  const selectCoupon = (coupon: AvailableCoupon) => {
    setCouponCode(coupon.code);
    validateCoupon(coupon.code);
    setShowAvailableCoupons(false);
  };

  const CouponCard = ({ coupon }: { coupon: AvailableCoupon }) => {
    const discountText =
      coupon.type === "percentage"
        ? `${coupon.value}% OFF`
        : coupon.type === "fixed_amount"
        ? `$${coupon.value / 100} OFF`
        : "FREE SERVICE";

    const estimatedSavings =
      coupon.type === "percentage"
        ? Math.min(
            (bookingDetails.totalPrice * coupon.value) / 100,
            coupon.maximumDiscount || Infinity,
          )
        : coupon.type === "fixed_amount"
        ? Math.min(coupon.value, bookingDetails.totalPrice)
        : bookingDetails.totalPrice;

    return (
      <Card
        className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/50"
        onClick={() => selectCoupon(coupon)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" className="text-lg px-3 py-1">
                  {discountText}
                </Badge>
                {coupon.firstTimeCustomersOnly && (
                  <Badge variant="outline" className="text-xs">
                    First-Time
                  </Badge>
                )}
              </div>
              <h4 className="font-semibold text-sm">{coupon.title}</h4>
              {coupon.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {coupon.description}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-600">
                Save ${(estimatedSavings / 100).toFixed(2)}
              </p>
            </div>
          </div>

          <Separator className="my-3" />

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Code:</span>
              <code className="font-mono bg-muted px-2 py-1 rounded">
                {coupon.code}
              </code>
            </div>
            {coupon.minimumAmount && (
              <div className="flex justify-between">
                <span>Min spend:</span>
                <span>${coupon.minimumAmount / 100}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Valid until:</span>
              <span>{format(new Date(coupon.endDate), "MMM dd, yyyy")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tag className="h-5 w-5" />
            Apply Coupon
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {!appliedCoupon ? (
            <>
              {/* Coupon Code Input */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      if (e.target.value === "") {
                        setValidationResult(null);
                      }
                    }}
                    onBlur={() => validateCoupon(couponCode)}
                    className="font-mono"
                  />

                  {/* Validation Result */}
                  {validationResult && (
                    <div
                      className={`mt-2 p-2 rounded text-sm flex items-center gap-2 ${
                        validationResult.valid
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {validationResult.valid ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>
                            Valid! You'll save $
                            {(validationResult.discountAmount! / 100).toFixed(
                              2,
                            )}
                          </span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4" />
                          <span>{validationResult.reason}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => validateCoupon(couponCode)}
                  disabled={loading || !couponCode.trim()}
                >
                  {loading ? "Checking..." : "Apply"}
                </Button>
              </div>

              {/* Apply Button for Valid Coupons */}
              {validationResult?.valid && (
                <Button
                  onClick={applyCoupon}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Apply Coupon - Save $
                  {(validationResult.discountAmount! / 100).toFixed(2)}
                </Button>
              )}

              {/* Available Coupons Button */}
              {availableCoupons.length > 0 && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowAvailableCoupons(true)}
                    className="text-sm"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    View Available Coupons ({availableCoupons.length})
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Applied Coupon Display */
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">
                      Coupon Applied!
                    </p>
                    <p className="text-sm text-green-600">
                      Code:{" "}
                      <code className="font-mono bg-green-100 px-2 py-1 rounded">
                        {appliedCoupon.code}
                      </code>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    -${(appliedCoupon.discountAmount / 100).toFixed(2)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeCoupon}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Coupons Dialog */}
      <Dialog
        open={showAvailableCoupons}
        onOpenChange={setShowAvailableCoupons}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Available Coupons
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {availableCoupons.length > 0 ? (
              <div className="grid gap-3">
                {availableCoupons.map((coupon) => (
                  <CouponCard key={coupon._id} coupon={coupon} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No coupons available
                </h3>
                <p className="text-muted-foreground">
                  No coupons are currently available for this booking
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowAvailableCoupons(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
