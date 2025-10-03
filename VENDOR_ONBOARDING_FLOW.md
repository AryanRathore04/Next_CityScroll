# Vendor Registration & Onboarding Flow

## Complete Flow Documentation

This document explains the complete vendor registration, approval, and onboarding flow in the BeautyBook application.

---

## 🔄 Complete User Journey

### **Step 1: Vendor Signs Up**

**Location**: `/signup?type=vendor`

**What Happens**:

1. Vendor fills out registration form:

   - First Name, Last Name
   - Email, Phone
   - Password (must be 12+ chars with uppercase, lowercase, number, special char)
   - Agrees to Terms of Service

2. Form submits to `/api/auth/register`:

   - Password is hashed with bcrypt
   - User created in database with:
     ```javascript
     {
       firstName, lastName, email, phone,
       password: hashedPassword,
       userType: "vendor",
       status: "pending_approval",  // ← KEY: Not approved yet!
       verified: false,
       onboardingCompleted: false   // ← Not onboarded yet
     }
     ```

3. Tokens generated and returned:

   - `accessToken` → stored in localStorage
   - `refreshToken` → stored as HttpOnly cookie

4. **User is redirected to `/vendor-dashboard`**

---

### **Step 2: Vendor Lands on Dashboard (First Time)**

**Location**: `/vendor-dashboard`

**What Happens**:

#### A. Dashboard Component Loads

```typescript
useEffect(() => {
  checkOnboardingStatus();
}, [user]);
```

#### B. `checkOnboardingStatus()` Function Executes

1. **Wait for user context**:

   ```typescript
   if (!user?.id) {
     // User not loaded from auth context yet
     setIsLoading(false);
     return;
   }
   ```

2. **Fetch vendor profile** (CRITICAL - must include vendorId):

   ```typescript
   const profileResponse = await fetch(
     `/api/vendor/profile?vendorId=${user.id}`, // ← MUST pass vendorId!
     { headers: { Authorization: `Bearer ${accessToken}` } },
   );
   ```

3. **Check vendor status**:

   ```typescript
   const profileData = await profileResponse.json();
   setVendorStatus(profileData.status);

   if (profileData.status === "pending_approval") {
     // STOP HERE - Show pending approval screen
     setIsLoading(false);
     return;
   }
   ```

#### C. **Pending Approval Screen is Displayed**

**What Vendor Sees**:

- 🕐 Clock icon with yellow background
- "Account Pending Approval" heading
- Message explaining what happens next:
  - Admin team is reviewing registration
  - Will receive email notification when approved
  - Typically takes 24-48 hours
- "Back to Home" and "Sign Out" buttons

**Vendor CANNOT**:

- See onboarding wizard
- Access dashboard
- Create services
- View bookings

---

### **Step 3: Admin Approves Vendor**

**Location**: Admin Dashboard → Vendor Approval Section

**What Happens**:

1. Admin clicks "Approve" button for vendor

2. Request sent to `/api/admin/vendor-approval`:

   ```typescript
   {
     vendorId: "...",
     action: "approve"
   }
   ```

3. **Backend Updates Database**:

   ```typescript
   await User.findByIdAndUpdate(vendorId, {
     status: "approved", // ← Status changes from pending_approval to approved
     updatedAt: new Date(),
   });
   ```

4. **Email Notification Sent**:
   ```typescript
   await sendVendorApprovalEmail(vendor.email, vendorName, businessName);
   ```

**Email Contains**:

- Congratulations message
- 3-step guide to get started
- Direct link to vendor dashboard: `${APP_URL}/vendor-dashboard`
- Professional HTML styling with gradient header

---

### **Step 4: Vendor Logs Back In (After Approval)**

**What Happens**:

#### A. Vendor Signs In

- Enters email/password on `/signin`
- Receives new access token
- Redirected based on userType → `/vendor-dashboard`

#### B. Dashboard Checks Status Again

1. **Fetch vendor profile**:

   ```typescript
   const profileResponse = await fetch(
     `/api/vendor/profile?vendorId=${user.id}`,
   );
   const profileData = await profileResponse.json();
   ```

2. **Status Check**:

   ```typescript
   if (profileData.status === "pending_approval") {
     // Would show pending screen (but status is now "approved")
     return;
   }

   if (profileData.status === "approved") {
     // ✅ Vendor is approved! Check onboarding...
     const onboardingRes = await fetch("/api/vendor/onboarding");
     const { onboardingCompleted } = await onboardingRes.json();

     if (!onboardingCompleted) {
       // Show onboarding wizard
       setShowOnboarding(true);
       return;
     }
   }
   ```

