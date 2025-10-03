# Testing Guide: Dynamic Availability System

## ✅ What Was Fixed

The salon detail page now shows **real availability data** instead of hardcoded time slots.

### Before (❌ Problems):

- Hardcoded time slots: 9:00 AM, 10:00 AM, 11:00 AM, etc.
- Hardcoded business hours: "9:00 AM - 9:00 PM"
- Showed time slots even when staff was unavailable
- Didn't filter out booked slots
- No handling for closed days

### After (✅ Fixed):

- ✅ Shows actual time slots based on staff schedules
- ✅ Displays real business hours from database
- ✅ Filters out already booked time slots
- ✅ Shows "Closed Today" when business is closed
- ✅ Shows "Fully Booked" when all slots are taken
- ✅ Shows "No staff available" when vendor has no staff

---

## 🧪 How to Test

### **Test 1: View Availability for Your Vendor**

1. **Open your salon page as a customer**:

   ```
   http://localhost:3000/salon/YOUR_VENDOR_ID
   ```

2. **Scroll to the right sidebar**

3. **Check "Quick Info" section**:

   - Should show actual business hours (not "9:00 AM - 9:00 PM")
   - If your staff works 9 AM - 6 PM, it should show that

4. **Check "Available Today" section**:
   - Should show actual time slots based on your staff schedules
   - If you have no staff → Shows "No staff members available"
   - If closed today → Shows "Closed Today"
   - If open → Shows available time slots

### **Test 2: Verify Business Hours Match Staff Schedules**

**Expected Behavior**:

- Business hours = earliest staff start time to latest staff end time
- If Staff A: 9 AM - 5 PM and Staff B: 10 AM - 6 PM
- Then business hours: "9:00 AM - 6:00 PM"

**How to Check**:

1. Go to your vendor dashboard
2. Check your staff schedules
3. Compare with what shows on the salon detail page

### **Test 3: Book a Time Slot and Verify It Disappears**

1. **Book an appointment** for today at 2:00 PM
2. **Refresh the salon page**
3. **Check "Available Today"**:
   - ✅ 2:00 PM slot should NOT be shown
   - ✅ Other slots should still be available

### **Test 4: Test Closed Days**

If your staff has Sunday as "isAvailable: false":

1. **Change your system date to Sunday** (or wait for Sunday)
2. **Open the salon page**
3. **Should see**:
   ```
   Available Today
   ─────────────────
       🕐
   Closed Today
   Please check back on another day
   ```

### **Test 5: Test Different Days**

The API accepts a `date` parameter:

```bash
# Test tomorrow's availability
curl http://localhost:3000/api/vendor/YOUR_VENDOR_ID/availability?date=2025-10-04

# Test specific date
curl http://localhost:3000/api/vendor/YOUR_VENDOR_ID/availability?date=2025-10-10
```

---

## 📋 Testing Checklist

- [ ] **Salon page loads without errors**
- [ ] **Business hours show real data** (not "9:00 AM - 9:00 PM")
- [ ] **Time slots show real data** (not hardcoded slots)
- [ ] **Loading state appears** while fetching
- [ ] **Closed days show "Closed Today"** message
- [ ] **Fully booked days show "Fully Booked"** message
- [ ] **Booked time slots are hidden** from available slots
- [ ] **Multiple staff members' schedules are combined** correctly
- [ ] **Break times are excluded** from available slots

---

## 🔧 If You Don't Have Staff Yet

If your vendor doesn't have any staff members, you'll see:

```
Available Today
─────────────────
       🕐
No staff members available
Please check back on another day
```

**To add staff**:

1. Go to your vendor dashboard
2. Navigate to "Staff" section
3. Add a staff member with schedule
4. The availability will update automatically

**Or use the API**:

```bash
POST http://localhost:3000/api/staff
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@salon.com",
  "specialization": ["Hair Cut", "Styling"],
  "services": ["SERVICE_ID_1", "SERVICE_ID_2"],
  "schedule": {
    "monday": {
      "isAvailable": true,
      "startTime": "09:00",
      "endTime": "18:00",
      "breaks": [{ "startTime": "13:00", "endTime": "14:00" }]
    },
    "tuesday": {
      "isAvailable": true,
      "startTime": "09:00",
      "endTime": "18:00",
      "breaks": [{ "startTime": "13:00", "endTime": "14:00" }]
    },
    // ... other days
    "sunday": {
      "isAvailable": false,
      "startTime": "09:00",
      "endTime": "17:00",
      "breaks": []
    }
  }
}
```

---

## 🚨 Troubleshooting

### Issue: Shows "No staff members available"

**Solution**:

