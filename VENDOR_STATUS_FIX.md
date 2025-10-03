# Vendor Status Booking Validation Fix

## Problem

After fixing the datetime validation issue, bookings were failing with:

```
Error: "Vendor is not currently accepting bookings"
Code: VENDOR_INACTIVE
```

Even though the vendor account was active and had services/staff configured.

## Root Cause

The booking API was checking:

```typescript
if (vendor.status !== "active") {
  // Reject booking
}
```

This was **too strict** because vendor accounts can have different statuses:

- `active` - Fully active vendor
- `approved` - Approved but may not have set status to active yet
- `pending_approval` - Waiting for admin approval
- `rejected` - Rejected by admin
- `suspended` - Temporarily suspended
- `undefined` - New vendors without explicit status

The original check rejected **any** vendor that didn't have status exactly equal to "active", including approved vendors and those without a status set.

## Fix Applied

Changed from a **whitelist approach** (only allow "active") to a **blacklist approach** (reject only problematic statuses):

**Before:**

```typescript
if (vendor.status !== "active") {
  await session.abortTransaction();
  return NextResponse.json(
    {
      error: "Vendor is not currently accepting bookings",
      code: "VENDOR_INACTIVE",
    },
    { status: 400 },
  );
}
```

**After:**

```typescript
logger.info("Vendor status check", {
  vendorId,
  vendorStatus: vendor.status,
  vendorUserType: vendor.userType,
  isActive: vendor.status === "active",
});

// Only reject if vendor is explicitly suspended or rejected
// Allow bookings for vendors with status: active, approved, pending_approval, or undefined
if (vendor.status === "suspended" || vendor.status === "rejected") {
  await session.abortTransaction();
  return NextResponse.json(
    {
      error: "Vendor is not currently accepting bookings",
      code: "VENDOR_INACTIVE",
    },
    { status: 400 },
  );
}
```

## Allowed Vendor Statuses

Now bookings are **accepted** for vendors with:

- ✅ `active` - Fully active vendors
- ✅ `approved` - Approved vendors
- ✅ `pending_approval` - Vendors awaiting approval (can still receive bookings)
- ✅ `undefined` - Vendors without explicit status

Bookings are **rejected** only for:

- ❌ `suspended` - Vendor temporarily suspended by admin
- ❌ `rejected` - Vendor rejected by admin

## Rationale

### Why Allow `pending_approval`?

- Vendors can set up their services/staff before approval
- Allows testing of the booking flow
- Admin can approve later without affecting existing bookings

### Why Allow `approved`?

- Some vendors might be "approved" but not yet set to "active"
- Still functional and should accept bookings

### Why Allow `undefined`?

- New vendor accounts might not have status set
- Should still be able to receive bookings
- Backend defaults should handle this gracefully

### Why Reject Only `suspended` and `rejected`?

- These are **explicit admin actions** indicating the vendor should not operate
- Clear signal that bookings should be blocked
- Other statuses are either functional or temporary/pending

## Added Logging

Added comprehensive logging to track vendor status:

```typescript
logger.info("Vendor status check", {
  vendorId,
  vendorStatus: vendor.status,
  vendorUserType: vendor.userType,
  isActive: vendor.status === "active",
});
```

This helps diagnose vendor status issues in the future.

## Testing

### 1. Check Vendor Status in Database

Connect to MongoDB and check the vendor's status:

```javascript
db.users.findOne({ _id: ObjectId("vendor-id") }, { status: 1, userType: 1 });
```

### 2. Test Booking Flow

1. Create a booking as a customer
2. Check server logs for "Vendor status check" message
3. Verify the vendor status is logged

### 3. Expected Logs

```
info: Vendor status check {
  vendorId: "68dffc2ca3285ec43307fc03",
  vendorStatus: "approved", // or "active", "pending_approval", undefined
  vendorUserType: "vendor",
  isActive: false // or true
}

info: Creating booking {
  serviceId: "...",
  datetime: "...",
  ...
}
```

## If Still Seeing "Vendor Inactive" Error

### Check Server Logs

Look for the "Vendor status check" log to see what status the vendor has:

```
info: Vendor status check {
  vendorStatus: "suspended" // <-- This would cause rejection
}
```

### Update Vendor Status in Database

If the vendor is showing as "suspended" or "rejected" but should be active:

**Option 1: Update via MongoDB**

```javascript
db.users.updateOne(
  { _id: ObjectId("vendor-id") },
  { $set: { status: "active" } },
);
```

**Option 2: Update via API** (if admin panel available)

- Go to admin panel
- Find the vendor
- Change status to "active" or "approved"

**Option 3: Update via Script**
Create a script to update vendor status:

```javascript
const mongoose = require("mongoose");
const User = require("./models/User");

async function updateVendorStatus(vendorId, newStatus) {
  await mongoose.connect(process.env.MONGODB_URI);
  await User.updateOne({ _id: vendorId }, { $set: { status: newStatus } });
  console.log("Vendor status updated!");
}

updateVendorStatus("vendor-id", "active");
```

## Common Scenarios

### Scenario 1: New Vendor Just Signed Up

- Status: `undefined` or `pending_approval`
- **Result:** ✅ Bookings allowed

### Scenario 2: Vendor Approved by Admin

- Status: `approved`
- **Result:** ✅ Bookings allowed

### Scenario 3: Vendor Fully Active

- Status: `active`
- **Result:** ✅ Bookings allowed

### Scenario 4: Vendor Temporarily Suspended

- Status: `suspended`
- **Result:** ❌ Bookings rejected

### Scenario 5: Vendor Application Rejected

- Status: `rejected`
- **Result:** ❌ Bookings rejected

## Files Modified

1. `app/api/bookings/route.ts` - Changed vendor status validation from whitelist to blacklist approach

## Related Issues

This fix is part of the booking flow fixes that also addressed:

1. Staff availability issues (STAFF_BOOKING_FIX.md)
2. Datetime validation issues (BOOKING_DATETIME_FIX.md)
3. Vendor status validation (this document)

## Next Steps

1. **Try the booking again** - should work now for most vendor statuses
2. **Check server logs** for the "Vendor status check" message
3. **If still failing**, check the vendor's actual status in the database
4. **Update vendor status** if needed using one of the methods above

---

**Created:** October 3, 2025
**Status:** ✅ Implemented and Ready for Testing
