# Featured Thumbnail Implementation

## 🎯 Feature Overview

This feature allows vendors to upload a **featured thumbnail image** that will be displayed:

- On the home page in the "Featured Salons" section
- In search results
- Anywhere the vendor's business is listed

Previously, all vendors showed hardcoded placeholder images from Unsplash. Now each vendor can upload their own unique thumbnail.

---

## 📋 Implementation Details

### **1. Frontend Changes**

#### `app/vendor-dashboard/page.tsx`

**Added**:

- New "Featured Thumbnail" section in the Profile tab
- Visual display of current thumbnail (if set)
- Upload button for setting/changing thumbnail
- File validation (size, type)
- `handleThumbnailUpload()` function
- Responsive design with recommended image specs

**Location**: Profile tab → Featured Thumbnail section (above Gallery Images)

**Features**:

- Shows current thumbnail with "Current Thumbnail" badge
- Upload button changes text based on state ("Upload" / "Change" / "Uploading...")
- Placeholder message if no thumbnail set
- File size validation (max 5MB)
- File type validation (images only)
- Automatic refresh after upload

#### `services/vendor.ts`

**Updated**:

- Added `profileImage?: string` to `VendorProfile` interface
- This field now included in all vendor profile API calls

### **2. Backend Changes**

#### `app/api/vendor/thumbnail/route.ts` (NEW)

**Endpoint**: `POST /api/vendor/thumbnail`

**Authentication**: Required (vendor only)

**Request**:

- `Content-Type`: `multipart/form-data`
- Body: FormData with `thumbnail` file

**Validations**:

- File type must be an image
- File size max 5MB
- Only vendors can upload
- Authentication required

**Response**:

```json
{
  "success": true,
  "message": "Thumbnail uploaded successfully",
  "thumbnailUrl": "data:image/jpeg;base64,..."
}
```

**Process**:

1. Receive file from FormData
2. Validate file type and size
3. Convert to base64 (temporary solution)
4. Update `User.profileImage` in MongoDB
5. Return success with thumbnail URL

**Note**: Currently stores base64 in database. For production, should upload to cloud storage (S3, Cloudinary, etc.)

#### `models/User.ts`

**Already Exists**:

- `profileImage?: string` field in User model schema
- Used to store the featured thumbnail URL

### **3. Home Page Display**

#### `app/page.tsx`

**Already Implemented**:

```typescript
const salons: FeaturedSalon[] = (result.data?.salons || []).map(
  (vendor: any) => ({
    id: vendor._id,
    name: vendor.businessName,
    image:
      vendor.profileImage ||
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop",
    // ... other fields
  }),
);
```

**Behavior**:

- If vendor has `profileImage` → uses it
- If no `profileImage` → falls back to Unsplash placeholder
- Images displayed in 400x400 aspect ratio

---

## 🎨 User Interface

### **Profile Tab - Featured Thumbnail Section**

```
┌─────────────────────────────────────────────────────┐
│ Featured Thumbnail                                   │
│ This image will be displayed as your business       │
│ thumbnail on the home page and in search results.   │
│                                                      │
│ ┌───────────────────────────────────┐               │
│ │                                   │               │
│ │    [Current Thumbnail Image]      │               │
│ │                                   │               │
│ │  ┌──────────────────┐            │               │
│ │  │ Current Thumbnail │            │               │
│ │  └──────────────────┘            │               │
│ └───────────────────────────────────┘               │
│                                                      │
│ [📷 Change Thumbnail]  Recommended: 1200x800px      │
│                        max 5MB                      │
└─────────────────────────────────────────────────────┘
```

**If No Thumbnail Set**:

```
┌─────────────────────────────────────────────────────┐
│ Featured Thumbnail                                   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │            🖼️                               │   │
│  │  No featured thumbnail set yet.            │   │
│  │  Upload a featured image to make your      │   │
│  │  business stand out!                       │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│ [📷 Upload Thumbnail]  Recommended: 1200x800px      │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Instructions

### **Test 1: Upload Featured Thumbnail**

1. **Sign in as an approved vendor**
2. **Go to Vendor Dashboard** → Profile tab
3. **Scroll to "Featured Thumbnail" section**
4. **Click "Upload Thumbnail" button**
5. **Select an image** (JPG, PNG, WebP, etc.)
6. **Wait for upload** (shows "Uploading..." state)
7. **Verify**:
   - Success message appears
   - Thumbnail displays with "Current Thumbnail" badge
   - Button text changes to "Change Thumbnail"

### **Test 2: Change Existing Thumbnail**

1. **Upload a thumbnail** (if not already done)
2. **Click "Change Thumbnail" button**
3. **Select a different image**
4. **Verify**:
   - New thumbnail replaces old one
   - Success message appears
   - Dashboard shows updated image

### **Test 3: Thumbnail on Home Page**

1. **Upload thumbnail as vendor**
2. **Sign out**
3. **Go to home page** (`/`)
4. **Scroll to "Featured Salons" section**
5. **Verify**:
   - Your business appears with YOUR thumbnail
   - Not showing Unsplash placeholder
   - Image loads correctly
   - Clicking on salon card works

### **Test 4: File Validation**

**Test Large File**:

1. Try uploading image larger than 5MB
2. Should show error: "Image size should be less than 5MB"

**Test Non-Image File**:

1. Try uploading PDF or text file
2. Should show error: "Please upload an image file"

---

## 📊 Database Schema

### **User Model - profileImage Field**

```typescript
{
  profileImage?: string; // Base64 or URL to featured thumbnail

  // Other vendor fields:
  businessName: string;
  businessType: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  images: string[]; // Gallery images (separate from thumbnail)
  // ...
}
```

**Storage Format** (current):

```
data:image/jpeg;base64,/9j/4AAQSkZJRg...
```

**Storage Format** (recommended for production):

```
https://your-cdn.com/thumbnails/vendor-123.jpg
```

---

## 🔧 API Reference

### **POST /api/vendor/thumbnail**

**Upload vendor featured thumbnail**

**Headers**:

```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Body** (FormData):

```
thumbnail: [File]
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Thumbnail uploaded successfully",
  "thumbnailUrl": "data:image/jpeg;base64,..."
}
```

**Error Responses**:

**401 Unauthorized**:

```json
{
  "error": "Authentication required"
}
```

**403 Forbidden**:

```json
{
  "error": "Only vendors can upload thumbnails"
}
```

**400 Bad Request** (No file):

```json
{
  "error": "No thumbnail file provided"
}
```

**400 Bad Request** (Wrong type):

```json
{
  "error": "File must be an image"
}
```

**400 Bad Request** (Too large):

```json
{
  "error": "Image size must be less than 5MB"
}
```

**500 Server Error**:

```json
{
  "error": "Failed to upload thumbnail"
}
```

---

## 🚀 Production Recommendations

### **Current Implementation** (Development/Testing)

- ✅ Stores images as base64 in MongoDB
- ✅ Quick to implement
- ✅ No external dependencies
- ❌ Large database size
- ❌ Slow to load large images
- ❌ Not scalable

### **Recommended for Production**

#### **Option 1: Cloudinary** (Easiest)

```bash
npm install cloudinary
```

```typescript
// app/api/vendor/thumbnail/route.ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// In upload handler:
const result = await cloudinary.uploader.upload(base64Image, {
  folder: "vendor-thumbnails",
  transformation: [
    { width: 1200, height: 800, crop: "fill" },
    { quality: "auto" },
    { fetch_format: "auto" },
  ],
});

const thumbnailUrl = result.secure_url;
```

**Benefits**:

- Automatic image optimization
- CDN delivery
- Multiple formats (WebP, AVIF)
- Responsive images
- Free tier: 25GB storage, 25GB bandwidth

#### **Option 2: AWS S3 + CloudFront**

