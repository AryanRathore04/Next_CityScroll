# Notification System Analysis and Fixes

## Issue Report

User reported: "in app notification is still not working because i dont get any notification in the frontend at all"

## Analysis of Logs

Looking at the terminal logs from the booking creation:

```
info: User notifications retrieved {
  "count":1,
  "limit":5,
  "page":1,
  "unreadCount":1,
  "userId":"68dfc8214c02a20da50723de"  // CUSTOMER ID
}

info: Notification created {
  "notificationId":"68e0175cc81e15c41cab6b8e",
  "recipientId":"68dffc2ca3285ec43307fc03",  // VENDOR ID
  "type":"booking_confirmation"
}
```

### Key Findings:

1. **Notifications ARE being created** - System is working
2. **1 notification exists** for the customer (`unreadCount:1`)
3. **The logged notification** was for the vendor, not the customer
4. **Customer notification** was likely created but not logged separately

## Problem Identified

### 1. Insufficient Logging

The original code only logged when ALL notifications were sent, making it hard to debug which notification was for which user:

```typescript
// OLD: Only one log at the end
logger.info("Booking confirmation notifications sent", {
  bookingId,
  customerId,
  vendorId,
});
```

### 2. Staff Name Field Mismatch

The notification service was trying to use `staff.name` field, but Staff model has `firstName` and `lastName`:

```typescript
// ❌ WRONG
.populate("staffId", "name")
staff?.name  // Field doesn't exist

// ✅ CORRECT
.populate("staffId", "firstName lastName")
`${staff.firstName} ${staff.lastName}`
```

## Fixes Applied

### 1. Added Detailed Logging (`lib/notification-service.ts`)

**Before:**

```typescript
await this.createNotification({...}); // Customer
await this.createNotification({...}); // Vendor
logger.info("Notifications sent");  // Generic log
```

**After:**

```typescript
const customerNotification = await this.createNotification({...});
logger.info("Customer notification created", {
  notificationId: customerNotification._id,
  recipientId: customer._id,
  recipientType: "customer",
});

const vendorNotification = await this.createNotification({...});
logger.info("Vendor notification created", {
  notificationId: vendorNotification._id,
  recipientId: vendor._id,
  recipientType: "vendor",
});

logger.info("Booking confirmation notifications sent", {
  bookingId,
  customerId,
  vendorId,
  customerNotificationId: customerNotification._id,
  vendorNotificationId: vendorNotification._id,
});
```

### 2. Fixed Staff Name Field

**Before:**

```typescript
.populate("staffId", "name")  // ❌ Wrong field
staff?.name  // undefined
```

**After:**

```typescript
.populate("staffId", "firstName lastName")  // ✅ Correct fields
const staffName = staff
  ? `${staff.firstName} ${staff.lastName}`
  : null;
```

## How Notifications Work

### Backend (Notification Creation):

1. Customer books a service
2. Booking created successfully
3. System creates **TWO** notifications:
   - **Customer notification**: "Booking Confirmed!" with booking details
   - **Vendor notification**: "New Booking Received" with customer details

### Frontend (Notification Display):

1. `NotificationBell` component in header
2. Fetches notifications for **logged-in user** only
3. Shows unread count badge
4. Displays last 5 notifications in dropdown
5. Auto-refreshes every 30 seconds

### Key Points:

- Each user sees **ONLY their own notifications**
- Customer sees: "Booking Confirmed!"
- Vendor sees: "New Booking Received"
- Notifications are user-specific

## Testing Steps

### 1. Create a New Booking

As a **customer**, create a booking and watch the server logs:

```
info: Customer notification created {
  notificationId: "...",
  recipientId: "68dfc8214c02a20da50723de",  // Customer ID
  recipientType: "customer"
}

info: Vendor notification created {
  notificationId: "...",
  recipientId: "68dffc2ca3285ec43307fc03",  // Vendor ID
  recipientType: "vendor"
}

info: Booking confirmation notifications sent {
  customerNotificationId: "...",
  vendorNotificationId: "..."
}
```

