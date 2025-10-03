# Dynamic Availability System Implementation

## 🎯 Feature Overview

This feature replaces hardcoded time slots and business hours with **dynamic availability data** from the database. The system now:

- Fetches real staff schedules and working hours
- Displays actual available time slots based on staff availability
- Shows business hours from staff schedules
- Filters out already booked time slots
- Handles closed days and fully booked scenarios

**Problem Solved**: Previously, the salon detail page showed hardcoded time slots (9:00 AM - 9:00 PM) regardless of actual staff schedules or existing bookings.

---

## 📋 Implementation Details

### **1. Backend Changes**

#### `app/api/vendor/[id]/availability/route.ts` (NEW)

**Endpoint**: `GET /api/vendor/[id]/availability`

**Purpose**: Returns business hours and available time slots for a specific vendor

**Query Parameters**:

- `date` (optional): Date to check availability for (defaults to today)
  - Format: `YYYY-MM-DD` or any valid date string
  - Example: `2025-10-03`

**Response Structure**:

```json
{
  "success": true,
  "data": {
    "vendorId": "6789abc...",
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
      "10:30 AM",
      "11:00 AM",
      "11:30 AM",
      "2:00 PM",
      "2:30 PM",
      "3:00 PM",
      "3:30 PM",
      "4:00 PM",
      "4:30 PM",
      "5:00 PM",
      "5:30 PM"
    ],
    "totalSlots": 16,
    "bookedSlots": 2,
    "staffCount": 3
  }
}
```

**Response When Closed**:

```json
{
  "success": true,
  "data": {
    "vendorId": "6789abc...",
    "date": "2025-10-03",
    "dayOfWeek": "sunday",
    "isOpen": false,
    "businessHours": null,
    "availableSlots": [],
    "message": "Closed today"
  }
}
```

**Response When No Staff**:

```json
{
  "success": true,
  "data": {
    "vendorId": "6789abc...",
    "date": "2025-10-03",
    "dayOfWeek": "friday",
    "isOpen": false,
    "businessHours": null,
    "availableSlots": [],
    "message": "No staff members available"
  }
}
```

**Algorithm**:

1. **Fetch Staff**: Get all active staff members for the vendor
2. **Check Day**: Determine day of week (monday, tuesday, etc.)
3. **Filter Available Staff**: Only include staff with `isAvailable: true` for that day
4. **Calculate Business Hours**:
   - Find earliest `startTime` from all available staff
   - Find latest `endTime` from all available staff
   - Result: Business opens when first staff arrives, closes when last staff leaves
5. **Generate Time Slots**:
   - Create 30-minute intervals between start and end times
   - Exclude break times from all staff schedules
   - Format in 12-hour format (9:00 AM, 2:30 PM, etc.)
6. **Filter Booked Slots**:
   - Fetch all bookings for the date with status `pending` or `confirmed`
   - Remove slots that overlap with existing bookings
7. **Return Results**: Available slots + business hours + metadata

**Helper Functions**:

- `formatTimeTo12Hour(time24: string)`: Converts "14:30" → "2:30 PM"
- `getDayOfWeek(date: Date)`: Returns "monday", "tuesday", etc.
- `generateTimeSlots(start, end, interval, breaks)`: Creates time slot array

---

### **2. Frontend Changes**

#### `app/salon/[id]/page.tsx`

**What Changed**:

1. **Removed Hardcoded Data**:

   ```typescript
   // BEFORE ❌
   const timeSlots = [
     "9:00 AM",
     "10:00 AM",
     "11:00 AM",
     "12:00 PM",
     "2:00 PM",
     "3:00 PM",
     "4:00 PM",
     "5:00 PM",
     "6:00 PM",
   ];
   ```

2. **Added State Management**:

   ```typescript
   // AFTER ✅
   const [availability, setAvailability] = useState<AvailabilityData | null>(
     null,
   );
   const [loadingAvailability, setLoadingAvailability] = useState(true);
   ```

3. **Added TypeScript Interface**:

   ```typescript
   interface AvailabilityData {
     isOpen: boolean;
     businessHours: {
       open: string;
       close: string;
       display: string;
     } | null;
     availableSlots: string[];
     message?: string;
   }
   ```

