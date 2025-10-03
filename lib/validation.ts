import { z } from "zod";
import { serverLogger as logger } from "./logger";

// Enhanced user registration schema with stronger validation
export const registerSchema = z.object({
  email: z.string().email("Invalid email address").max(100),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
    ),
  userType: z.enum(["customer", "vendor"]), // Remove admin from public registration
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")
    .regex(
      /^[A-Za-z\s'-]+$/,
      "First name can only contain letters, spaces, apostrophes, and hyphens",
    ),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters")
    .regex(
      /^[A-Za-z\s'-]+$/,
      "Last name can only contain letters, spaces, apostrophes, and hyphens",
    ),
  businessName: z.string().max(100).optional(),
  businessType: z.string().max(50).optional(),
  businessAddress: z.string().max(200).optional(),
  city: z.string().max(50).optional(),
  description: z.string().max(1000).optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
    .optional(),
});
// Note: Business details (businessName, businessType, etc.) are now collected
// during the onboarding wizard after signup, so they're truly optional here

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
  businessType: z.string().max(50).optional(),
  businessAddress: z
    .object({
      street: z.string().max(200).optional(),
      city: z.string().max(50).optional(),
      state: z.string().max(50).optional(),
      zipCode: z.string().max(10).optional(),
      coordinates: z
        .object({
          latitude: z.number().optional(),
          longitude: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
  phone: z.string().max(20).optional(),
  description: z.string().max(1000).optional(),
  amenities: z.array(z.string()).optional(),
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

// Enhanced validation helper with logging and sanitization
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Validation failed", {
        errors: error.issues,
        receivedData:
          typeof data === "object" ? Object.keys(data as object) : typeof data,
      });

      const errorMessages = error.issues.map((issue) => issue.message);
      return {
        success: false,
        error: errorMessages.join(", "),
      };
    }
    logger.error("Unexpected validation error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "Validation failed" };
  }
}

// Enhanced sanitization with comprehensive XSS protection
export function sanitizeString(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .replace(/[<>\"'&]/g, "") // Remove HTML/XML characters
    .replace(/javascript:/gi, "") // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .replace(/expression\s*\(/gi, "") // Remove CSS expressions
    .trim()
    .substring(0, 1000); // Limit length
}

// Deep sanitize object recursively with proper type handling
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  if (typeof obj === "number" || typeof obj === "boolean") {
    return obj;
  }

  if (obj instanceof Date) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject).slice(0, 100); // Limit array size
  }

  if (typeof obj === "object") {
    const sanitized: any = {};
    let propertyCount = 0;

    for (const [key, value] of Object.entries(obj)) {
      if (propertyCount >= 50) break; // Limit object properties

      const sanitizedKey = sanitizeString(key);
      if (sanitizedKey) {
        sanitized[sanitizedKey] = sanitizeObject(value);
        propertyCount++;
      }
    }
    return sanitized;
  }

  return obj;
}

// Break time schema for staff schedule
const breakTimeSchema = z.object({
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
});

// Day schedule schema
const dayScheduleSchema = z.object({
  isAvailable: z.boolean().default(true),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  breaks: z.array(breakTimeSchema).default([]),
});

// Staff creation schema - matches Staff model structure
export const staffCreationSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")
    .regex(
      /^[A-Za-z\s'-]+$/,
      "First name can only contain letters, spaces, apostrophes, and hyphens",
    ),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters")
    .regex(
      /^[A-Za-z\s'-]+$/,
      "Last name can only contain letters, spaces, apostrophes, and hyphens",
    ),
  email: z
    .string()
    .email("Invalid email address")
    .max(100, "Email must be less than 100 characters")
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
    .optional(),
  specialization: z.array(z.string()).default([]),
  services: z.array(z.string()).default([]), // Array of service IDs
  schedule: z
    .object({
      monday: dayScheduleSchema.optional(),
      tuesday: dayScheduleSchema.optional(),
      wednesday: dayScheduleSchema.optional(),
      thursday: dayScheduleSchema.optional(),
      friday: dayScheduleSchema.optional(),
      saturday: dayScheduleSchema.optional(),
      sunday: dayScheduleSchema.optional(),
    })
    .optional(),
  avatar: z.string().max(500).optional(),
  bio: z.string().max(1000).optional(),
  experience: z.number().min(0).max(50).optional(),
  hourlyRate: z.number().min(0).optional(),
  commission: z.number().min(0).max(100).optional(),
  vendorId: z.string().min(1).optional(), // Optional for admin use
});

// Staff update schema (all fields optional)
export const staffUpdateSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")
    .regex(
      /^[A-Za-z\s'-]+$/,
      "First name can only contain letters, spaces, apostrophes, and hyphens",
    )
    .optional(),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters")
    .regex(
      /^[A-Za-z\s'-]+$/,
      "Last name can only contain letters, spaces, apostrophes, and hyphens",
    )
    .optional(),
  email: z
    .string()
    .email("Invalid email address")
    .max(100, "Email must be less than 100 characters")
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
    .optional(),
  specialization: z.array(z.string()).optional(),
  services: z.array(z.string()).optional(),
  schedule: staffCreationSchema.shape.schedule.optional(),
  isActive: z.boolean().optional(),
  avatar: z.string().max(500).optional(),
  bio: z.string().max(1000).optional(),
  experience: z.number().min(0).max(50).optional(),
  hourlyRate: z.number().min(0).optional(),
  commission: z.number().min(0).max(100).optional(),
});

// Combined sanitization and validation function
export function sanitizeAndValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  try {
    // First sanitize the input data
    const sanitizedData = sanitizeObject(data);

    // Then validate with schema
    return validateInput(schema, sanitizedData);
  } catch (error) {
    logger.error("Sanitization error", {
      error: error instanceof Error ? error.message : String(error),
      dataType: typeof data,
    });
    return { success: false, error: "Data processing failed" };
  }
}

// Validation helper that works with Next.js API routes
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.parse(data);
  return result;
}