#### C. **Onboarding Wizard is Displayed**

**5-Step Wizard**:

1. **Welcome Screen**:

   - Sparkles icon
   - Welcome message
   - "Let's Get Started" button

2. **Business Profile** (Step 1/4):

   - Business Name \*
   - Business Type (dropdown: Spa, Salon, Ayurvedic, etc.) \*
   - Street Address \*
   - City, State, ZIP Code \*
   - Phone Number \*
   - Description (optional)
   - Saves to `/api/vendor/profile` (PUT)

3. **Add Services** (Step 2/4):

   - Service Name \*
   - Description \*
   - Category (e.g., massage, facial) \*
   - Duration (minutes) \*
   - Price (₹) \*
   - Can add multiple services
   - Each service saves to `/api/vendor/services` (POST)

4. **Upload Images** (Step 3/4):

   - Upload multiple business images
   - Shows gallery preview
   - Can delete images
   - Saves to `/api/vendor/images` (POST)

5. **Complete** (Step 4/4):
   - Success message
   - "Go to Dashboard" button

---

### **Step 5: Onboarding Completion**

**What Happens When "Go to Dashboard" is Clicked**:

1. **Mark onboarding complete**:

   ```typescript
   await fetch("/api/vendor/onboarding", {
     method: "POST",
     headers: { Authorization: `Bearer ${accessToken}` },
   });
   ```

2. **Backend Updates Database**:

   ```typescript
   await User.findByIdAndUpdate(vendorId, {
     onboardingCompleted: true,
     updatedAt: new Date(),
   });
   ```

3. **Recheck Status**:

   ```typescript
   setShowOnboarding(false);
   await checkOnboardingStatus(); // Runs the flow again
   ```

4. **Status Check Result**:
   ```typescript
   // status = "approved" ✅
   // onboardingCompleted = true ✅
   // → Load dashboard data
   await loadVendorData();
   ```

---

### **Step 6: Full Dashboard Access**

**Now Vendor Can**:

- View overview with analytics
- Manage bookings (pending, confirmed, completed)
- Create/edit/delete services
- Add/manage staff members
- Update business profile
- Upload/delete business images
- View revenue and ratings

---

## 🔧 Key Technical Details

### Status Values

```typescript
type VendorStatus =
  | "pending_approval" // Initial state after signup
  | "approved" // After admin approval
  | "rejected" // If admin rejects
  | "suspended" // If admin suspends later
  | "active"; // For customers (not vendors)
```

### Database Schema