4. **Fetches Real Data on Page Load**:

   ```typescript
   // Fetch availability
   setLoadingAvailability(true);
   const availabilityResponse = await fetch(
     `/api/vendor/${resolvedParams.id}/availability`,
   );
   if (availabilityResponse.ok) {
     const availData = await availabilityResponse.json();
     setAvailability(availData.data);
   }
   ```

5. **Updated Business Hours Display**:

   ```typescript
   // BEFORE ❌
   <div className="text-sm text-gray-500">
     9:00 AM - 9:00 PM
   </div>

   // AFTER ✅
   <div className="text-sm text-gray-500">
     {loadingAvailability
       ? "..."
       : availability?.businessHours?.display ||
         availability?.message ||
         "Hours not available"}
   </div>
   ```

6. **Dynamic Time Slot Rendering**:
   - **Loading State**: Shows spinner while fetching
   - **Closed State**: "Closed Today" message
   - **Fully Booked State**: "All time slots are taken" message
   - **Available State**: Grid of clickable time slot buttons

---

## 🎨 User Interface Updates

### **Business Hours Section**

```
┌─────────────────────────────────────┐
│ Quick Info                          │
├─────────────────────────────────────┤
│ 🕐 Open Today                       │
│    9:00 AM - 6:00 PM                │
│                                     │
│ 📞 +1 234 567 8900                  │
│ ✉️  vendor@example.com              │
└─────────────────────────────────────┘
```

### **Available Today Section**

**When Loading**:

```
┌─────────────────────────────────────┐
│ Available Today                     │
├─────────────────────────────────────┤
│           ⚪ (spinner)               │
│     Loading availability...         │
└─────────────────────────────────────┘
```

**When Open with Slots**:

```
┌─────────────────────────────────────┐
│ Available Today                     │
├─────────────────────────────────────┤
│ [9:00 AM]  [9:30 AM]               │
│ [10:00 AM] [10:30 AM]              │
│ [11:00 AM] [11:30 AM]              │
│ [2:00 PM]  [2:30 PM]               │
│ [3:00 PM]  [3:30 PM]               │
│                                     │
│ [📅 Book Appointment →]             │
└─────────────────────────────────────┘
```

**When Closed**:

```
┌─────────────────────────────────────┐
│ Available Today                     │
├─────────────────────────────────────┤
│         🕐                          │
│    Closed Today                     │
│ Please check back on another day    │
└─────────────────────────────────────┘
```

**When Fully Booked**:

```
┌─────────────────────────────────────┐
│ Available Today                     │
├─────────────────────────────────────┤
│         🕐                          │
│    Fully Booked                     │
│ All time slots are taken for today  │
└─────────────────────────────────────┘
```

---

## 🔄 Data Flow

```
┌──────────────┐
│   Customer   │
│  visits page │
└──────┬───────┘
       │
       v
┌──────────────────┐
│ Salon Detail Page│
│   Component      │
└──────┬───────────┘
       │ useEffect on mount
       v
┌────────────────────────────────────────┐
│ GET /api/vendor/{id}/availability      │
└──────┬─────────────────────────────────┘
       │
       v
┌──────────────────────────────────────────┐
│ 1. Fetch all active staff for vendor     │
│ 2. Check today's day of week             │
│ 3. Filter staff available today          │
│ 4. Calculate business hours              │
│ 5. Generate 30-min time slots            │
│ 6. Fetch existing bookings               │
│ 7. Filter out booked slots               │
└──────┬───────────────────────────────────┘
       │
       v
┌────────────────────────────────────┐
│  Return JSON Response:              │
│  - isOpen: true/false               │
│  - businessHours: { ... }           │
│  - availableSlots: [...]            │
│  - metadata                         │
└──────┬─────────────────────────────┘
       │
       v
┌──────────────────────────────────────┐
│ Frontend receives data and updates:  │
│ ✓ Business hours display             │
│ ✓ Time slot buttons                  │
│ ✓ Open/Closed status                 │
└──────────────────────────────────────┘
```

---

## 🧪 Testing Scenarios

### **Scenario 1: Vendor with Staff (Open Today)**

**Setup**:

1. Vendor has 2 active staff members
2. Staff 1: 9:00 AM - 5:00 PM (Monday-Friday)
3. Staff 2: 10:00 AM - 6:00 PM (Monday-Saturday)
4. Today is Friday
5. No existing bookings

