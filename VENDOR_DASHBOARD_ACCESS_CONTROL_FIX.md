# Vendor Dashboard Access Control Fix

## Issue

**Error:** "Authentication required" when trying to add staff from vendor dashboard

**Root Cause:**

- Customer accounts were able to access the vendor dashboard page
- The page didn't have proper user type validation
- When customers tried to use vendor-only features (like adding staff), the API correctly rejected them with 401 Unauthorized

**Logs showing the problem:**

```
userType: 'customer'  ← Customer logged in
POST /api/staff 401 in 99ms  ← API rejected customer
🔴 [MIDDLEWARE] Invalid or expired access token
```

## Solution Implemented

Added multi-layer access control to the vendor dashboard:

### 1. **Early Redirect in useEffect**

When the page loads and detects a customer user:

- Shows alert message explaining the restriction
- Redirects to home page immediately
- Prevents any vendor operations

```tsx
// Redirect customers to home page
if (user.userType === "customer") {
  console.log(
    "⚠️ [DASHBOARD] Customer trying to access vendor dashboard, redirecting...",
  );
  alert(
    "This page is only accessible to vendors. Please sign up as a vendor to access this feature.",
  );
  router.push("/" as Route);
  return;
}

// Only allow vendors and admins
if (user.userType !== "vendor" && user.userType !== "admin") {
  console.log("⚠️ [DASHBOARD] Unauthorized user type:", user.userType);
  router.push("/signin" as Route);
  return;
}
```

### 2. **UI-Level Access Control**

Added a visual "Access Denied" page for non-vendor users:

- Shows clear error message
- Provides helpful actions:
  - Button to go back home
  - Button to sign up as vendor
- Prevents rendering of any vendor dashboard content

```tsx
// Check if user is authorized (vendor or admin only)
if (user && user.userType !== "vendor" && user.userType !== "admin") {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-card rounded-2xl shadow-lg border border-border p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto h-20 w-20 bg-orange-500/10 rounded-full flex items-center justify-center">
            <XCircle className="h-10 w-10 text-orange-500" />
          </div>
        </div>

        <h1 className="text-3xl font-heading text-foreground mb-4">
          Access Denied
        </h1>

        <p className="text-muted-foreground mb-6">
          This page is only accessible to vendors. Please sign up as a vendor to
          access the vendor dashboard.
        </p>

        <div className="flex gap-3 justify-center">
          <Button onClick={() => router.push("/" as Route)}>Go to Home</Button>
          <Button
            variant="outline"
            onClick={() => router.push("/signup" as Route)}
          >
            Sign Up as Vendor
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## User Flow After Fix

### Before Fix

1. Customer logs in
2. Somehow navigates to `/vendor-dashboard`
3. Page loads and shows vendor UI
4. Customer tries to add staff
5. ❌ API returns 401 error
6. Console error appears

### After Fix

1. Customer logs in
2. Navigates to `/vendor-dashboard`
3. Page loads and immediately checks user type
4. ✅ Shows "Access Denied" page with helpful message
5. ✅ Customer can click "Go to Home" or "Sign Up as Vendor"
6. No confusing errors or broken functionality

## Benefits

### 1. Better Security

- Prevents unauthorized access at page level
- Customers can't even see vendor-only UI
- Reduces unnecessary API calls

### 2. Improved User Experience

- Clear error message explaining why access is denied
- Helpful call-to-action buttons
- No confusing 401 errors in console

### 3. Proper Access Control Layers

```
Layer 1: useEffect redirect (immediate)
    ↓
Layer 2: UI-level check (visual feedback)
    ↓
Layer 3: API-level check (backend security)
```

## Testing Checklist

- [x] Customer trying to access vendor dashboard gets "Access Denied" page
- [x] Customer sees helpful message and action buttons
- [x] Vendors can still access vendor dashboard normally
- [x] Admins can access vendor dashboard
- [x] Staff creation works for vendors
- [x] No TypeScript compilation errors
- [x] Proper redirect flow for unauthorized users

## File Modified

**`app/vendor-dashboard/page.tsx`**

- Added customer redirect in `checkOnboardingStatus()`
- Added unauthorized user type check
- Added "Access Denied" UI component
- Added userType validation for vendor/admin only

## Related API Endpoints

These endpoints already have proper authentication:

- `POST /api/staff` - Requires vendor or admin
- `GET /api/staff` - Requires vendor or admin
- `PUT /api/staff/[id]` - Requires vendor or admin
- `DELETE /api/staff/[id]` - Requires vendor or admin

The API layer is secure - this fix ensures the frontend matches that security.

## How to Test

### Test Case 1: Customer Access

1. Log in as a customer
2. Navigate to `/vendor-dashboard`
3. ✅ Should see "Access Denied" page
4. ✅ Should have buttons to go home or sign up as vendor

### Test Case 2: Vendor Access

1. Log in as a vendor
2. Navigate to `/vendor-dashboard`
3. ✅ Should see vendor dashboard normally
4. ✅ Should be able to add staff members
5. ✅ Should be able to manage services, bookings, etc.

### Test Case 3: Admin Access

1. Log in as an admin
2. Navigate to `/vendor-dashboard`
3. ✅ Should see vendor dashboard
4. ✅ Should have admin-level access

## Future Enhancements

Consider adding:

1. **Route Guards** - Middleware to check auth before page loads
2. **Role-Based Routing** - Separate routes for different user types
3. **Permission System** - More granular access control
4. **Audit Logging** - Track unauthorized access attempts
5. **Rate Limiting** - Prevent brute force access attempts

## Notes

- The API endpoints were already secure
- This fix adds frontend protection to match backend security
- No database changes required
- Backward compatible with existing vendor accounts
- Improves overall security posture of the application