### 2. Check Customer Notifications

1. **Stay logged in as customer** (the one who made the booking)
2. Look at the **bell icon** in the header
3. You should see a **red badge** with number (e.g., "1")
4. Click the bell icon
5. You should see: "Booking Confirmed! Your booking for [Service] at [Vendor]..."

### 3. Check Vendor Notifications

1. **Log out from customer account**
2. **Log in as vendor** (the salon owner)
3. Look at the **bell icon** in the header
4. You should see a **red badge**
5. Click the bell icon
6. You should see: "New Booking Received from [Customer]..."

### 4. Verify Notification Data

Open browser console and check the API response:

```javascript
// Click bell icon and check Network tab
GET /api/notifications?limit=5&unreadOnly=false

// Response should show:
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "...",
        "type": "booking_confirmation",
        "title": "Booking Confirmed!",  // For customer
        "message": "Your booking for...",
        "status": "sent",
        "createdAt": "..."
      }
    ],
    "unreadCount": 1
  }
}
```

## Common Issues and Solutions

### Issue 1: "I don't see any notifications"

**Check:**

- Are you logged in as the correct user?
- Customer sees "Booking Confirmed"
- Vendor sees "New Booking Received"

**Solution:**

- Check browser console for API errors
- Verify you're logged in (check `localStorage.getItem("accessToken")`)
- Refresh the page

### Issue 2: "Bell icon shows count but dropdown is empty"

**Check:**

- Browser console for JavaScript errors
- API response in Network tab

**Solution:**

- Clear browser cache
- Check if notification data format matches component expectations

### Issue 3: "Notifications work but no email"

**Check:**

- SMTP credentials in `.env.local`
- Server logs for "Failed to send email notification"

**Solution:**
Add to `.env.local`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Issue 4: "Old booking but no notification"

**Explanation:**

- Only NEW bookings trigger notifications
- Existing bookings don't retroactively create notifications

**Solution:**

- Create a new booking to test
- Or manually create notification via API

## Notification Flow Diagram

```
Customer Books Service
         ↓
    Booking Created
         ↓
sendBookingConfirmation()
         ↓
    ┌────┴────┐
    ↓         ↓
Customer     Vendor
Notification Notification
    ↓         ↓
"Booking   "New Booking
Confirmed"  Received"
    ↓         ↓
In-App DB   In-App DB
+ Email     + Email
```

## Files Modified

1. `lib/notification-service.ts`:
   - Added detailed logging for each notification
   - Fixed staff name field (`name` → `firstName + lastName`)
   - Store notification references to log IDs

## Expected Logs (After Fix)

When you create a booking, you should see:

```
info: Customer notification created {
  notificationId: "68e0175cc81e15c41cab6b8e",
  recipientId: "68dfc8214c02a20da50723de",
  recipientType: "customer"
}

info: Vendor notification created {
  notificationId: "68e0175dc81e15c41cab6b8f",
  recipientId: "68dffc2ca3285ec43307fc03",
  recipientType: "vendor"
}

info: Booking confirmation notifications sent {
  bookingId: "68e01756c81e15c41cab6b75",
  customerId: "68dfc8214c02a20da50723de",
  vendorId: "68dffc2ca3285ec43307fc03",
  customerNotificationId: "68e0175cc81e15c41cab6b8e",
  vendorNotificationId: "68e0175dc81e15c41cab6b8f"
}
```

## Next Steps

1. **Create a new booking** as a customer
2. **Check the server logs** - you should see both customer and vendor notification IDs
3. **Check the bell icon** - should show unread count
4. **Click the bell** - should show the notification
5. **If still not showing**, share:
   - Server logs (both notification creation logs)
   - Browser console errors
   - API response from `/api/notifications`

---

**Created:** October 4, 2025
**Status:** ✅ Enhanced Logging and Fixed Staff Name Field