**Expected Result**:

- ✅ Business hours: "9:00 AM - 6:00 PM"
- ✅ Available slots: 9:00 AM, 9:30 AM, ..., 5:30 PM (all slots)
- ✅ "Open Today" status

### **Scenario 2: Vendor Closed on Sunday**

**Setup**:

1. Vendor has 3 active staff members
2. All staff have `sunday: { isAvailable: false }`
3. Today is Sunday

**Expected Result**:

- ✅ Business hours: null
- ✅ Available slots: [] (empty)
- ✅ "Closed Today" message displayed
- ✅ UI shows closed state with clock icon

### **Scenario 3: Fully Booked Day**

**Setup**:

1. Vendor has 1 active staff member
2. Staff: 9:00 AM - 12:00 PM (only morning shift)
3. All slots (9:00, 9:30, 10:00, 10:30, 11:00, 11:30) have confirmed bookings

**Expected Result**:

- ✅ Business hours: "9:00 AM - 12:00 PM"
- ✅ Available slots: [] (empty)
- ✅ "Fully Booked" message displayed
- ✅ UI shows fully booked state

### **Scenario 4: Partial Bookings**

**Setup**:

1. Vendor has 1 active staff member
2. Staff: 9:00 AM - 5:00 PM
3. Bookings exist at: 10:00 AM and 2:00 PM

**Expected Result**:

- ✅ Business hours: "9:00 AM - 5:00 PM"
- ✅ Available slots: All except 10:00 AM and 2:00 PM
- ✅ Slot buttons rendered for available times only

### **Scenario 5: Vendor with No Staff**

**Setup**:

1. Vendor exists but has 0 active staff members

**Expected Result**:

- ✅ isOpen: false
- ✅ Message: "No staff members available"
- ✅ UI shows closed state with message

### **Scenario 6: Staff with Lunch Break**

**Setup**:

1. Vendor has 1 active staff member
2. Staff: 9:00 AM - 6:00 PM
3. Break: 1:00 PM - 2:00 PM (lunch)

**Expected Result**:

- ✅ Business hours: "9:00 AM - 6:00 PM"
- ✅ Available slots: All EXCEPT 1:00 PM and 1:30 PM
- ✅ Time slots resume at 2:00 PM

---

## 🚀 API Usage Examples

### **Example 1: Get Today's Availability**

**Request**:

```http
GET /api/vendor/6789abc123/availability
```

**Response**:

```json
{
  "success": true,
  "data": {
    "vendorId": "6789abc123",
    "date": "2025-10-03",
    "dayOfWeek": "friday",
    "isOpen": true,
    "businessHours": {
      "open": "9:00 AM",
      "close": "6:00 PM",
      "display": "9:00 AM - 6:00 PM"
    },
    "availableSlots": [
      "9:00 AM", "9:30 AM", "10:00 AM", ...
    ],
    "totalSlots": 18,
    "bookedSlots": 2,
    "staffCount": 3
  }
}
```

### **Example 2: Check Specific Date**

**Request**:

```http
GET /api/vendor/6789abc123/availability?date=2025-10-10
```

**Response**: (Same structure, but for October 10)

### **Example 3: Closed Day**

**Request**:

```http
GET /api/vendor/6789abc123/availability?date=2025-10-06
```

**Response** (Sunday, closed):

```json
{
  "success": true,
  "data": {
    "vendorId": "6789abc123",
    "date": "2025-10-06",
    "dayOfWeek": "sunday",
    "isOpen": false,
    "businessHours": null,
    "availableSlots": [],
    "message": "Closed today"
  }
}
```

---

## 📊 Database Schema Dependencies

### **Staff Model**

The availability system relies on the `Staff` schema:

```typescript
interface IStaff {
  vendorId: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  schedule: {
    monday: {
      isAvailable: boolean;
      startTime: string;    // "09:00"
      endTime: string;      // "18:00"
      breaks: Array<{
        startTime: string;
        endTime: string;
      }>;
    };
    tuesday: { ... };
    // ... other days
  };
}
```

**Default Schedule** (used when creating new staff):

