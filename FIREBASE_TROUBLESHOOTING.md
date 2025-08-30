# Firebase Integration Troubleshooting Guide

## Common Issues and Solutions

### 1. Import Resolution Errors

**Error**: `Failed to resolve import "firebase/functions"`

**Causes**:
- Missing Firebase dependencies
- Vite/bundler configuration issues
- Unused imports causing tree-shaking problems

**Solutions**:
```javascript
// 1. Ensure Firebase is installed
npm install firebase

// 2. Update vite.config.js
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['firebase/functions', 'firebase/app']
  }
})

// 3. Remove unused imports
// Only import what you actually use
import { functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
```

### 2. Firestore Permission Errors

**Error**: `Missing or insufficient permissions`

**Solutions**:
- Ensure user is authenticated
- Check Firestore security rules
- Verify user roles are properly set

```javascript
// Check if user is authenticated
if (!user) {
  throw new Error('User must be authenticated');
}

// Set custom claims for roles
await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
```

### 3. Cloud Functions Deployment Issues

**Common Problems**:
- Node.js version mismatch
- Missing dependencies
- Incorrect project configuration

**Solutions**:
```bash
# 1. Install dependencies
cd functions
npm install

# 2. Set correct project
firebase use your-project-id

# 3. Deploy functions
firebase deploy --only functions
```

### 4. LatLng Conversion Errors

**Error**: `LinkedMap<String, dynamic> is not a subtype of LatLng`

**Solution**: Update firestore_util.dart
```dart
// Handle LatLng stored as Map (latitude/longitude keys)
if (value is Map && value.containsKey('latitude') && value.containsKey('longitude')) {
  try {
    double lat = (value['latitude'] as num).toDouble();
    double lng = (value['longitude'] as num).toDouble();
    value = LatLng(lat, lng);
  } catch (e) {
    print('Error converting Map to LatLng: $e');
  }
}
```

### 5. Development Server Issues

**Problem**: Hot reload not working with Firebase

**Solution**:
```bash
# Clear cache and restart
rm -rf node_modules
npm install
npm run dev
```

### 6. Authentication Context Issues

**Problem**: User context not available

**Solution**:
```javascript
// Ensure AuthProvider wraps your app
function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <YourComponents />
      </AdminProvider>
    </AuthProvider>
  );
}
```

## Best Practices

### 1. Error Handling
```javascript
try {
  const result = await cloudFunction(data);
  return result;
} catch (error) {
  console.error('Cloud function error:', error);
  throw new Error(`Operation failed: ${error.message}`);
}
```

### 2. Loading States
```javascript
const [loading, setLoading] = useState(false);

const handleOperation = async () => {
  setLoading(true);
  try {
    await operation();
  } finally {
    setLoading(false);
  }
};
```

### 3. Security Rules Structure
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function hasRole(role) {
      return isAuthenticated() && 
             request.auth.token.role == role;
    }
    
    match /orders/{orderId} {
      allow read: if isAuthenticated();
      allow write: if hasRole('admin') || hasRole('restaurant');
    }
  }
}
```

## Debugging Commands

```bash
# Check Firebase project
firebase projects:list

# Check active project
firebase use

# Test Firestore rules
firebase firestore:rules test

# View function logs
firebase functions:log

# Emulator debugging
firebase emulators:start
```

## Environment Setup

### Development
```javascript
// .env.development
VITE_FIREBASE_PROJECT_ID=your-dev-project
VITE_FIREBASE_API_KEY=your-dev-api-key
```

### Production
```javascript
// .env.production
VITE_FIREBASE_PROJECT_ID=your-prod-project
VITE_FIREBASE_API_KEY=your-prod-api-key
```
