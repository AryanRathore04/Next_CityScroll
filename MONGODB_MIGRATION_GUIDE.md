# MongoDB Migration Guide

This guide covers the complete migration from Firebase to MongoDB with JWT authentication.

## 🎯 Migration Overview

Your CityScroll application has been successfully migrated from:

- **From:** Firebase Firestore + Firebase Auth
- **To:** MongoDB + JWT Authentication with bcrypt

## 📋 Prerequisites

Before running the application, ensure you have:

1. **MongoDB Database**

   - Local MongoDB instance running on `mongodb://localhost:27017`
   - OR MongoDB Atlas cluster with connection string

2. **Environment Variables**

   - Copy `.env.example` to `.env.local`
   - Configure all required environment variables

3. **Node.js Dependencies**
   - Run `npm install` to ensure all packages are installed

## 🔧 Required Environment Variables

Create a `.env.local` file with the following variables:

```env
# MongoDB Database Configuration
MONGODB_URI=mongodb://localhost:27017/cityscroll

# JWT Authentication Secrets (Generate secure random strings)
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Optional: Email Configuration (for password reset)
EMAIL_FROM=noreply@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🗄️ Database Models

The following MongoDB models have been created:

### User Model (`models/User.ts`)

- Supports customers, vendors, and admin users
- Includes business information for vendors
- bcrypt password hashing
- Email and phone validation
- MongoDB indexes for performance

### Service Model (`models/Service.ts`)

- Vendor services with pricing and categories
- References to vendor (User) model
- Duration, price, and availability tracking

### Booking Model (`models/Booking.ts`)

- Customer bookings with service details
- References to customer, vendor, and service
- Status tracking (pending, confirmed, completed, cancelled)
- Date and time scheduling

## 🔐 Authentication Changes

### JWT Token System

- **Access Token:** Short-lived (15 minutes), used for API authentication
- **Refresh Token:** Long-lived (7 days), used to refresh access tokens
- **Password Security:** bcrypt hashing with salt rounds

### API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/signin` - User sign-in
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/verify` - Token verification
- `POST /api/auth/signout` - User sign-out

### Client-Side Changes

- Updated `hooks/useAuth.tsx` to use JWT tokens
- Token storage in localStorage
- Automatic token refresh handling
- Updated user profile interface

## 🔄 Migration Steps Completed

✅ **Database Setup**

- MongoDB connection utility with caching
- User, Service, and Booking models created
- Database indexes configured

✅ **Authentication System**

- JWT token generation and verification
- bcrypt password hashing
- Auth middleware updated
- All auth API routes migrated

✅ **API Routes Migrated**

- `/api/auth/*` - Complete authentication system
- `/api/admin/vendor-approval` - Admin vendor approval
- `/api/vendor/profile` - Vendor profile management
- `/api/vendor/services` - Service CRUD operations
- `/api/vendor/bookings` - Booking management
- `/api/vendor/analytics` - Vendor analytics
- `/api/health` - System health checks

✅ **Client-Side Updates**

- `useAuth` hook updated for JWT authentication
- User interface updated to match new data structure

✅ **Security & Configuration**

- Updated CSP headers (removed Firebase URLs)
- Environment configuration updated
- Input validation and sanitization maintained

## 🚀 Getting Started

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Setup Environment**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start MongoDB**

   ```bash
   # Local MongoDB
   mongod

   # OR use MongoDB Atlas (configure MONGODB_URI)
   ```

4. **Run Development Server**

   ```bash
   npm run dev
   ```

5. **Test the Application**
   - Visit http://localhost:3000
   - Create a new account via `/signup`
   - Sign in via `/signin`
   - Test vendor features if you're a vendor

## 📝 Testing

The application includes test endpoints and demo data:

- Test vendor ID: `test` or `demo-vendor`
- Health check: `/api/health`
- All API routes support test scenarios

## 🔄 Data Migration (If Needed)

If you have existing Firebase data, you'll need to:

1. **Export Firebase Data**

   - Use Firebase Admin SDK to export collections
   - Convert Firestore documents to MongoDB format

2. **Import to MongoDB**

   - Create scripts to insert data into new MongoDB models
   - Update user passwords (re-hash with bcrypt)
   - Update references between collections

3. **Validation**
   - Verify all data migrated correctly
   - Test authentication with existing users
   - Validate business logic

## 🗑️ Cleanup (Optional)

After confirming everything works:

1. **Remove Firebase Files**

   ```bash
   rm lib/firebase.ts
   rm lib/firebaseAdmin.ts
   ```

2. **Remove Firebase Dependencies**

   ```bash
   npm uninstall firebase firebase-admin
   ```

3. **Update Package.json**
   - Remove Firebase-related scripts if any

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**

   - Verify MongoDB is running
   - Check MONGODB_URI format
   - Ensure network connectivity

2. **JWT Token Issues**

   - Verify JWT_SECRET is set
   - Check token expiration times
   - Clear localStorage if needed

3. **Authentication Errors**

   - Verify bcrypt is working
   - Check password requirements
   - Validate email formats

4. **Model Import Errors**
   - Use relative imports in API routes
   - Ensure models are properly exported
   - Check TypeScript compilation

### Debug Commands

```bash
# Check MongoDB connection
mongosh mongodb://localhost:27017/cityscroll

# View application logs
npm run dev

# Check health endpoint
curl http://localhost:3000/api/health
```

## 📊 Performance Considerations

- **Database Indexes:** All models include performance indexes
- **Connection Pooling:** MongoDB connection is cached in development
- **Token Caching:** JWT verification uses memory caching
- **Rate Limiting:** Maintained from previous security implementation

## 🔒 Security Features Maintained

- Input validation with Zod schemas
- SQL injection prevention (NoSQL injection prevention)
- XSS protection with sanitization
- CSRF protection
- Rate limiting
- Security headers
- Password hashing with bcrypt
- JWT token security

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review environment variables
3. Verify MongoDB connectivity
4. Check application logs
5. Test with provided test endpoints

The migration is complete and your application should now be running on MongoDB with JWT authentication! 🎉