```typescript
interface IUser {
  // Auth fields
  email: string;
  password: string; // hashed
  userType: "customer" | "vendor" | "admin";

  // Profile fields
  firstName: string;
  lastName: string;
  phone?: string;

  // Vendor-specific fields
  businessName?: string;
  businessType?: string;
  businessAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  description?: string;
  images?: string[];

  // Status tracking
  status: VendorStatus;
  verified: boolean;
  onboardingCompleted?: boolean;

  // Tokens
  refreshToken?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### API Endpoints

#### Registration

- **POST** `/api/auth/register`
  - Creates user with `status: "pending_approval"`
  - Returns access token and user data

#### Profile

- **GET** `/api/vendor/profile?vendorId={id}`

  - Returns vendor profile including `status` field
  - **MUST** pass vendorId as query parameter

- **PUT** `/api/vendor/profile`
  - Updates vendor profile (auth required)
  - Only vendor can update their own profile

#### Onboarding

- **GET** `/api/vendor/onboarding`

  - Returns `{ onboardingCompleted: boolean }`

- **POST** `/api/vendor/onboarding`
  - Marks onboarding as complete
  - Updates `onboardingCompleted: true` in database

#### Approval

- **POST** `/api/admin/vendor-approval`
  - Admin only
  - Body: `{ vendorId, action: "approve" | "reject", reason? }`
  - Updates vendor status
  - Sends email notification

---

## 🐛 Common Issues & Fixes

### Issue 1: Vendor sees empty dashboard instead of pending approval screen

**Cause**: Missing `vendorId` query parameter in profile fetch
**Fix**: Always use `/api/vendor/profile?vendorId=${user.id}`

### Issue 2: Onboarding wizard shows for unapproved vendors

**Cause**: Checking onboarding before checking approval status
**Fix**: Check approval status FIRST, only show onboarding if approved

### Issue 3: Vendor bypasses approval after completing onboarding

**Cause**: `handleOnboardingComplete` calls `loadVendorData()` directly
**Fix**: Call `checkOnboardingStatus()` instead to recheck approval

### Issue 4: Error "Service validation failed: description is required"

**Cause**: Onboarding wizard not sending description field
**Fix**: Ensure all required fields (name, description, category, duration, price) are included

---

## 📝 Testing Checklist

### New Vendor Registration

- [ ] Sign up as vendor with valid data
- [ ] Verify redirected to `/vendor-dashboard`
- [ ] Verify "Pending Approval" screen is shown
- [ ] Verify NO onboarding wizard appears
- [ ] Verify NO dashboard access

### Admin Approval

- [ ] Sign in as admin
- [ ] Navigate to vendor approval section
- [ ] Approve new vendor
- [ ] Verify status updated to "approved" in database
- [ ] Verify email sent to vendor

### Post-Approval Onboarding

- [ ] Sign in as approved vendor
- [ ] Verify onboarding wizard appears
- [ ] Complete Step 1: Business Profile
- [ ] Complete Step 2: Add at least one service
- [ ] Complete Step 3: Upload images (optional)
- [ ] Click "Go to Dashboard"
- [ ] Verify onboarding marked complete
- [ ] Verify full dashboard access

### Dashboard Access

- [ ] Verify overview tab shows (with empty data if no bookings)
- [ ] Verify can create new service
- [ ] Verify can add staff member
- [ ] Verify can update profile
- [ ] Sign out and sign back in
- [ ] Verify still has dashboard access (no onboarding wizard)

---

## 🔒 Security Notes

1. **Status validation**: All vendor endpoints should check `status === "approved"`
2. **Onboarding bypass**: Even if onboarding not complete, vendor can't create services if not approved
3. **Email enumeration**: Registration errors are generic to prevent email enumeration
4. **Token security**: Refresh tokens stored as HttpOnly cookies, not accessible via JavaScript
5. **Profile updates**: Vendors can only update their own profile (vendorId from JWT, not request body)

---

## 📧 Email Notifications

### Approval Email

**Sent when**: Admin approves vendor
**Contains**:

- Subject: "Welcome to BeautyBook - Your Account is Approved!"
- Congratulations message
- Next steps guide
- Dashboard link
- Beautiful HTML template with gradient header

### Rejection Email

**Sent when**: Admin rejects vendor
**Contains**:

- Subject: "BeautyBook Application Update"
- Professional message
- Reason for rejection (if provided)
- Support contact
- Encouragement to reapply after addressing issues

---

## 🎯 Expected Console Logs (for Debugging)

### During Sign Up:

```
🔵 [AUTH] Starting signup process for email: vendor@example.com
🔵 [AUTH] Sending registration request to server...
🔵 [REGISTER] Starting registration process...
🔵 [REGISTER] Creating new user in database...
🟢 [REGISTER] User created successfully with ID: 68dfbf184c02a20da5072319
🟢 [AUTH] Registration successful, received user data: { status: "pending_approval" }
```

### During Dashboard Load (Unapproved):

```
🔵 [DASHBOARD] Checking onboarding status for user: { userType: "vendor" }
🔵 [DASHBOARD] Fetching vendor profile with vendorId: 68dfbf184c02a20da5072319
🔵 [DASHBOARD] Profile data received: { status: "pending_approval" }
⏸️ [DASHBOARD] Vendor status is pending_approval, showing pending screen
```

### After Approval:

```
🔵 [DASHBOARD] Profile data received: { status: "approved", onboardingCompleted: false }
✅ [DASHBOARD] Vendor is approved, checking onboarding completion
🔵 [DASHBOARD] Onboarding status: { completed: false }
📋 [DASHBOARD] Onboarding not completed, showing wizard
```

### After Onboarding Complete:

```
🔵 [ONBOARDING] Marking onboarding as complete...
✅ [ONBOARDING] Onboarding marked as complete
🔵 [ONBOARDING] Rechecking status after onboarding completion...
✅ [DASHBOARD] Onboarding completed, loading dashboard data
🔵 [DASHBOARD] Loading dashboard data...
```

---

## 🚀 Deployment Checklist

Before deploying:

- [ ] SMTP credentials configured in production `.env`
- [ ] APP_URL set to production domain
- [ ] Database connection string uses production MongoDB
- [ ] Email templates tested with real email addresses
- [ ] Admin account created with proper permissions
- [ ] Rate limiting configured for auth endpoints
- [ ] CORS settings allow frontend domain
- [ ] Error logging enabled (Winston/Sentry)
- [ ] Refresh token rotation enabled
- [ ] SSL certificates valid

---

**Last Updated**: October 3, 2025
**Version**: 2.0
