# Admin Vendor Approval Fix

## 🐛 Issue Found

The admin dashboard was calling the vendor approval API with `?test=true` parameter, which was returning hardcoded test data instead of fetching real vendors from the database. This caused newly registered vendors to not appear in the pending approval list.

---

## ✅ Fix Applied

### Changes Made to `app/admin/page.tsx`

#### 1. **Removed Test Mode from API Call**

**Before (BROKEN)**:

```typescript
const response = await fetch("/api/admin/vendor-approval?test=true", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  },
});
```

**After (FIXED)**:

```typescript
const response = await fetch("/api/admin/vendor-approval", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  },
});
```

#### 2. **Added Comprehensive Logging**

```typescript
console.log("🔵 [ADMIN] Loading pending vendors from database...");
console.log("🔵 [ADMIN] Pending vendors response status:", response.status);
console.log("🟢 [ADMIN] Pending vendors loaded:", {
  count: data.pendingVendors?.length || 0,
  total: data.total,
});
```

#### 3. **Improved Error Handling**

```typescript
if (response.ok) {
  const data = await response.json();
  setPendingVendors(data.pendingVendors || []);
} else {
  const errorText = await response.text();
  console.error("🔴 [ADMIN] Failed to load pending vendors:", errorText);
}
```

#### 4. **Enhanced Vendor Approval Flow**

- Added logging for approval/rejection actions
- Added email confirmation in success message
- Reload vendor list after action to ensure fresh data
- Better error messages with specific error details

---

## 🧪 Testing Instructions

### Test 1: View Pending Vendors

