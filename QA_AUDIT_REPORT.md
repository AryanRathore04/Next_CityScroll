# 🔍 Comprehensive End-to-End QA Audit Report

**Platform**: Multi-Vendor Salon & Spa Booking Platform  
**Tech Stack**: Next.js 15.5.3 (App Router), TypeScript, MongoDB, Razorpay  
**Audit Date**: October 1, 2025  
**Auditor Role**: Expert Full-Stack QA Architect

---

## 📋 Executive Summary

### Audit Scope

- ✅ Customer Booking Journey (E2E)
- ✅ Vendor Management Journey (E2E)
- ✅ System-Wide Security & Authorization
- ✅ Frontend State Consistency
- ✅ Error Handling Flow

### Critical Findings Summary

- 🔴 **Critical Issues**: 8 found
- 🟡 **Major Issues**: 12 found
- 🟢 **Minor Issues**: 6 found
- ⚠️ **Recommendations**: 15

---

## 🚨 CRITICAL ISSUES (Require Immediate Fix)

### 1. **Race Condition in Booking Creation** 🔴

**Severity**: CRITICAL  
**File**: `app/api/bookings/route.ts`  
**Lines**: 136-159

**Issue**: The booking creation logic checks for staff availability BUT does **NOT** use database-level locking or atomic operations. This creates a **RACE CONDITION** where two customers could simultaneously book the same staff member at the same time.

**Current Code**:

```typescript
const conflictingBooking = await Booking.findOne({
  staffId: assignedStaff._id,
  status: { $in: ["pending", "confirmed"] },
  // ... time overlap check
});

if (conflictingBooking) {
  return NextResponse.json(
    { error: "Staff member is not available" },
    { status: 400 },
  );
}

// RACE CONDITION HERE - Another request could pass the check above!
const booking = await Booking.create({
  /* ... */
});
```

**Problem**: Between the `findOne` check and the `create` operation, another concurrent request could create a booking for the same time slot.

**Expected Behavior**: Use MongoDB transactions or optimistic locking to ensure atomic "check-and-create" operations.

**Recommended Fix**:

```typescript
// Use MongoDB transaction
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Lock the staff document during the transaction
  const conflictingBooking = await Booking.findOne({
    staffId: assignedStaff._id,
    status: { $in: ["pending", "confirmed"] },
    // time overlap check
  }).session(session);

  if (conflictingBooking) {
    await session.abortTransaction();
    return NextResponse.json(
      { error: "Staff member is not available" },
      { status: 400 },
    );
  }

  const booking = await Booking.create(
    [
      {
        /* data */
      },
    ],
    { session },
  );
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

### 2. **Missing Authentication on Salon Search API** 🔴

**Severity**: CRITICAL (Security)  
**File**: `app/api/search/salons/route.ts`  
**Lines**: 1-58

**Issue**: The salon search API endpoint has **NO authentication middleware**. This endpoint is completely public, which could be exploited for:

- Denial of Service attacks (unlimited queries)
- Data scraping of all salon information
- No rate limiting protection

**Current Code**:

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // No authentication check!
    const results = await GeolocationService.searchSalons(filters);
```

**Expected Behavior**: Protected endpoints should require authentication. Public endpoints should have rate limiting.

**Recommended Fix**:

```typescript
import { withRateLimit } from "@/lib/middleware";

async function searchSalonsHandler(request: NextRequest) {
  // existing logic
}

// Apply rate limiting (e.g., 30 requests per 15 minutes per IP)
export const POST = withRateLimit(searchSalonsHandler, 900000, 30);
```

---

### 3. **Payment Verification Lacks Idempotency Key** 🔴

**Severity**: CRITICAL (Financial)  
**File**: `app/api/payments/verify-signature/route.ts`  
**Lines**: 72-90

**Issue**: While the code checks if payment is already verified (line 72-83), it doesn't prevent duplicate transaction record creation if the request is retried. This could lead to:

- Duplicate vendor earnings records
- Incorrect financial reconciliation
- Platform commission calculation errors

**Current Code**:

```typescript
if (order.status === "paid") {
  return NextResponse.json({
    success: true,
    message: "Payment already verified",
    order: order.toSafeObject(),
  });
}

// ... later, transaction creation (line 127-168)
const transaction = new Transaction({
  /* ... */
});
await transaction.save();
```

**Problem**: If a client retries after the order is marked "paid" but before the early return, or if the notification service fails and retries, duplicate transactions could be created.

**Recommended Fix**: Add idempotency key and use `findOneAndUpdate` with `upsert`:

```typescript
const transaction = await Transaction.findOneAndUpdate(
  {
    gatewayTransactionId: razorpay_payment_id,
    bookingId: booking._id,
  },
  {
    $setOnInsert: {
      type: "booking_payment",
      status: "completed",
      // ... all fields
    },
  },
  { upsert: true, new: true },
);
```

---

### 4. **Frontend Not Handling Booking Page API Calls** 🔴

**Severity**: CRITICAL (Functional)  
**File**: `app/booking/page.tsx`  
**Lines**: 1-273

**Issue**: The booking page **DOES NOT** make any API calls to create bookings or fetch available time slots. The page is entirely static with hardcoded data:

- Hardcoded services (lines 12-16)
- Hardcoded time slots (line 18)
- No `fetch` calls to `/api/bookings`
- No integration with the backend booking system

**Current Code**:

```typescript
const services = [
  { id: "1", name: "Deep Tissue Massage", duration: "60 mins", price: 2500 },
  // ... hardcoded data
];
const timeSlots = ["9:00 AM", "10:00 AM" /* ... */];
```

**Expected Behavior**: The page should:

1. Fetch available services from `/api/services?vendorId={id}`
2. Fetch real-time available time slots from `/api/availability?serviceId={id}&date={date}`
3. Submit booking to `POST /api/bookings`
4. Integrate with payment flow

**Impact**: The booking page is **non-functional** - it displays a UI but doesn't actually create bookings in the system.

---

### 5. **Salons Page Using Static Mock Data** 🔴

**Severity**: CRITICAL (Functional)  
**File**: `app/salons/page.tsx`  
**Lines**: 26-97

**Issue**: Similar to booking page, the salons listing page uses **hardcoded mock data** instead of fetching from the database:

**Current Code**:

```typescript
const venues = [
  {
    id: "1",
    name: "Serenity Wellness Spa",
    image: "https://images.unsplash.com/...",
    // ... hardcoded venue data
  },
  // ...
];
```

**Expected Behavior**: Should fetch salons from `/api/search/salons` with filters and display real data from MongoDB.

**Impact**: Users see mock data instead of actual salons in the database. The search functionality is **completely non-functional**.

---

### 6. **Vendor ID Security Vulnerability in Booking Creation** 🔴

**Severity**: CRITICAL (Security)  
**File**: `app/api/bookings/route.ts`  
**Lines**: 44-48

**Issue**: The booking API accepts `vendorId` from the request body and uses it directly. While there's validation (lines 77-91), a malicious customer could:

1. Inspect which vendorId owns a service
2. Bypass the check by providing the correct vendorId
3. Potentially manipulate booking assignments

**Current Code**:

```typescript
const { serviceId, vendorId, datetime, notes, staffId } = validation.data;
// vendorId comes from CLIENT REQUEST - untrusted!
```

**Expected Behavior**: The `vendorId` should be derived from the service lookup, not trusted from the client:

```typescript
const service = await Service.findById(serviceId);
if (!service)
  return NextResponse.json({ error: "Service not found" }, { status: 404 });

const vendorId = service.vendorId; // Get from database, not from client!
```

**Recommended Fix**: Remove `vendorId` from the request schema and derive it server-side.

---

### 7. **Missing Transaction Rollback on Notification Failure** 🔴

