"use client";

import React, { useCallback, useState, useEffect } from "react";
import { clientLogger as logger } from "@/lib/logger";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  theme?: { color: string };
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  amount: number;
  currency: string;
  key: string;
  bookingDetails: {
    serviceName: string;
    vendorName: string;
    datetime: string;
    baseAmount: number;
    platformFee: number;
    totalAmount: number;
  };
}

interface PaymentError extends Error {
  code?: string;
  reason?: string;
}

interface UseRazorpayReturn {
  processPayment: (bookingId: string) => Promise<void>;
  isProcessing: boolean;
  error: string | null;
  clearError: () => void;
}

// Declare Razorpay on window object
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, handler: (response: any) => void) => void;
    };
  }
}

export function useRazorpay(): UseRazorpayReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      // Check if Razorpay is already loaded
      if (typeof window.Razorpay !== "undefined") {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }, []);

  const createOrder = useCallback(
    async (bookingId: string): Promise<CreateOrderResponse> => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Please sign in to continue with payment");
      }

      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment order");
      }

      return await response.json();
    },
    [],
  );

  const verifyPayment = useCallback(
    async (
      paymentResponse: RazorpayResponse,
      bookingId: string,
    ): Promise<void> => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch("/api/payments/verify-signature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...paymentResponse,
          bookingId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Payment verification failed");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error("Payment verification failed");
      }
    },
    [],
  );

  const processPayment = useCallback(
    async (bookingId: string): Promise<void> => {
      if (isProcessing) {
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        // Load Razorpay script
        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded) {
          throw new Error("Failed to load payment gateway. Please try again.");
        }

        // Create order
        const orderData = await createOrder(bookingId);

        logger.info("Payment order created", {
          orderId: orderData.orderId,
          bookingId,
          amount: orderData.amount,
        });

        // Initialize Razorpay
        const options: RazorpayOptions = {
          key: orderData.key,
          amount: orderData.amount,
          currency: orderData.currency,
          order_id: orderData.orderId,
          name: "BeautyBook",
          description: `Payment for ${orderData.bookingDetails.serviceName}`,
          theme: {
            color: "#3b82f6", // Primary blue color
          },
          prefill: {
            name: "Customer", // Can be filled from user context
          },
          handler: async (response: RazorpayResponse) => {
            try {
              await verifyPayment(response, bookingId);

              logger.info("Payment completed successfully", {
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                bookingId,
              });

              // Redirect to success page
              window.location.href = `/booking-success?id=${bookingId}&paymentId=${response.razorpay_payment_id}`;
            } catch (error) {
              logger.error("Payment verification failed", {
                error: error instanceof Error ? error.message : String(error),
                paymentId: response.razorpay_payment_id,
                bookingId,
              });

              setError(
                error instanceof Error
                  ? error.message
                  : "Payment verification failed",
              );
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: () => {
              logger.info("Payment modal dismissed", { bookingId });
              setIsProcessing(false);
            },
          },
        };

        const razorpay = new window.Razorpay(options);

        // Handle payment failures
        razorpay.on("payment.failed", (response: any) => {
          logger.warn("Payment failed", {
            error: response.error,
            bookingId,
            orderId: orderData.orderId,
          });

          setError(
            response.error.description || "Payment failed. Please try again.",
          );
          setIsProcessing(false);
        });

        razorpay.open();
      } catch (error) {
        logger.error("Payment process failed", {
          error: error instanceof Error ? error.message : String(error),
          bookingId,
        });

        setError(
          error instanceof Error
            ? error.message
            : "Payment failed. Please try again.",
        );
        setIsProcessing(false);
      }
    },
    [isProcessing, loadRazorpayScript, createOrder, verifyPayment],
  );

  return {
    processPayment,
    isProcessing,
    error,
    clearError,
  };
}

// Helper hook to check if Razorpay is available
export function useRazorpayAvailable(): boolean {
  const [isAvailable, setIsAvailable] = useState(false);

  const checkAvailability = useCallback(() => {
    setIsAvailable(
      typeof window !== "undefined" && typeof window.Razorpay !== "undefined",
    );
  }, []);

  // Check on mount and when window loads
  useEffect(() => {
    checkAvailability();

    if (typeof window !== "undefined") {
      window.addEventListener("load", checkAvailability);
      return () => window.removeEventListener("load", checkAvailability);
    }
  }, [checkAvailability]);

  return isAvailable;
}
