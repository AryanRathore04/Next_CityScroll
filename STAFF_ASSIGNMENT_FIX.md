# Staff Assignment Fix - Field Name Mismatch

## Problem

After fixing vendor status validation, bookings were failing with:

```
Error: "No staff members available at this time"
Code: NO_STAFF_AVAILABLE
```

Even though:

- Staff members were added to the system
- Staff had schedules configured
- Staff were marked as active
- The booking time was valid

## Root Cause

### Field Name Mismatch

The Staff model uses `services` field (array of service IDs), but the booking API was looking for `serviceIds`:

**Staff Model (`models/Staff.ts`):**

```typescript
export interface IStaff extends Document {
  services: string[]; // ✅ Correct field name
  // ... other fields
}
```

**Booking API (BEFORE fix):**

```typescript
// ❌ Wrong field name
const availableStaffMembers = await Staff.find({
  vendorId: vendorId,
  $or: [
    { serviceIds: { $size: 0 } },  // ❌ Should be 'services'
    { serviceIds: serviceId },      // ❌ Should be 'services'
  ],
});

// ❌ Wrong field name in validation
if (assignedStaff.serviceIds && assignedStaff.serviceIds.length > 0) {
  const canPerformService = assignedStaff.serviceIds.some(...);
}
```

This caused the query to:

1. Not find any staff members (because `serviceIds` field doesn't exist)
2. Return empty array
3. Fail with "No staff members available"

### Missing Filters

The staff search was also missing:

- `isActive: true` filter (should only search active staff)
- Detailed logging to debug the search process

## Fixes Applied

### 1. Fixed Field Names (`app/api/bookings/route.ts`)

**Changed `serviceIds` → `services` throughout:**

```typescript
// ✅ Fixed specific staff validation
if (assignedStaff.services && assignedStaff.services.length > 0) {
  const canPerformService = assignedStaff.services.some(
    (sId: any) => String(sId) === String(serviceId),
  );
  // ...
}

// ✅ Fixed staff search query
const availableStaffMembers = await Staff.find({
  vendorId: vendorId,
  isActive: true, // ✅ Added isActive filter
  $or: [
    { services: { $size: 0 } }, // ✅ Staff with no specific services
    { services: serviceId }, // ✅ Staff who can do this service
  ],
});
```

### 2. Added Comprehensive Logging

**Search Initiation:**

```typescript
logger.info("Searching for available staff", {
  vendorId,
  serviceId,
  bookingDate: datetime,
  foundStaffCount: availableStaffMembers.length,
});
```

**Individual Staff Checks:**

```typescript
// When staff not available on date
logger.info("Staff not available on date", {
  staffId: staffMember._id,
  staffName: `${staffMember.firstName} ${staffMember.lastName}`,
  date: bookingDate,
});

// When staff has conflicting booking
logger.info("Staff has conflicting booking", {
  staffId: staffMember._id,
  staffName: `${staffMember.firstName} ${staffMember.lastName}`,
  conflictingBookingId: conflictingBooking._id,
});
```

**Final Result:**

```typescript
// Success
logger.info("Auto-assigned staff member", {
  staffId: assignedStaffId,
  staffName: `${staffMember.firstName} ${staffMember.lastName}`,
  bookingTime: datetime,
});

// Failure
logger.warn("No staff available for booking", {
  vendorId,
  serviceId,
  datetime,
  totalStaffChecked: availableStaffMembers.length,
});
```

### 3. Fixed Staff Name Reference

Changed from `staffMember.name` (doesn't exist) to `${staffMember.firstName} ${staffMember.lastName}`:

```typescript
// ❌ Before
staffName: staffMember.name;

// ✅ After
staffName: `${staffMember.firstName} ${staffMember.lastName}`;
```

## How Staff Assignment Works Now

### When `staffPreference === "specific"`:

1. Validate the specific staff member exists
2. Verify staff belongs to this vendor
3. Check if staff can perform this service (using `services` field)
4. Check if staff is available on this date
5. Check for conflicting bookings
6. Assign if all checks pass

### When `staffPreference === "any"`:

1. Find all staff for this vendor who:
   - Are active (`isActive: true`)
   - Can do this service (`services` array contains serviceId OR is empty)
2. For each staff member:
   - Check if available on the booking date (day of week schedule)
   - Check for conflicting bookings at this time
   - If available, assign and stop searching
3. If no staff available, return error with details

## Staff Service Assignment Logic

**Staff with NO services configured:**

```javascript
staff.services = []; // Empty array
```

✅ Can perform **ALL** services (generalist)

**Staff with SPECIFIC services:**

```javascript
staff.services = ["service1", "service2", "service3"];
```

✅ Can perform **ONLY** these services

## Testing

### 1. Check Server Logs

When you try to book, you should see:

```
info: Searching for available staff {
  vendorId: "68dffc2ca3285ec43307fc03",
  serviceId: "...",
  bookingDate: "2025-10-05T14:00:00.000Z",
  foundStaffCount: 2  // <-- Should be > 0 if staff exist
}
```

If `foundStaffCount: 0`, it means:

- No staff members match the query
- Staff might not have the service assigned
- Staff might not be active

### 2. Check Individual Staff

For each staff checked:

```
info: Staff not available on date {
  staffId: "...",
  staffName: "John Doe",
  date: "2025-10-05T14:00:00.000Z"
}
```

OR

```
info: Staff has conflicting booking {
  staffId: "...",
  staffName: "John Doe",
  conflictingBookingId: "..."
}
```

OR (success):

```
info: Auto-assigned staff member {
  staffId: "...",
  staffName: "John Doe",
  bookingTime: "2025-10-05T14:00:00.000Z"
}
```

### 3. If Still "No Staff Available"

Check the logs for:

**A. No staff found initially:**

```
foundStaffCount: 0
```

**Solution:**

- Verify staff `services` field includes the service ID (or is empty)
- Verify staff `isActive: true`
- Verify staff `vendorId` matches

**B. Staff found but not available on date:**

```
Staff not available on date
```

**Solution:**

- Check staff schedule for that day of week
- Ensure schedule exists and `isAvailable: true`

**C. Staff found but has conflict:**

```
Staff has conflicting booking
```

**Solution:**

- Try a different time slot
- Add more staff members
- Cancel the conflicting booking if test data

## Verify Staff Data in Database

Run this in MongoDB to check your staff configuration:

```javascript
db.staff
  .find({
    vendorId: "your-vendor-id",
  })
  .forEach((staff) => {
    print("Staff: " + staff.firstName + " " + staff.lastName);
    print("  Active: " + staff.isActive);
    print("  Services: " + JSON.stringify(staff.services));
    print("  Schedule Monday: " + JSON.stringify(staff.schedule.monday));
    print("---");
  });
```

Expected output:

```
Staff: John Doe
  Active: true
  Services: ["service-id-1", "service-id-2"]  // Or []
  Schedule Monday: {"isAvailable":true,"startTime":"09:00","endTime":"18:00",...}
---
```

## Common Issues

### Issue 1: Staff Has Empty `services` Array

**Behavior:** ✅ Staff can do ANY service (this is correct)
**No action needed**

### Issue 2: Staff Has Specific Services But Not This One

**Behavior:** ❌ Staff won't be found
**Solution:** Add the service ID to staff's `services` array:

```javascript
db.staff.updateOne(
  { _id: ObjectId("staff-id") },
  { $addToSet: { services: "service-id" } },
);
```

### Issue 3: Staff `isActive: false`

**Behavior:** ❌ Staff won't be found
**Solution:** Activate the staff:

```javascript
db.staff.updateOne({ _id: ObjectId("staff-id") }, { $set: { isActive: true } });
```

### Issue 4: Staff Has No Schedule

**Behavior:** ❌ Staff won't be available on any date
**Solution:** Run the fix script:

```bash
node scripts/fix-staff-schedules.js
```

## Files Modified

1. `app/api/bookings/route.ts` - Fixed field names, added logging, added isActive filter

## Related Issues

This is the **4th fix** in the booking flow series:

1. ✅ Staff availability API issues (STAFF_BOOKING_FIX.md)
2. ✅ Datetime validation issues (BOOKING_DATETIME_FIX.md)
3. ✅ Vendor status validation (VENDOR_STATUS_FIX.md)
4. ✅ Staff assignment field mismatch (this document)

## Next Steps

1. **Try booking again** - should now find available staff
2. **Check server logs** for detailed staff search process
3. **If still failing**, check the logs to see:
   - How many staff were found initially
   - Why each staff was rejected
   - What the staff data looks like in database

---

**Created:** October 3, 2025
**Status:** ✅ Implemented and Ready for Testing
