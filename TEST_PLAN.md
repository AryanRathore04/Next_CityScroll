TEST_PLAN — Multi-Vendor Salon Platform

Date: 2025-09-28

## Overview

This file is a comprehensive manual testing plan for the CityScroll multi-vendor salon and spa booking platform. It contains:

- API endpoint smoke tests
- End-to-end user journeys for Customer, Vendor, and Admin roles
- Security & permissions tests
- Test data suggestions, automation recommendations, and triage matrix

Use this plan for manual verification or to translate into automated tests (Postman, Jest+Supertest, Playwright/Cypress).

1. API Endpoint Smoke Test Plan

---

Purpose: Quickly validate critical endpoints for correct responses and permission enforcement.

Instructions: Replace placeholders (e.g., <JWT>, <VENDOR_ID>) with actual values from your test environment.

- API-01 POST /api/auth/register

  - Action: POST JSON { name, email, password, role: "customer" } to /api/auth/register
  - Expected: 201 Created (or 200) and JSON with user id and role. No password returned.

- API-02 POST /api/auth/signin

  - Action: POST JSON { email, password } to /api/auth/signin
  - Expected: 200 OK and JSON containing a valid JWT and user profile info (id, email, role).

- API-03 GET /api/salons

  - Action: GET request to /api/salons without authentication
  - Expected: 200 OK and JSON array of salons. Each salon should minimally include id, name, location, and services summary.

- API-04 POST /api/bookings (Customer)

  - Action: Authenticated POST as Customer to /api/bookings with body { salonId, serviceId, staffId (or staffPreference: "any"), datetime (ISO), contact }
  - Expected: 201 Created with booking id, booking status (pending/confirmed), and echoed details. If payment required, response includes payment/order id.

- API-05 GET /api/vendor/bookings (Vendor)

  - Action: Authenticated GET as Vendor to /api/vendor/bookings
  - Expected: 200 OK with array of bookings for that vendor only. Each booking contains customerName, service, staff, time, status.

- API-06 POST /api/admin/vendor-approval (Admin)
  - Action: Authenticated POST as Admin to /api/admin/vendor-approval with { vendorId, action: "approve" | "reject" }
  - Expected: 200 OK with updated vendor status and optional notification record. Unauthorized users get 403.

Recording: For each, capture HTTP status, response body snapshot (or error), and pass/fail.

2. End-to-End User Journey Tests

---

Test these flows on staging or local with production-like seed data. Use incognito sessions for each role to avoid session overlap.

## A. Customer Journey

Pre-req: Razorpay test keys configured. At least one salon with at least one staff and service.

CUST-01 Registration & Login

- Steps:
  1. Visit /signup and complete form with name, unique email (customer+1@test), password.
  2. Confirm registration success message or automatic login.
  3. If not auto-logged-in, go to /signin and log in.
- Expected:
  - Account created in DB with role "customer".
  - Sign-in returns JWT and redirects to dashboard/homepage.

CUST-02 Search & Discovery

- Steps:
  1. On homepage or /salons, search by location (e.g., "Downtown") and service name (e.g., "haircut").
  2. Apply filters (price min/max, rating >= 4). Observe results update.
- Expected:
  - Results match search/filter criteria; results show summary info and links to detailed pages.

CUST-03 Salon Viewing

- Steps:
  1. Click a salon. Inspect details page: services, prices, available time slots, staff list, gallery, reviews.
- Expected:
  - All relevant content is visible. Map/geolocation loads if provided.

CUST-04 Multi-Staff Booking

- Steps:
  1. Choose a service and select "Any Available Staff". Pick a valid slot and proceed.
  2. Repeat selecting a specific staff and note differences.
- Expected:
  - Slots update correctly based on staff selection. Booking proceeds only for available slots.

CUST-05 Payment Flow (Razorpay)

- Steps:
  1. Start booking checkout; observe Razorpay modal load.
  2. Use Razorpay test payment method / card, complete payment.
- Expected:
  - Payment completes in test mode. Booking status becomes "confirmed" or "paid". Redirect to success page showing reference and details.

CUST-06 Dashboard & Management

- Steps:
  1. Visit /account or /bookings. View upcoming/past bookings.
  2. Cancel or reschedule (if available).
- Expected:
  - Bookings listed with correct statuses. Cancel/reschedule actions update booking and notify vendor if implemented.

CUST-07 Logout

- Steps:
  1. Click logout.
- Expected:
  - Token/session cleared and user redirected to homepage or /signin.

Edge cases for Customer

- Attempt booking for a past datetime -> expect validation error.
- Try booking overlapping slots -> expect conflict error.

## B. Vendor Journey

Pre-req: Admin account available to approve vendor signups.

VEND-01 Registration & Onboarding

- Steps:
  1. Register as Vendor with business name, email, address, and required fields.
- Expected:
  - Vendor account created with status "pending". UI shows pending approval banner.

VEND-02 Login (Pre-Approval)

- Steps:
  1. Login as vendor before approval.
- Expected:
  - Login allowed but dashboard restricted: shows pending notice and no management actions.

VEND-03 Profile Management (After Approval)

- Steps:
  1. After admin approval, login and edit profile: name, address, description. Save.
- Expected:
  - Changes persisted and shown on public listing/profile.

VEND-04 Service Management

- Steps:
  1. Create service (name, duration, price). Edit price/duration. Delete service.
- Expected:
  - Service CRUD works. When deleting a service with existing bookings, app warns or prevents deletion according to policy.

VEND-05 Staff Management

