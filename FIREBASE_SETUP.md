# 🔥 Firebase Setup Instructions for BeautyBook

Follow these steps to set up Firebase for your BeautyBook application.

## 📋 Prerequisites

- Google account
- Node.js installed
- BeautyBook project files

## 🚀 Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `beautybook-app` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

## 🔧 Step 2: Configure Firebase Services

### Enable Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable the following providers:
   - **Email/Password** ✅
   - **Google** ✅ (Configure OAuth consent screen)
   - **Facebook** ✅ (Add Facebook App ID and Secret)

### Set up Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Choose **Start in test mode** (for development)
3. Select your preferred location

### Set up Firebase Storage

1. Go to **Storage** → **Get started**
2. Use default security rules for now
3. Choose the same location as Firestore

## 🔑 Step 3: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps**
3. Click **Add app** → **Web** (</>)
4. Register your app with name: `BeautyBook Web`
5. Copy the Firebase configuration object

## 📁 Step 4: Configure Environment Variables

1. In your project, copy `.env.example` to `.env`:

   ```bash
   cp client/.env.example client/.env
   ```

2. Update `client/.env` with your Firebase config:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key-here
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

## 🗄️ Step 5: Set up Firestore Database Structure

### Create Collections

Your Firestore will automatically create these collections when you use the app:

1. **users** - User profiles (customers and vendors)
2. **vendors** - Detailed vendor business profiles
3. **services** - Services offered by vendors
4. **bookings** - Customer bookings
5. **reviews** - Customer reviews and ratings

### Security Rules (Important!)

Go to **Firestore Database** → **Rules** and update with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Vendors can read/write their own vendor profile
    match /vendors/{vendorId} {
      allow read: if true; // Anyone can read vendor profiles
      allow write: if request.auth != null && request.auth.uid == vendorId;
    }

    // Services are readable by all, writable by vendor owners
    match /services/{serviceId} {
      allow read: if true;
      allow write: if request.auth != null &&
        request.auth.uid == resource.data.vendorId;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.vendorId;
    }

    // Bookings are readable/writable by customer and vendor
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.customerId ||
         request.auth.uid == resource.data.vendorId);
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.customerId;
    }

    // Reviews are readable by all, writable by customer who made booking
    match /reviews/{reviewId} {
      allow read: if true;
      allow write: if request.auth != null &&
        request.auth.uid == resource.data.customerId;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.customerId;
    }
  }
}
```

### Storage Rules

Go to **Storage** → **Rules** and update with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Vendor images
    match /vendors/{vendorId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == vendorId;
    }

    // Service images
    match /services/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 🔐 Step 6: Configure Authentication Providers

### Google Sign-In

1. Go to **Authentication** → **Sign-in method** → **Google**
2. Click **Enable**
3. Add your domain to **Authorized domains**
4. Download the configuration if needed

### Facebook Sign-In

1. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com)
2. Get App ID and App Secret
3. In Firebase, go to **Authentication** → **Sign-in method** → **Facebook**
4. Enter your Facebook App ID and App Secret
5. Copy the OAuth redirect URI and add it to your Facebook App settings

## 🧪 Step 7: Test the Setup

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Try signing up as a new user
3. Test vendor registration
4. Check if data appears in Firestore Console

## 📚 Database Schema Reference

### Users Collection (`users/{uid}`)

```typescript
{
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: "customer" | "vendor";
  createdAt: Date;
  updatedAt: Date;
  // Vendor fields (if userType === "vendor")
  businessName?: string;
  businessType?: string;
  businessAddress?: string;
  city?: string;
  description?: string;
  verified?: boolean;
  rating?: number;
  totalBookings?: number;
}
```

### Vendors Collection (`vendors/{uid}`)

```typescript
{
  uid: string;
  businessName: string;
  businessType: string;
  businessAddress: string;
  city: string;
  phone: string;
  email: string;
  description: string;
  images: string[];
  rating: number;
  totalReviews: number;
  totalBookings: number;
  verified: boolean;
  isOpen: boolean;
  openingHours: {
    [day: string]: { open: string; close: string; closed: boolean };
  };
  amenities: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Services Collection (`services/{serviceId}`)

```typescript
{
  vendorId: string;
  name: string;
  description: string;
  category: string;
  duration: number; // minutes
  price: number;
  imageUrl?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🚀 Step 8: Deploy (Optional)

### Firebase Hosting

1. Install Firebase CLI:

   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:

   ```bash
   firebase login
   ```

3. Initialize hosting:

   ```bash
   firebase init hosting
   ```

4. Build and deploy:
   ```bash
   npm run build
   firebase deploy
   ```

## 🐛 Troubleshooting

### Common Issues

1. **"Firebase: Error (auth/api-key-not-valid)"**

   - Check your API key in `.env` file
   - Ensure domain is added to authorized domains

2. **"Missing or insufficient permissions"**

   - Check Firestore security rules
   - Ensure user is authenticated

3. **Google Sign-In not working**

   - Add your domain to authorized domains
   - Check OAuth consent screen configuration

4. **Environment variables not loading**
   - Ensure `.env` file is in the `client/` directory
   - Variables must start with `VITE_`
   - Restart development server after changes

### Useful Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Firebase
firebase deploy

# View Firestore data
firebase firestore:export backup/

# Check Firebase project
firebase projects:list
```

## 📞 Support

If you encounter issues:

1. Check the [Firebase Documentation](https://firebase.google.com/docs)
2. Review the [Console](https://console.firebase.google.com) for any errors
3. Check browser developer tools for JavaScript errors
4. Ensure all environment variables are correctly set

## 🎉 You're Ready!

Your Firebase backend is now configured and ready to power your BeautyBook application with:

- ✅ User Authentication (Email, Google, Facebook)
- ✅ Real-time Database (Firestore)
- ✅ File Storage
- ✅ Vendor Dashboard
- ✅ Booking System
- ✅ Review System
- ✅ Analytics

Start using your app and watch the data flow in the Firebase Console!