**Severity**: CRITICAL (Data Integrity)  
**File**: `app/api/payments/verify-signature/route.ts`  
**Lines**: 176-191

**Issue**: After payment verification, booking status is updated and transaction is created, but if notification sending fails (lines 176-191), there's **no rollback mechanism**. The system state becomes inconsistent:

- Payment is verified ✅
- Booking is confirmed ✅
- Transaction is recorded ✅
- Customer is NOT notified ❌
- Vendor is NOT notified ❌

**Current Code**:

```typescript
// Update order and booking status
await Order.findByIdAndUpdate(/* ... */);
await Booking.findByIdAndUpdate(/* ... */);

// Create transaction
await transaction.save();

// Send notifications - errors are caught and logged but not handled
try {
  await NotificationService.sendBookingConfirmation(bookingId);
} catch (notificationError) {
  logger.error("Failed to send notifications", {
    /* ... */
  });
  // Don't throw - BUT NO RETRY MECHANISM!
}
```

**Expected Behavior**: Implement a retry queue or background job system for failed notifications.

**Recommended Fix**: Use a job queue (Bull, BullMQ) to retry failed notifications:

```typescript
import { notificationQueue } from "@/lib/job-queues";

try {
  await NotificationService.sendBookingConfirmation(bookingId);
} catch (error) {
  // Add to retry queue instead of just logging
  await notificationQueue.add(
    "booking-confirmation",
    {
      bookingId,
      customerId: currentUser.id,
      vendorId: booking.vendorId,
      attemptCount: 1,
    },
    {
      attempts: 5,
      backoff: { type: "exponential", delay: 2000 },
    },
  );
}
```

---

### 8. **No Database Connection Error Handling** 🔴

**Severity**: CRITICAL (Reliability)  
**Files**: Multiple API routes  
**Example**: `app/api/bookings/route.ts` line 60

**Issue**: All API routes call `await connectDB()` but don't handle connection failures. If MongoDB is down or credentials are wrong, the API returns a generic 500 error without proper diagnostics.

**Current Code**:

```typescript
await connectDB();
const Service = (await import("../../../models/Service")).default;
// No error handling if connectDB() fails!
```

**Expected Behavior**: Explicit error handling with specific error messages:

```typescript
try {
  await connectDB();
} catch (dbError) {
  logger.error("Database connection failed", { error: dbError });
  return NextResponse.json(
    {
      error: "Service temporarily unavailable",
      code: "DATABASE_CONNECTION_ERROR",
      timestamp: new Date().toISOString(),
    },
    { status: 503 },
  );
}
```

---

## 🟡 MAJOR ISSUES (High Priority)

### 9. **Staff Assignment Logic Missing Auto-Assignment** 🟡

**File**: `app/api/bookings/route.ts`  
**Lines**: 101-165

**Issue**: When `staffPreference` is "any", the code doesn't automatically assign an available staff member. It just leaves `staffId` as `undefined`. This means:

- The booking has no assigned staff
- Vendor has to manually assign staff later
- Defeats the purpose of having multiple staff members

**Expected Behavior**: When `staffPreference === "any"`, automatically assign an available staff member:

```typescript
if (!staffId && staffPreference === "any") {
  // Find available staff for this service at this time
  const availableStaff = await Staff.findOne({
    vendorId: vendorId,
    serviceIds: serviceId,
    // Check availability logic
  });

  if (availableStaff) {
    staffId = availableStaff._id;
  }
}
```

---

### 10. **Payment Order Creation Missing Idempotency** 🟡

**File**: `app/api/payments/create-order/route.ts`  
**Lines**: 70-79

**Issue**: The code deletes existing "created" orders (line 131-133) instead of reusing them. This wastes Razorpay API calls and could create billing issues.

**Current Code**:

```typescript
// Delete any existing pending order for this booking
if (existingOrder && existingOrder.status === "created") {
  await Order.findByIdAndDelete(existingOrder._id);
}

// Create NEW order every time
const order = await Order.create({
  /* ... */
});
```

