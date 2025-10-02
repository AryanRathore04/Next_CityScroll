# About Page - Backend Integration Documentation

## Overview

The About page has been enhanced with proper backend integration, TypeScript typing, and database connectivity. This document outlines all changes made to improve the About page functionality.

## Changes Summary

### 1. Fixed Issues in About Page (`app/about/page.tsx`)

- ✅ Added proper TypeScript interfaces for all data types
- ✅ Improved code organization and type safety
- ✅ Added error handling with user-friendly error messages
- ✅ Implemented loading states
- ✅ Added dynamic data fetching from backend APIs
- ✅ Maintained fallback data for resilience

### 2. Backend API Implementation

#### Platform Statistics API (`app/api/platform-stats/route.ts`)

**Endpoint:** `GET /api/platform-stats`

**Purpose:** Fetches real-time platform statistics from the database

**Data Returned:**

```typescript
{
  totalCustomers: number,      // Count of active customers
  totalVendors: number,         // Count of approved/active vendors
  totalCities: number,          // Count of unique cities with vendors
  averageRating: number,        // Average rating from all published reviews
  lastUpdated: string          // ISO timestamp
}
```

**Features:**

- Queries User and Review collections
- Excludes suspended users
- Only counts approved/active vendors
- Calculates average from published reviews
- Includes caching headers (1 hour cache)
- Proper error handling

**Caching:**

- Public cache for 1 hour (s-maxage=3600)
- Stale while revalidate for 2 hours

#### Company Info API (`app/api/company-info/route.ts`)

**Endpoints:**

- `GET /api/company-info` - Fetch company information
- `PUT /api/company-info` - Update company information (Admin only - TODO: Add auth)

**Purpose:** Manages dynamic content for the About page

**Data Structure:**

```typescript
{
  story: {
    title: string,
    paragraphs: string[],
    image: string
  },
  values: [{
    icon: string,        // Icon name from lucide-react
    title: string,
    description: string
  }],
  team: [{
    name: string,
    role: string,
    image: string,
    description: string,
    order: number
  }],
  cta: {
    title: string,
    description: string,
    primaryButtonText: string,
    primaryButtonLink: string,
    secondaryButtonText: string,
    secondaryButtonLink: string
  },
  seo: {
    title: string,
    description: string,
    keywords: string[]
  },
  isActive: boolean
}
```

**Features:**

- Auto-creates default data if none exists
- Supports single active record
- Includes caching headers
- Full CRUD support (update endpoint included)

### 3. Database Model

#### CompanyInfo Model (`models/CompanyInfo.ts`)

**Collection:** `companyinfos`

**Purpose:** Stores dynamic content for the About page

**Schema Features:**

- Comprehensive validation
- Default values for all fields
- String length limits for security
- Indexed fields for performance
- Timestamps (createdAt, updatedAt)
- Team member ordering

**Indexes:**

- `isActive: 1` - Quick lookup of active record
- `updatedAt: -1` - Recent updates

**Pre-hooks:**

- Automatically sorts team members by order

### 4. Seed Script (`scripts/seed-company-info.js`)

**Purpose:** Populate the database with initial company information

**Usage:**

```bash
node scripts/seed-company-info.js
```

**Features:**

- Checks for existing data before seeding
- Creates default company info with sample data
- Proper error handling
- MongoDB connection management

## Database Queries

### Platform Stats Queries

1. **Total Customers:**

   ```javascript
   User.countDocuments({
     userType: "customer",
     status: { $ne: "suspended" },
   });
   ```

2. **Total Vendors:**

   ```javascript
   User.countDocuments({
     userType: "vendor",
     status: { $in: ["approved", "active"] },
   });
   ```

3. **Total Cities:**

   ```javascript
   User.aggregate([
     {
       $match: { userType: "vendor", status: { $in: ["approved", "active"] } },
     },
     { $group: { _id: "$businessAddress.city" } },
     { $count: "totalCities" },
   ]);
   ```

4. **Average Rating:**
   ```javascript
   Review.aggregate([
     { $match: { status: "published" } },
     { $group: { _id: null, averageRating: { $avg: "$rating" } } },
   ]);
   ```

## Frontend Integration

### Data Flow

1. Page loads → Shows loading spinner
2. Parallel API calls to `/api/platform-stats` and `/api/company-info`
3. Data received → Updates state
4. If error → Shows error alert + uses fallback data
5. Renders page with dynamic or fallback content

### Error Handling

- Network errors caught and logged
- User-friendly error messages displayed
- Automatic fallback to hardcoded data
- No page crashes due to API failures

### Performance Optimizations

1. **Parallel API Calls:** Uses `Promise.all()` for simultaneous requests
2. **Caching:** Both APIs implement HTTP caching
3. **Lazy Loading:** Images use `priority={false}` for non-critical content
4. **Minimal Re-renders:** Proper state management with `useState`

## Testing Checklist

### Manual Testing

- [ ] Visit `/about` page
- [ ] Verify all stats display correctly
- [ ] Check all sections render properly
- [ ] Test responsive design (mobile/tablet/desktop)
- [ ] Verify navigation buttons work
- [ ] Test with network offline (should show fallback data)
- [ ] Check browser console for errors

### API Testing

```bash
# Test platform stats API
curl http://localhost:3000/api/platform-stats

# Test company info API
curl http://localhost:3000/api/company-info

# Test company info update (requires auth)
curl -X PUT http://localhost:3000/api/company-info \
  -H "Content-Type: application/json" \
  -d '{"story": {...}, "values": [...], "team": [...]}'
```

### Database Testing

```javascript
// MongoDB queries to verify data
db.users.countDocuments({ userType: "customer" });
db.users.countDocuments({
  userType: "vendor",
  status: { $in: ["approved", "active"] },
});
db.reviews.aggregate([
  { $match: { status: "published" } },
  { $group: { _id: null, avg: { $avg: "$rating" } } },
]);
db.companyinfos.findOne({ isActive: true });
```

## Future Enhancements

### Short Term

1. Add authentication middleware to PUT endpoint
2. Add role-based access control (admin only for updates)
3. Implement audit logging for content changes
4. Add image upload functionality for team photos

### Long Term

1. Multi-language support (i18n)
2. A/B testing for CTA buttons
3. Analytics integration (track button clicks)
4. Content versioning and history
5. Admin dashboard for content management
6. Testimonials section with customer reviews
7. Dynamic values section (add/remove values)
8. Video content support for story section

## Environment Variables Required

Ensure these are set in `.env.local`:

```env
MONGODB_URI=mongodb://...
```

## Dependencies

- `mongoose` - MongoDB ODM
- `next` - Next.js framework
- `react` - React library
- `lucide-react` - Icon library

## File Structure

```
app/
├── about/
│   └── page.tsx                 # About page component (enhanced)
├── api/
│   ├── platform-stats/
│   │   └── route.ts            # Platform statistics API
│   └── company-info/
│       └── route.ts            # Company info CRUD API
models/
└── CompanyInfo.ts              # CompanyInfo database model
scripts/
└── seed-company-info.js        # Database seed script
```

## Notes

- All APIs include proper error handling
- TypeScript types ensure type safety
- Fallback data prevents blank pages
- Caching improves performance
- Database indexes optimize queries

## Support

For issues or questions, check:

1. MongoDB connection status
2. API endpoint responses in Network tab
3. Browser console for JavaScript errors
4. Server logs for backend errors

---

**Last Updated:** October 2, 2025
**Author:** AI Assistant
**Version:** 1.0.0