```javascript
{
  monday: {
    isAvailable: true,
    startTime: "09:00",
    endTime: "18:00",
    breaks: [{ startTime: "13:00", endTime: "14:00" }]
  },
  // ... tuesday through saturday similar
  sunday: {
    isAvailable: false,  // Closed on Sunday
    startTime: "09:00",
    endTime: "17:00",
    breaks: []
  }
}
```

### **Booking Model**

The system filters out booked slots using:

```typescript
interface IBooking {
  vendorId: string;
  datetime: Date; // Booking start time
  duration: number; // Duration in minutes
  status: string; // "pending", "confirmed", "cancelled", "completed"
}
```

**Booking Conflict Logic**:

```typescript
// A slot conflicts if:
// - Slot start time is during an existing booking, OR
// - Slot end time is during an existing booking, OR
// - Slot completely overlaps an existing booking
```

---

## 🐛 Troubleshooting

### **Issue: Shows "Closed Today" but should be open**

**Possible Causes**:

1. No active staff members
2. All staff have `isAvailable: false` for that day
3. Staff schedule not properly configured

**Solution**:

```javascript
// Check staff in MongoDB
db.staff.find({ vendorId: "your-vendor-id", isActive: true });

// Verify schedule for specific day
db.staff.find({
  vendorId: "your-vendor-id",
  "schedule.monday.isAvailable": true,
});
```

### **Issue: No time slots showing (but should be open)**

**Possible Causes**:

1. All slots are booked
2. Break times covering all slots
3. startTime >= endTime

**Solution**:

```javascript
// Check bookings for that day
db.bookings.find({
  vendorId: "your-vendor-id",
  datetime: {
    $gte: ISODate("2025-10-03T00:00:00Z"),
    $lte: ISODate("2025-10-03T23:59:59Z"),
  },
  status: { $in: ["pending", "confirmed"] },
});
```

### **Issue: Wrong business hours displayed**

**Possible Causes**:

1. Staff schedules not saved in 24-hour format
2. Time format validation failed

**Solution**:
Ensure staff times are in `HH:MM` format (e.g., "09:00", "18:00")

---

## ✅ Completion Checklist

- [x] Create `/api/vendor/[id]/availability` endpoint
- [x] Implement availability calculation logic
- [x] Fetch staff schedules from database
- [x] Calculate business hours from staff data
- [x] Generate 30-minute time slots
- [x] Filter out booked slots
- [x] Handle break times
- [x] Format times to 12-hour format
- [x] Update salon detail page component
- [x] Replace hardcoded time slots with API data
- [x] Add loading states
- [x] Add closed state UI
- [x] Add fully booked state UI
- [x] Update business hours display
- [x] Add TypeScript interfaces
- [x] Test with active staff
- [x] Test with closed days
- [x] Test with no staff
- [x] Test with partial bookings
- [x] Create comprehensive documentation

---

## 🎯 Summary

### **What Was Changed**

**Before**:

- ❌ Hardcoded time slots (9:00 AM - 9:00 PM)
- ❌ Hardcoded business hours
- ❌ No connection to staff schedules
- ❌ Showed slots even when fully booked
- ❌ No "closed" state handling

**After**:

- ✅ Dynamic time slots from staff schedules
- ✅ Real business hours calculation
- ✅ Filters out booked slots
- ✅ Respects staff break times
- ✅ Handles closed days
- ✅ Shows fully booked state
- ✅ Shows "no staff" state
- ✅ Loading states for better UX

### **Key Benefits**

1. **Accuracy**: Shows only truly available time slots
2. **Real-time**: Reflects current bookings and staff schedules
3. **Flexibility**: Adapts to each vendor's unique schedule
4. **User Experience**: Clear feedback for closed/busy times
5. **Scalability**: Works with multiple staff members
6. **Maintainability**: No hardcoded data to update

### **Technical Highlights**

- ✅ RESTful API design
- ✅ TypeScript type safety
- ✅ MongoDB aggregation for efficiency
- ✅ 30-minute slot intervals (configurable)
- ✅ 12-hour time format for readability
- ✅ Comprehensive error handling
- ✅ Logging for debugging
- ✅ Responsive UI states

---

**Last Updated**: October 3, 2025  
**Version**: 1.0  
**Status**: ✅ Complete and Production-Ready