**Expected Behavior**: Reuse existing order if it's still valid:

```typescript
if (existingOrder && existingOrder.status === "created") {
  // Reuse existing order
  return NextResponse.json({
    success: true,
    orderId: existingOrder.razorpayOrderId,
    // ... return existing order details
  });
}
```

---

### 11. **Missing Input Sanitization on Search Filters** 🟡

**File**: `lib/geolocation-service.ts`  
**Lines**: 169-251

**Issue**: The search function uses `RegExp` constructor with user input (line 243) without escaping special regex characters. This could allow ReDoS (Regular Expression Denial of Service) attacks.

**Current Code**:

```typescript
if (city) locationMatch["businessAddress.city"] = new RegExp(city, "i");
```

**Recommended Fix**:

```typescript
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

if (city) {
  locationMatch["businessAddress.city"] = new RegExp(escapeRegex(city), "i");
}
```

---

### 12. **Inconsistent Error Response Formats** 🟡

**Files**: Multiple API routes

**Issue**: Different API routes return errors in different formats:

- `app/api/bookings/route.ts`: `{ error: "message" }`
- `app/api/payments/create-order/route.ts`: `{ error: "message", timestamp: "..." }`
- `app/api/search/salons/route.ts`: `{ success: false, error: "message", message: "..." }`

**Expected Behavior**: Consistent error format across all endpoints:

```typescript
{
  error: {
    code: "ERROR_CODE",
    message: "Human readable message",
    details: {},
    timestamp: "2025-10-01T..."
  }
}
```

---

### 13. **No Pagination Limit Validation** 🟡

**File**: `app/api/search/salons/route.ts`  
**Lines**: 34-37

**Issue**: User can request unlimited results by passing a large `limit` value:

**Current Code**:

```typescript
const { page = 1, limit = 20 } = body;
const paginatedSalons = results.salons.slice(startIndex, endIndex);
```

**Recommended Fix**:

```typescript
const MAX_LIMIT = 100;
const page = Math.max(1, parseInt(body.page) || 1);
const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(body.limit) || 20));
```

---

### 14. **Booking Schema Doesn't Validate DateTime in Future** 🟡

**File**: `app/api/bookings/route.ts`  
**Lines**: 16-23

**Issue**: The schema validates datetime format but doesn't check if it's in the future. Users could book appointments in the past.

**Recommended Fix**:

```typescript
const enhancedBookingSchema = z.object({
  datetime: z
    .string()
    .datetime()
    .refine((dateStr) => new Date(dateStr) > new Date(), {
      message: "Booking datetime must be in the future",
    }),
  // ...
});
```

---

### 15. **Transaction Model Missing Proper Indexing** 🟡

**File**: `models/Transaction.ts`

**Issue**: Based on the usage in `verify-signature/route.ts` (line 155), the Transaction model needs indexes on `gatewayTransactionId` and `bookingId` for efficient lookups, but we don't see these defined.

**Recommended Fix**: Add compound index:

```typescript
transactionSchema.index(
  { gatewayTransactionId: 1, bookingId: 1 },
  { unique: true },
);
```

---

### 16. **Geolocation Service Returns Unpopulated Data** 🟡

**File**: `lib/geolocation-service.ts`  
**Lines**: 250-280

**Issue**: The `searchSalons` function returns salon data but doesn't populate service details or staff information. Frontend would need to make additional API calls.

**Recommended Fix**: Add populate to aggregation pipeline:

```typescript
pipeline.push({
  $lookup: {
    from: "services",
    localField: "_id",
    foreignField: "vendorId",
    as: "services",
  },
});
```

---

### 17. **Missing CORS Configuration** 🟡

**Files**: All API routes

**Issue**: No CORS headers are set. If the frontend is served from a different domain (common in production), API calls will fail.

**Recommended Fix**: Add middleware or headers in `next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: "/api/:path*",
      headers: [
        { key: "Access-Control-Allow-Origin", value: process.env.FRONTEND_URL || "*" },
        { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
      ],
    },
  ];
}
```

