import { z } from "zod";

// User registration schema
export const registerSchema = z.object({
  email: z.string().email("Invalid email address").max(100),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  userType: z.enum(["customer", "vendor", "admin"]),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  businessName: z.string().max(100).optional(),
});

// User signin schema
export const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Vendor approval schema
export const vendorApprovalSchema = z.object({
  vendorId: z.string().min(1, "Vendor ID is required"),
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional(),
});

// Profile update schema
export const profileUpdateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  businessName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
});

// Service creation schema
export const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required").max(100),
  description: z.string().max(1000),
  price: z.number().min(0, "Price must be positive"),
  duration: z.number().min(15, "Minimum duration is 15 minutes").max(480),
  category: z.string().min(1, "Category is required"),
  isActive: z.boolean().default(true),
});

// Booking schema
export const bookingSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
  vendorId: z.string().min(1, "Vendor ID is required"),
  datetime: z.string().datetime("Invalid datetime format"),
  notes: z.string().max(500).optional(),
});

// Generic error response
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  details: z.any().optional(),
});

// Success response
export const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
});

// Validation helper function
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Invalid input data",
      };
    }
    return { success: false, error: "Validation failed" };
  }
}

// Sanitize string to prevent XSS
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>\"']/g, "") // Remove potentially dangerous characters
    .trim()
    .substring(0, 1000); // Limit length
}

// Sanitize object recursively
export function sanitizeObject(obj: any): any {
  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}