- Steps:
  1. Add staff, assign services, set weekly availability per staff.
- Expected:
  - Staff listed, services assigned correctly, availability reflected in booking UI.

VEND-06 Booking Management

- Steps:
  1. When a customer books, find booking in vendor dashboard; change status to completed/cancelled if permitted.
- Expected:
  - Booking shows correct customer/service/time info. Status changes propagate to customer view.

VEND-07 Earnings/Payouts

- Steps:
  1. Open earnings/payouts view. Confirm completed bookings and totals.
  2. If payout request exists, trigger it.
- Expected:
  - Earnings numbers align with bookings. Payout requests update vendor account and generate logs.

Edge checks for Vendor

- Verify that overlapping staff availability prevents simultaneous bookings.

## C. Admin Journey

Pre-req: Admin credentials.

ADMIN-01 Login

- Steps:
  1. Sign in as admin user.
- Expected:
  - Admin dashboard loads with options: Users, Vendors, Analytics.

ADMIN-02 Vendor Approval

- Steps:
  1. Visit pending vendor list, view vendor details & documents, click Approve or Reject.
- Expected:
  - Vendor status updated. Vendor receives notification or dashboard reflects change.

ADMIN-03 Post-Approval

- Steps:
  1. Vendor signs in after approval.
- Expected:
  - Vendor has access to full dashboard and can perform normal vendor actions.

ADMIN-04 User Management

- Steps:
  1. View user list; suspend or delete a user account.
- Expected:
  - Suspended user cannot login; deleted user is removed or anonymized per policy.

ADMIN-05 Analytics Dashboard

- Steps:
  1. View metrics: total revenue, bookings count, active vendors. Try date filters.
- Expected:
  - Metrics displayed and match DB aggregates for given windows.

3. Security & Permissions Tests

---

SEC-01 Unauthorized Access

- Steps:
  1. While logged out, visit /vendor-dashboard and /admin UI and attempt API calls to protected endpoints.
- Expected:
  - Redirect to /signin or 401/403 for API calls.

SEC-02 Incorrect Role Access (Customer -> Admin)

- Steps:
  1. Login as Customer and attempt to open /admin or call admin APIs.
- Expected:
  - 403 Forbidden or Access Denied.

SEC-03 Incorrect Role Access (Vendor -> Admin)

- Steps:
  1. Login as Vendor and attempt admin routes/endpoints.
- Expected:
  - 403 Forbidden.

SEC-04 Cross-Account Data Access

- Steps:
  1. Login as Vendor A. Attempt GET /api/vendor/bookings?vendorId=<VendorB_ID> or access bookings of Vendor B.
- Expected:
  - 403 Forbidden or empty results. API should validate vendor identity via token.

SEC-05 JWT Tampering

- Steps:
  1. Modify local token payload role to 'admin' (without re-signing) and call admin endpoints.
- Expected:
  - Server rejects the token (signature invalid) and returns 401/403.

SEC-06 Mass Assignment

- Steps:
  1. Attempt to update restricted fields (isAdmin, balance) through user update endpoints.
- Expected:
  - Server ignores or rejects privileged fields.

SEC-07 Input Validation / XSS / Injection

- Steps:
  1. Submit script tags or SQL-like payloads into text fields (salon name, reviews).
- Expected:
  - UI sanitizes or escapes input; no script execution.

SEC-08 File Uploads

- Steps:
  1. Upload disallowed types and oversized files.
- Expected:
  - Upload rejected; files sanitized and stored securely.

SEC-09 Rate Limiting & Bruteforce

- Steps:
  1. Simulate many failed login attempts.
- Expected:
  - Rate limiting or account lockout triggers.

SEC-10 CSRF and CORS

- Steps:
  1. If cookies used for auth, attempt cross-origin POST to change state.
- Expected:
  - CSRF protection (tokens or SameSite) prevents forged requests.

SEC-11 Sensitive Data Exposure

- Steps:
  1. Inspect API responses for secrets (passwords, card data).
- Expected:
  - Sensitive data not returned in API responses.

4. Test Data and Accounts

---

Suggested staging test accounts:

- Customer: customer+1@example.test / Password123!
- Vendor: vendor+1@example.test / Password123! (needs admin approval)
- Admin: admin@example.test / AdminPass!

Seed data:

- 2-3 salons with services and staff covering multiple schedules, price ranges, and ratings.
- Razorpay sandbox keys for payment testing.

5. Automation & CI Recommendations

---

- API smoke tests: Postman collection (repo includes postman_collection.json) or Supertest + Jest.
- E2E browser tests: Use Playwright (recommended) or Cypress for UI flows including payment modal interactions (mock payment gateway where possible).
- Security scans: Run OWASP ZAP or similar periodically on staging.
- CI Pipeline suggestion:
  1. npm ci
  2. npx tsc --noEmit
  3. npm run build
  4. Run API smoke tests (fast)
  5. Optionally run E2E tests nightly or on release branches

6. Triage Matrix & Recording

---

For each test case record:

- ID
- Environment (staging/local)
- Steps performed
- HTTP status / console logs / screenshots
- PASS/FAIL
- Notes & reproduction steps

Example CSV columns:
Test ID, Environment, Steps Summary, Expected, Actual, Result, Notes, Timestamp, Tester

7. Final Notes

---

- If you want this plan converted to an executable Postman collection or a Playwright test suite, I can scaffold the initial tests for the Customer happy path and the API smoke checks.
- For payment flows, prefer mocking provider webhooks in E2E runs to avoid hitting third-party rate limits in CI.

---

End of TEST_PLAN