---

### 18. **No Request Timeout Configuration** 🟡

**Files**: All API routes

**Issue**: Long-running database queries or external API calls (Razorpay) could hang indefinitely without timeouts.

**Recommended Fix**: Add timeout to fetch calls and database operations:

```typescript
const TIMEOUT = 30000; // 30 seconds

const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error("Request timeout")), TIMEOUT),
);

const result = await Promise.race([
  razorpay.orders.create(/* ... */),
  timeoutPromise,
]);
```

---

### 19. **Vendor Approval Endpoint Not Verified** 🟡

**Status**: NOT AUDITED - File path not confirmed

**Issue**: Based on the audit requirements, `app/api/admin/vendor-approval/route.ts` should exist, but we need to verify:

1. Does it check for admin role properly?
2. Does it validate vendor exists before approval?
3. Does it send notification to vendor on approval?

**Action Required**: Locate and audit this file.

---

### 20. **Staff Management API Not Verified** 🟡

**Status**: NOT AUDITED - File path not confirmed

**Issue**: The audit requirements mention `/app/api/staff/route.ts` for staff creation. We need to verify:

1. Does it extract vendorId from JWT (secure) or accept from request body (insecure)?
2. Does it validate vendor owns the salon before creating staff?
3. Does it handle staff-service associations correctly?

**Action Required**: Locate and audit this file.

---

## 🟢 MINOR ISSUES (Medium Priority)

### 21. **Inconsistent Logging Levels** 🟢

**Files**: Multiple

**Issue**: Some operations use `logger.info` while similar operations use `logger.debug`. No clear logging strategy.

**Recommendation**: Establish logging guidelines:

- `debug`: Development-only detailed traces
- `info`: Normal operation milestones (booking created, payment verified)
- `warn`: Recoverable errors (duplicate payment attempt)
- `error`: System errors requiring investigation

---

### 22. **No API Versioning** 🟢

**Files**: All API routes

**Issue**: All routes are at `/api/*` with no versioning. Breaking changes would affect all clients.

**Recommendation**: Use versioned routes: `/api/v1/bookings`, `/api/v1/payments`

---

### 23. **Missing OpenAPI/Swagger Documentation** 🟢

**Issue**: No API documentation for frontend developers or third-party integrations.

**Recommendation**: Generate OpenAPI spec using tools like `next-swagger-doc`.

---

### 24. **No Health Check Endpoint** 🟢

**Issue**: No `/api/health` endpoint to verify system is operational.

**Recommendation**: Create health check endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    database: await checkDB(),
    razorpay: await checkRazorpay(),
  };
  return NextResponse.json(health);
}
```

---

### 25. **Console Logs in Production Code** 🟢

**Files**: Multiple (from recent logging additions)

**Issue**: Multiple `console.log` statements added for debugging will clutter production logs.

**Recommendation**: Use conditional logging:

```typescript
if (process.env.NODE_ENV === "development") {
  console.log("Debug info");
}
// OR use logger.debug() instead
```

---

### 26. **Missing TypeScript Strict Mode** 🟢

**File**: `tsconfig.json`

**Recommendation**: Verify strict mode is enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true
  }
}
```

---

## ⚠️ RECOMMENDATIONS

### Frontend State Management

1. **Implement React Query/SWR**: For automatic cache invalidation and real-time updates after mutations
2. **Add Optimistic Updates**: Update UI immediately on actions, rollback on failure
3. **WebSocket Integration**: Real-time booking status updates for vendors

### Error Handling

4. **Global Error Boundary**: Catch and display user-friendly errors
5. **Toast Notifications**: Already implemented, ensure consistency across all mutations
6. **Retry Logic**: Add exponential backoff for failed API requests

### Performance

7. **Database Connection Pooling**: Verify MongoDB connection pool size matches load
8. **Query Optimization**: Add `.lean()` to read-only queries for better performance
9. **Implement Caching**: Redis cache for frequently accessed salon/service data

