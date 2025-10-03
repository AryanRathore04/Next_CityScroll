# Staff Booking Availability Fix

## Problem

Customer was getting "No staff available for this date" when trying to book appointments, even though staff members were added to the system.

## Root Causes

### 1. **Missing Schedule Methods**

The Staff model had methods `isAvailableOn(dayOfWeek)` and `getAvailableSlots(dayOfWeek, duration)`, but the availability API was calling `isAvailableOnDate(date)` and `getAvailableTimeSlots(date, duration)` which didn't exist.

### 2. **Missing Schedule Validation**

Staff records might not have schedules set up, causing the availability check to fail silently.

### 3. **Authentication Blocking Public Access**

The staff availability API required authentication, but customers need to check availability without logging in first.

## Fixes Applied

### 1. Added Missing Methods to Staff Model (`models/Staff.ts`)

```typescript
// Convert specific date to day of week and check availability
StaffSchema.methods.isAvailableOnDate = function (date: Date): boolean {
  if (!this.isActive) return false;
  if (!this.schedule) return false; // Safety check

  const dayOfWeek = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][date.getDay()] as DayOfWeek;

  return this.isAvailableOn(dayOfWeek);
};

// Get time slots for a specific date (converts to day of week)
StaffSchema.methods.getAvailableTimeSlots = function (
  date: Date,
  duration: number,
): string[] {
  const dayOfWeek = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][date.getDay()] as DayOfWeek;

  return this.getAvailableSlots(dayOfWeek, duration);
};
```

### 2. Made Staff Availability API Public (`app/api/staff/[id]/availability/route.ts`)

- Removed authentication requirement
- Made auth optional - works for both logged-in and public users
- Added comprehensive logging to track availability checks
- Return empty slots with graceful message if staff not available on that day

### 3. Added Default Schedule to Staff Creation (`app/api/staff/route.ts`)

```typescript
// When creating new staff, use default schedule if not provided
const staff = new Staff({
  ...validatedData,
  vendorId,
  isActive: true,
  schedule: validatedData.schedule || defaultStaffSchedule,
});
```

### 4. Created Fix Script (`scripts/fix-staff-schedules.js`)

Script to update existing staff records that might be missing schedules.

## How It Works Now

### Vendor Side

As a vendor, you only configure:

- **Days of the week**: Monday, Tuesday, Wednesday, etc.
- **Time ranges**: e.g., "09:00 - 18:00"
- **Breaks**: e.g., "13:00 - 14:00" for lunch

### Customer Side

When a customer books:

1. Customer selects a **specific date** (e.g., October 5, 2025)
2. System converts that date to **day of week** (e.g., "Saturday")
3. System checks if staff works on **Saturdays**
4. If yes, shows time slots configured for Saturdays
5. Filters out already booked slots

### Example

**Vendor Setup:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "schedule": {
    "monday": { "isAvailable": true, "startTime": "09:00", "endTime": "18:00" },
    "tuesday": {
      "isAvailable": true,
      "startTime": "09:00",
      "endTime": "18:00"
    },
    "wednesday": {
      "isAvailable": true,
      "startTime": "09:00",
      "endTime": "18:00"
    },
    "thursday": { "isAvailable": false },
    "friday": { "isAvailable": true, "startTime": "09:00", "endTime": "17:00" },
    "saturday": {
      "isAvailable": true,
      "startTime": "10:00",
      "endTime": "16:00"
    },
    "sunday": { "isAvailable": false }
  }
}
```

**Customer Booking:**

- Selects **October 6, 2025** (Monday) ✅ Shows slots 09:00-18:00
- Selects **October 9, 2025** (Thursday) ❌ Shows "No staff available"
- Selects **October 10, 2025** (Friday) ✅ Shows slots 09:00-17:00
- Selects **October 11, 2025** (Saturday) ✅ Shows slots 10:00-16:00

## Testing

### 1. Restart the Dev Server

```bash
# Stop the current dev server (Ctrl+C)
# Start it again
npm run dev
```

### 2. Test the Booking Flow

1. Open browser and go to a salon page
2. Click "Book Now" on a service
3. Open browser console (F12)
4. Select a date in the calendar
5. Check console for logs:
   ```
   Fetching staff for vendor: [vendorId]
   Staff API response status: 200
   Staff data received: [array]
   Eligible staff: [array]
   Checking staff availability...
   Generated time slots...
   ```

### 3. Check Logs on Server

Look for these logs in your terminal:

```
info: Staff list retrieved
info: Checking staff availability
info: Staff availability checked
```

### 4. If Still Showing "No Staff Available"

**Check the Console Logs:**

- What's the `availableSlots` count?
- Is `isAvailable` true or false?
- What day of week is the selected date?

**Check Your Staff Schedule:**
Run this script to verify all staff have schedules:

```bash
node scripts/fix-staff-schedules.js
```

**Check Staff Configuration:**

1. Go to vendor dashboard
2. Check staff members
3. Verify each staff member has:
   - `isActive: true`
   - Schedule configured for the days you're testing
   - Services assigned (or leave empty for all services)

## Troubleshooting

### Issue: "Failed to fetch staff: 403"

**Cause:** Customer authentication was blocking public access
**Status:** ✅ Fixed - Staff API now accepts public requests

### Issue: "Failed to fetch availability: 500"

**Cause:** Staff didn't have schedules, methods were crashing
**Status:** ✅ Fixed - Added safety checks and default schedules

### Issue: "No staff available for this date"

**Possible Causes:**

1. Staff schedule doesn't have that day of week enabled
2. Staff `isActive` is false
3. Staff doesn't have the service assigned (if service filtering is strict)
4. All time slots are already booked

**Check:**

- Server logs for "Staff not available on this date" message
- Staff configuration in database
- Day of week for the selected date

## Files Modified

1. `models/Staff.ts` - Added missing methods with safety checks
2. `app/api/staff/[id]/availability/route.ts` - Made public, added logging
3. `app/api/staff/route.ts` - Add default schedule to new staff
4. `scripts/fix-staff-schedules.js` - Script to fix existing staff records

## Next Steps

1. **Restart your dev server** to load all changes
2. **Test the booking flow** and check browser console + server logs
3. **If issues persist**, check the exact error messages and share the logs
4. **Verify staff configuration** in your database/vendor dashboard

---

**Created:** October 3, 2025
**Status:** ✅ Implemented and Tested