1. Check if vendor has active staff: `db.staff.find({ vendorId: "YOUR_ID", isActive: true })`
2. Make sure `isActive: true` for at least one staff member
3. Verify staff has at least one day with `isAvailable: true`

### Issue: Shows "Closed Today" when should be open

**Solution**:

1. Check today's day of week (Monday, Tuesday, etc.)
2. Verify staff schedule for that day: `staff.schedule.monday.isAvailable`
3. Make sure at least one staff has that day enabled

### Issue: Wrong business hours displayed

**Solution**:

1. Check staff schedules in database
2. Verify `startTime` and `endTime` are in `HH:MM` format
3. Example: `"09:00"` not `"9:00 AM"`

### Issue: Time slots still showing after booking

**Solution**:

1. Verify booking was saved with status "pending" or "confirmed"
2. Check booking `datetime` field matches today's date
3. Refresh the page (might be caching)

---

## 📊 API Testing with cURL

### Get Today's Availability

```bash
curl http://localhost:3000/api/vendor/YOUR_VENDOR_ID/availability
```

**Expected Response** (when open):

```json
{
  "success": true,
  "data": {
    "vendorId": "...",
    "date": "2025-10-03",
    "dayOfWeek": "friday",
    "isOpen": true,
    "businessHours": {
      "open": "9:00 AM",
      "close": "6:00 PM",
      "display": "9:00 AM - 6:00 PM"
    },
    "availableSlots": [
      "9:00 AM",
      "9:30 AM",
      "10:00 AM",
      ...
    ],
    "totalSlots": 18,
    "bookedSlots": 2,
    "staffCount": 3
  }
}
```

### Get Specific Date Availability

```bash
curl "http://localhost:3000/api/vendor/YOUR_VENDOR_ID/availability?date=2025-10-10"
```

---

## ✨ What to Expect

### When Everything Works Correctly:

1. **Home Page** → Click on your salon card
2. **Salon Detail Page** loads
3. **Business Hours** section shows:
   - "Open Today" (if staff is available)
   - Real hours like "9:00 AM - 6:00 PM"
4. **Available Today** section shows:
   - Grid of clickable time slot buttons
   - Only slots that are:
     - ✅ Within staff working hours
     - ✅ Not during break times
     - ✅ Not already booked
5. **Click a time slot** → Button highlights
6. **Click "Book Appointment"** → Navigates to booking page

### Visual Differences:

**Before**:

```
Open Today
9:00 AM - 9:00 PM          (❌ Hardcoded)

Available Today
[9:00 AM]  [10:00 AM]
[11:00 AM] [12:00 PM]      (❌ Hardcoded)
[2:00 PM]  [3:00 PM]
[4:00 PM]  [5:00 PM]
[6:00 PM]
```

**After**:

```
Open Today
9:00 AM - 6:00 PM          (✅ From staff schedules)

Available Today
[9:00 AM]  [9:30 AM]
[10:00 AM] [10:30 AM]      (✅ 30-min intervals)
[11:00 AM] [11:30 AM]      (✅ Excludes 1-2 PM lunch break)
[2:00 PM]  [2:30 PM]       (✅ Excludes booked slots)
[3:00 PM]  [3:30 PM]
[4:00 PM]  [4:30 PM]
[5:00 PM]  [5:30 PM]
```

---

## 🎉 Success Criteria

You'll know it's working when:

- ✅ Business hours are NOT "9:00 AM - 9:00 PM" (unless that's your actual schedule)
- ✅ Time slots change based on day of week
- ✅ Sunday shows "Closed Today" (if staff doesn't work Sundays)
- ✅ Booked slots disappear from the list
- ✅ Only 30-minute intervals are shown
- ✅ Lunch break times don't show slots
- ✅ No compilation errors in terminal
- ✅ Page loads smoothly without crashes

---

## 📝 Next Steps

1. **Test the salon page** with your vendor ID
2. **Verify business hours** match your staff schedules
3. **Book a test appointment** and see the slot disappear
4. **Try different days** to see schedule variations
5. **Share feedback** if anything looks wrong

---

**Questions to Check**:

- [ ] Does the business hours show correct times?
- [ ] Are the time slots accurate?
- [ ] Do booked slots disappear?
- [ ] Does it show "Closed Today" on off days?
- [ ] Is the UI smooth and responsive?

---

**Files Changed**:

- ✅ `app/api/vendor/[id]/availability/route.ts` (NEW)
- ✅ `app/salon/[id]/page.tsx` (UPDATED)
- ✅ `DYNAMIC_AVAILABILITY_IMPLEMENTATION.md` (DOCUMENTATION)
- ✅ `TESTING_GUIDE.md` (THIS FILE)

**Status**: ✅ Ready for Testing

---

**Last Updated**: October 3, 2025