```bash
npm install @aws-sdk/client-s3
```

```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Upload to S3
await s3Client.send(
  new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `vendor-thumbnails/${vendorId}-${Date.now()}.jpg`,
    Body: buffer,
    ContentType: file.type,
    ACL: "public-read",
  }),
);

const thumbnailUrl = `https://${process.env.CLOUDFRONT_DOMAIN}/vendor-thumbnails/${filename}`;
```

**Benefits**:

- Highly scalable
- Low cost
- Full control
- CloudFront CDN for fast delivery

#### **Option 3: Vercel Blob Storage**

```bash
npm install @vercel/blob
```

```typescript
import { put } from "@vercel/blob";

const blob = await put(`thumbnails/${vendorId}.jpg`, file, {
  access: "public",
  addRandomSuffix: false,
});

const thumbnailUrl = blob.url;
```

**Benefits**:

- Integrated with Vercel deployment
- No configuration needed
- Automatic CDN
- Simple API

---

## 📝 Environment Variables

### **For Production (Cloud Storage)**

Add to `.env.local`:

```bash
# Cloudinary (Option 1)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# OR AWS S3 (Option 2)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your-bucket-name
CLOUDFRONT_DOMAIN=your-domain.cloudfront.net

# OR Vercel Blob (Option 3)
BLOB_READ_WRITE_TOKEN=your_token
```

---

## 🐛 Troubleshooting

### **Issue: Thumbnail not showing on home page**

**Check**:

1. Was thumbnail uploaded successfully?
2. Does vendor profile include `profileImage` field?
3. Is vendor status `approved`?
4. Is vendor in database?

**Solution**:

```bash
# Check MongoDB
db.users.findOne({ _id: ObjectId("vendor_id") }, { profileImage: 1 })

# Should return:
{
  "_id": "...",
  "profileImage": "data:image/jpeg;base64,..."
}
```

### **Issue: Upload fails with 413 Payload Too Large**

**Cause**: File size exceeds server limit

**Solution**:

1. Check Next.js config for body size limit
2. Add to `next.config.ts`:

```typescript
export default {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};
```

### **Issue: Images load slowly**

**Cause**: Base64 images in database

**Solution**: Migrate to cloud storage (see Production Recommendations)

---

## ✅ Feature Checklist

- [x] Add featured thumbnail section to vendor dashboard
- [x] Create thumbnail upload API endpoint
- [x] Add `profileImage` field to VendorProfile type
- [x] Implement file validation (size, type)
- [x] Add upload progress indicator
- [x] Display current thumbnail in dashboard
- [x] Home page uses vendor thumbnails
- [x] Fallback to placeholder if no thumbnail
- [x] Add comprehensive documentation
- [ ] **TODO**: Migrate from base64 to cloud storage
- [ ] **TODO**: Add image cropping/resizing UI
- [ ] **TODO**: Add multiple thumbnail sizes for responsive images
- [ ] **TODO**: Add thumbnail preview before upload

---

## 🎯 Summary

**What This Feature Adds**:

- ✅ Vendors can upload custom featured thumbnails
- ✅ Thumbnails display on home page instead of placeholders
- ✅ Easy to use interface in vendor dashboard
- ✅ File validation for security and performance
- ✅ Automatic refresh after upload

**User Flow**:

1. Vendor completes onboarding
2. Goes to Profile tab in dashboard
3. Uploads featured thumbnail
4. Image appears on home page immediately
5. Can change thumbnail anytime

**Technical Implementation**:

- New API endpoint: `/api/vendor/thumbnail`
- Stores in `User.profileImage` field
- Frontend in vendor dashboard Profile tab
- Displayed on home page via existing code

**Next Steps for Production**:

1. Migrate to cloud storage (Cloudinary recommended)
2. Add image optimization
3. Add responsive images
4. Add image cropping UI

---

**Last Updated**: October 3, 2025
**Version**: 1.0
