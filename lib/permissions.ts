import { AuthorizationError } from "./errors";
import { serverLogger as logger } from "./logger";

// Define all permissions in the system
export const PERMISSIONS = {
  // Admin permissions
  MANAGE_USERS: "manage:users",
  APPROVE_VENDORS: "approve:vendors",
  VIEW_ALL_ANALYTICS: "view:all_analytics",
  MANAGE_PLATFORM_SETTINGS: "manage:platform_settings",
  VIEW_FINANCIAL_REPORTS: "view:financial_reports",
  PROCESS_PAYOUTS: "process:payouts",

  // Vendor permissions
  MANAGE_OWN_SERVICES: "manage:own_services",
  VIEW_OWN_BOOKINGS: "view:own_bookings",
  UPDATE_OWN_PROFILE: "update:own_profile",
  MANAGE_OWN_STAFF: "manage:own_staff",
  VIEW_OWN_ANALYTICS: "view:own_analytics",
  CREATE_COUPONS: "create:coupons",
  MANAGE_AVAILABILITY: "manage:availability",

  // Customer permissions
  CREATE_BOOKINGS: "create:bookings",
  VIEW_OWN_BOOKINGS_CUSTOMER: "view:own_bookings_customer",
  UPDATE_OWN_PROFILE_CUSTOMER: "update:own_profile_customer",
  CANCEL_OWN_BOOKINGS: "cancel:own_bookings",
  RESCHEDULE_OWN_BOOKINGS: "reschedule:own_bookings",

  // Shared permissions
  VIEW_PUBLIC_SERVICES: "view:public_services",
  VIEW_PUBLIC_VENDORS: "view:public_vendors",
};

// Define role-based permissions mapping
export const ROLE_PERMISSIONS = {
  admin: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.APPROVE_VENDORS,
    PERMISSIONS.VIEW_ALL_ANALYTICS,
    PERMISSIONS.MANAGE_PLATFORM_SETTINGS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.PROCESS_PAYOUTS,
    PERMISSIONS.VIEW_PUBLIC_SERVICES,
    PERMISSIONS.VIEW_PUBLIC_VENDORS,
  ],
  vendor: [
    PERMISSIONS.MANAGE_OWN_SERVICES,
    PERMISSIONS.VIEW_OWN_BOOKINGS,
    PERMISSIONS.UPDATE_OWN_PROFILE,
    PERMISSIONS.MANAGE_OWN_STAFF,
    PERMISSIONS.VIEW_OWN_ANALYTICS,
    PERMISSIONS.CREATE_COUPONS,
    PERMISSIONS.MANAGE_AVAILABILITY,
    PERMISSIONS.VIEW_PUBLIC_SERVICES,
    PERMISSIONS.VIEW_PUBLIC_VENDORS,
  ],
  customer: [
    PERMISSIONS.CREATE_BOOKINGS,
    PERMISSIONS.VIEW_OWN_BOOKINGS_CUSTOMER,
    PERMISSIONS.UPDATE_OWN_PROFILE_CUSTOMER,
    PERMISSIONS.CANCEL_OWN_BOOKINGS,
    PERMISSIONS.RESCHEDULE_OWN_BOOKINGS,
    PERMISSIONS.VIEW_PUBLIC_SERVICES,
    PERMISSIONS.VIEW_PUBLIC_VENDORS,
  ],
};

// Type definitions
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type UserRole = keyof typeof ROLE_PERMISSIONS;

/**
 * Check if a user has a specific permission based on their role
 */
export function hasPermission(
  userRole: UserRole,
  permission: Permission,
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if a user has multiple permissions
 */
export function hasAllPermissions(
  userRole: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.every((permission) => hasPermission(userRole, permission));
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  userRole: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(userRole, permission));
}

/**
 * Validate permission and throw error if not authorized
 */
export function validatePermission(
  userRole: UserRole,
  permission: Permission,
  userId?: string,
): void {
  if (!hasPermission(userRole, permission)) {
    logger.warn("Permission denied", {
      userRole,
      requiredPermission: permission,
      userId: userId || "unknown",
    });

    throw new AuthorizationError(
      `Access denied. Required permission: ${permission}`,
    );
  }
}

/**
 * Get all permissions for a user role
 */
export function getUserPermissions(userRole: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

/**
 * Check if a resource belongs to the user (for ownership-based permissions)
 */
export function validateResourceOwnership(
  resourceOwnerId: string,
  currentUserId: string,
  resourceType: string,
): void {
  if (resourceOwnerId !== currentUserId) {
    logger.warn("Resource ownership validation failed", {
      resourceOwnerId,
      currentUserId,
      resourceType,
    });

    throw new AuthorizationError(
      `Access denied. You can only access your own ${resourceType}`,
    );
  }
}