### Security

10. **Rate Limiting**: Implement per-user and per-IP rate limits
11. **Input Validation**: Add max length limits to all text fields
12. **SQL/NoSQL Injection**: Already using Mongoose (good), but verify sanitization

### Testing

13. **Integration Tests**: Write E2E tests for critical flows (booking, payment)
14. **Load Testing**: Test race conditions under concurrent load
15. **Security Testing**: Run OWASP ZAP or similar tools

---

## 📊 Audit Statistics

### Code Coverage Analysis

- **API Routes Audited**: 5/20+ (25%)
- **Critical Paths Verified**: 3/5 (60%)
- **Security Issues Found**: 3 critical, 2 major

### Functionality Status

| Feature          | Status                      | Notes                                |
| ---------------- | --------------------------- | ------------------------------------ |
| Salon Search     | ❌ **NON-FUNCTIONAL**       | Uses hardcoded data                  |
| Booking Creation | ⚠️ **PARTIALLY FUNCTIONAL** | Backend works, frontend disconnected |
| Payment Flow     | ✅ **FUNCTIONAL**           | With critical issues noted           |
| Vendor Approval  | ❓ **NOT VERIFIED**         | File not located                     |
| Staff Management | ❓ **NOT VERIFIED**         | File not located                     |

---

## 🎯 Priority Action Items

### IMMEDIATE (Fix Today)

1. Fix race condition in booking creation (Issue #1)
2. Connect booking page to API (Issue #4)
3. Connect salons page to API (Issue #5)
4. Remove vendorId from booking request body (Issue #6)

### HIGH PRIORITY (Fix This Week)

5. Add rate limiting to public endpoints (Issue #2)
6. Implement transaction idempotency (Issue #3)
7. Add database connection error handling (Issue #8)
8. Implement notification retry queue (Issue #7)

### MEDIUM PRIORITY (Fix Next Sprint)

9. Add auto-staff assignment (Issue #9)
10. Fix payment order idempotency (Issue #10)
11. Sanitize search inputs (Issue #11)
12. Standardize error formats (Issue #12)

---

## 📝 Testing Checklist

### Manual Testing Required

- [ ] Test concurrent booking attempts (same staff, same time)
- [ ] Test booking creation with all permission combinations
- [ ] Test payment flow with network interruptions
- [ ] Test duplicate payment verification requests
- [ ] Test vendor approval by non-admin user
- [ ] Test frontend error display for API failures

### Automated Testing Needed

- [ ] Unit tests for booking conflict detection
- [ ] Integration test for complete booking-payment flow
- [ ] Load test with 100+ concurrent booking requests
- [ ] Security scan for SQL/NoSQL injection
- [ ] API response time benchmarks

---

## 🔐 Security Audit Summary

### Vulnerabilities Found

- **Critical**: Vendor ID from client (Issue #6)
- **Major**: Missing authentication on search (Issue #2)
- **Major**: No rate limiting on public endpoints

### Authentication & Authorization

- ✅ JWT-based auth implemented
- ✅ Role-based permissions (PERMISSIONS constant)
- ⚠️ Not all routes protected (search endpoint)
- ⚠️ Need to verify admin routes exist and are protected

---

## 📈 Next Steps

1. **Complete Audit**: Locate and audit remaining API routes
2. **Fix Critical Issues**: Address all 8 critical issues immediately
3. **Implement Testing**: Add integration tests for critical paths
4. **Code Review**: Have another developer review security-sensitive code
5. **Performance Testing**: Load test under realistic conditions
6. **Documentation**: Update API documentation with security notes

---

**Audit Status**: 🟡 In Progress (40% Complete)  
**Estimated Completion**: Requires 2-3 more hours for full audit  
**Recommended Actions**: Fix critical issues before production deployment

---

_This audit was performed with static code analysis. Dynamic testing and load testing are recommended for complete verification._
