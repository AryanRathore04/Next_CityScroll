# Environment Variables Configuration

This file documents the required environment variables for secure operation of the CityScroll application.

## Required Environment Variables

### Firebase Configuration (Client-side)

These variables are prefixed with `NEXT_PUBLIC_` and are exposed to the client-side code:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### Firebase Admin SDK (Server-side)

**CRITICAL**: This contains sensitive service account credentials and must be kept secure:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

### Rate Limiting (Optional - for Vercel KV)

```env
KV_REST_API_URL=https://your-kv-store.upstash.io
KV_REST_API_TOKEN=your-kv-token
```

## Security Best Practices

### 1. Firebase Service Account Setup

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Convert the entire JSON content to a single-line string (remove newlines)
5. Set as `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable

### 2. Environment Variable Security

- **NEVER** commit the `.env` file to version control
- Add `.env*` to your `.gitignore` file
- Use different service accounts for different environments (dev, staging, prod)
- Rotate service account keys regularly
- Use Vercel/your hosting platform's secure environment variable storage

### 3. Firebase Security Rules

Ensure you have strict Firestore security rules. Example:

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Only admins can read all users
    match /users/{document=**} {
      allow read: if request.auth != null && request.auth.token.role == 'admin';
    }

    // Vendors can only manage their own services
    match /services/{serviceId} {
      allow read: if true; // Public read
      allow write: if request.auth != null &&
        (request.auth.token.role == 'admin' ||
         resource.data.vendorId == request.auth.uid);
    }

    // Bookings are private to user and vendor
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.userId ||
         request.auth.uid == resource.data.vendorId ||
         request.auth.token.role == 'admin');
    }
  }
}
```

### 4. Storage Security Rules

```javascript
// Firebase Storage Security Rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload to their own folder
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Public read for vendor images
    match /vendors/{vendorId}/images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null &&
        (request.auth.uid == vendorId || request.auth.token.role == 'admin');
    }
  }
}
```

## Development vs Production

### Development

- Use a separate Firebase project for development
- Use test data and mock services where possible
- Enable Firebase Auth emulator for local testing

### Production

- Use production Firebase project with strict security rules
- Enable Firebase App Check for additional security
- Set up monitoring and alerting
- Use HTTPS only (handled by Vercel/hosting platform)
- Enable audit logs for admin actions

## Vercel Deployment

When deploying to Vercel:

1. Add environment variables in Vercel dashboard:

   - Go to Project Settings → Environment Variables
   - Add each variable for Production, Preview, and Development environments
   - Ensure `FIREBASE_SERVICE_ACCOUNT_JSON` is added as a single-line string

2. Ensure proper build settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

## Monitoring and Security

### Enable Firebase Security Monitoring

1. Firebase Console → Authentication → Settings → Advanced
2. Enable "Email enumeration protection"
3. Enable "SMS multi-factor authentication"
4. Set up proper password policy

### Set up Alerts

1. Create alerts for failed authentication attempts
2. Monitor admin actions
3. Set up error tracking (Sentry integration recommended)
4. Monitor API rate limits and unusual traffic patterns

## Troubleshooting

### Common Issues

1. **Service Account JSON Error**: Ensure the JSON is properly formatted as a single line
2. **CORS Issues**: Check Firebase project settings and domain configuration
3. **Rate Limiting**: Verify KV*REST_API*\* variables are set correctly
4. **Authentication Failures**: Check that custom claims are set properly for roles

### Debugging

- Check server logs for detailed error messages
- Use Firebase Console → Authentication to verify user creation
- Use Firestore Console to verify data writes
- Test API endpoints with proper Authorization headers
