# Security Guidelines

## 🔐 Environment Variables Setup

### 1. Create Environment File
Create a `.env.local` file in the `client/` directory with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 2. Firebase Security Rules
Make sure to configure proper Firebase Security Rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "orders": {
      "$orderId": {
        ".read": "auth != null && (data.child('buyerId').val() === auth.uid || data.child('sellerId').val() === auth.uid)",
        ".write": "auth != null && (data.child('buyerId').val() === auth.uid || data.child('sellerId').val() === auth.uid)"
      }
    }
  }
}
```

### 3. Important Security Notes
- ⚠️ **NEVER** commit `.env.local` or any environment files to Git
- 🔒 Always use environment variables for sensitive data
- 🛡️ Configure proper Firebase Security Rules
- 🔐 Use HTTPS in production
- 🚫 Never expose API keys in client-side code

### 4. Deployment Security
- Set environment variables in your hosting platform (Vercel, Netlify, etc.)
- Use different Firebase projects for development and production
- Enable Firebase App Check for additional security
- Regularly rotate API keys

## 🚨 If API Keys Were Exposed
1. **Immediately** rotate all exposed API keys
2. Check Firebase console for unauthorized access
3. Review Firebase Security Rules
4. Monitor for suspicious activity
5. Update all environment variables