1. **Create a new vendor** (if you haven't already):

   - Go to `/signup?type=vendor`
   - Fill out the form
   - Register as vendor

2. **Sign in as admin**:

   - Email: `admin@beautybook.com`
   - Password: `Admin@123456`

3. **Check admin dashboard**:

   - You should see "Vendor Approval" section
   - Your newly created vendor should appear in the pending list
   - You should also see the 2 pending vendors from the seed data (if not approved yet)

4. **Check browser console** - you should see:
   ```
   🔵 [ADMIN] Loading pending vendors from database...
   🔵 [ADMIN] Pending vendors response status: 200
   🟢 [ADMIN] Pending vendors loaded: { count: 3, total: 3 }
   ```

### Test 2: Approve a Vendor

1. **Click on a pending vendor** in the admin dashboard

2. **Click "Approve" button**

3. **Verify**:

   - Success message appears: "Vendor approved successfully! An email has been sent to the vendor."
   - Vendor disappears from pending list
   - Console shows:
     ```
     🔵 [ADMIN] approving vendor: 68dfbf184c02a20da5072319
     ✅ [ADMIN] Vendor approved successfully: { success: true, ... }
     📧 [EMAIL] Approval email sent to vendor@example.com
     🔵 [ADMIN] Loading pending vendors from database...
     🟢 [ADMIN] Pending vendors loaded: { count: 2, total: 2 }
     ```

4. **Check vendor's email** (if SMTP configured):

   - Should receive approval email with dashboard link

5. **Sign in as the approved vendor**:
   - Should see onboarding wizard
   - Complete onboarding
   - Should get full dashboard access

### Test 3: Reject a Vendor

1. **Create another test vendor** for rejection testing

2. **Sign in as admin**

3. **Click "Reject" on the vendor**

4. **Add optional rejection reason**:

   - e.g., "Business details incomplete"

5. **Verify**:
   - Success message appears
   - Vendor removed from pending list
   - Console shows rejection logged
   - Vendor receives rejection email (if SMTP configured)

---

## 📊 What the API Returns

### GET `/api/admin/vendor-approval`

**Without `?test=true` (CORRECT - Real Data)**:

```json
{
  "success": true,
  "pendingVendors": [
    {
      "id": "68dfbf184c02a20da5072319",
      "businessName": "My Spa",
      "email": "vendor@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "submittedDate": "2025-10-03T12:21:37.000Z",
      "status": "pending_approval"
    }
  ],
  "total": 1
}
```

**With `?test=true` (INCORRECT - Test Data)**:

```json
{
  "success": true,
  "pendingVendors": [
    {
      "id": "test-vendor-1",
      "businessName": "Test Spa & Wellness",
      "email": "test1@example.com",
      "submittedDate": "2025-10-03T12:00:00.000Z",
      "status": "pending_approval"
    },
    {
      "id": "test-vendor-2",
      "businessName": "Test Beauty Salon",
      "email": "test2@example.com",
      "submittedDate": "2025-10-03T12:00:00.000Z",
      "status": "pending_approval"
    }
  ]
}
```

---

## 🔍 Database Query

The API endpoint queries MongoDB for real vendors:

```typescript
const pendingVendors = await User.find({
  userType: "vendor",
  status: "pending_approval",
})
  .select("-password")
  .sort({ createdAt: -1 })
  .limit(50)
  .lean();
```

**This query finds**:

- Users with `userType: "vendor"`
- Status is `pending_approval`
- Sorted by most recent first
- Limited to 50 vendors
- Password excluded from results

---

## 🗂️ Expected Vendors in Database

Based on the seed script (`seed.ts`), you should have:

1. **3 Approved Vendors** (from seed):

   - Status: `"approved"`
   - Can see full dashboard
   - Have services, bookings, reviews

2. **2 Pending Vendors** (from seed):

   - Status: `"pending_approval"`
   - Should appear in admin approval list
   - Waiting for approval

3. **Your New Vendor** (manually created):
   - Status: `"pending_approval"`
   - Should appear in admin approval list
   - Created via signup form

**Total Expected in Pending List**: 3 vendors (2 from seed + 1 new)

---

## 🔧 Troubleshooting

### Issue: No pending vendors showing

**Check**:

1. Are you signed in as admin? (`admin@beautybook.com`)
2. Check browser console for errors
3. Check network tab - is the API call successful?
4. Check MongoDB - do pending vendors exist?

**Solution**:

```bash
# Connect to MongoDB and check
mongo "mongodb+srv://cityscrolldb.mg9wqas.mongodb.net/cityscroll"

# Run query
db.users.find({ userType: "vendor", status: "pending_approval" }).count()
```

### Issue: API returns 401 Unauthorized

**Check**:

1. Is your access token valid?
2. Are you logged in as admin?
3. Check localStorage for `accessToken`

**Solution**:

- Sign out and sign back in as admin
- Clear localStorage and retry

### Issue: API returns 403 Forbidden

**Check**:

- Admin user has correct permissions
- PERMISSIONS.APPROVE_VENDORS is assigned to admin role

**Solution**:

- Check `lib/permissions.ts` - ensure admin has approval permissions
- Verify in database that admin user has correct userType

### Issue: Vendor approved but still shows pending on their dashboard

**Check**:

- Did the status actually update in database?
- Did the vendor refresh their dashboard?
- Is the vendor dashboard checking the correct status?

**Solution**:

- Vendor needs to sign out and sign back in
- Or refresh the browser page
- Check database directly to confirm status

---

## 📝 Console Logs Guide

### When Admin Page Loads:

```
🔵 [ADMIN] Loading pending vendors from database...
🔵 [ADMIN] Pending vendors response status: 200
🟢 [ADMIN] Pending vendors loaded: { count: 3, total: 3 }
```

### When Approving a Vendor:

```
🔵 [ADMIN] approving vendor: 68dfbf184c02a20da5072319
📧 [EMAIL] Preparing to send approve email to vendor: vendor@example.com
✅ [EMAIL] Approval email sent to vendor@example.com
Admin 68dfb4bc6466d80d864ee239 approved vendor 68dfbf184c02a20da5072319. Reason: None
✅ [ADMIN] Vendor approved successfully: { success: true, ... }
🔵 [ADMIN] Loading pending vendors from database...
🟢 [ADMIN] Pending vendors loaded: { count: 2, total: 2 }
```

### When Rejecting a Vendor:

```
🔵 [ADMIN] rejecting vendor: 68dfbf184c02a20da5072319
📧 [EMAIL] Preparing to send reject email to vendor: vendor@example.com
✅ [EMAIL] Rejection email sent to vendor@example.com
Admin 68dfb4bc6466d80d864ee239 rejected vendor 68dfbf184c02a20da5072319. Reason: Business details incomplete
✅ [ADMIN] Vendor rejected successfully: { success: true, ... }
🔵 [ADMIN] Loading pending vendors from database...
🟢 [ADMIN] Pending vendors loaded: { count: 2, total: 2 }
```

### If Error Occurs:

```
🔴 [ADMIN] Failed to load pending vendors: { error: "..." }
🔴 [ADMIN] Error loading pending vendors: Error: ...
🔴 [ADMIN] Failed to approve vendor: { error: "..." }
```

---

## ✅ Verification Checklist

After applying the fix:

- [ ] Admin dashboard loads without errors
- [ ] Vendor Approval section is visible
- [ ] Newly created vendors appear in pending list
- [ ] Seed vendors (with pending_approval status) appear in list
- [ ] Can click on a vendor to see details
- [ ] Can approve a vendor successfully
- [ ] Vendor disappears from pending list after approval
- [ ] Approval email sent (if SMTP configured)
- [ ] Can reject a vendor successfully
- [ ] Rejection reason is optional
- [ ] Console logs show clear debugging information
- [ ] No "test-vendor-1" or "test-vendor-2" in production data

---

## 🚀 Summary

**What Changed**:

- Removed `?test=true` from admin API call
- Now fetches real vendors from MongoDB
- Added comprehensive logging for debugging
- Improved error handling and user feedback

**Result**:

- ✅ Newly registered vendors now appear in admin dashboard
- ✅ Admin can approve/reject vendors
- ✅ Vendor receives email notification
- ✅ Approved vendors can complete onboarding
- ✅ Clear console logs for debugging

**Next Steps**:

1. Test with a fresh vendor registration
2. Verify vendor appears in admin dashboard
3. Approve the vendor
4. Confirm vendor receives email (if SMTP configured)
5. Sign in as vendor and complete onboarding

---

**Last Updated**: October 3, 2025
**Fix Version**: 1.0
