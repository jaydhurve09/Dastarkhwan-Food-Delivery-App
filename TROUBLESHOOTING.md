# Dastarkhwan App - Troubleshooting Guide

## Fixed Issues ✅

### 1. LatLng Deserialization Error
**Problem**: `TypeError: Instance of 'LinkedMap<String, dynamic>': type 'LinkedMap<String, dynamic>' is not a subtype of type 'LatLng?'`

**Solution**: 
- Updated `firestore_util.dart` in both apps to handle Map-to-LatLng conversion
- Modified `orders_record.dart` to properly convert Map data to LatLng objects
- Added proper error handling for coordinate conversions

### 2. Firestore Permission Denied Error
**Problem**: `[cloud_firestore/permission-denied] Missing or insufficient permissions`

**Solution**:
- Updated Firestore security rules with proper role-based access control
- Added custom claims for user roles (admin, delivery, restaurant, user)
- Created scripts to sync user roles automatically

### 3. Driver Position Updates
**Problem**: Security and permission issues when updating driver positions

**Solution**:
- Created secure Cloud Functions for driver position updates
- Implemented role-based validation
- Added proper authentication checks

## Current Setup 🔧

### User Roles
- **admin**: Full access to all collections
- **delivery**: Can update assigned orders and driver positions
- **restaurant**: Can manage menu items and view orders  
- **user**: Can create orders and view their own data

### Security Rules
All Firestore rules now properly validate:
- User authentication
- Role-based permissions
- Document ownership
- Cross-collection access

### Cloud Functions
- `updateDriverPosition`: Securely update driver location
- `getDriverPosition`: Get real-time driver location
- `markOrderPreparedTrigger`: Order notification system

## How to Deploy 🚀

### Option 1: Automatic Setup (Recommended)
```bash
cd backend
./setup.ps1   # For Windows PowerShell
# or
./setup.sh    # For Linux/Mac
```

### Option 2: Manual Setup
1. **Deploy Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Deploy Cloud Functions**:
   ```bash
   firebase deploy --only functions
   ```

3. **Setup User Roles**:
   ```bash
   node scripts/setupCustomClaims.js
   node scripts/syncUserRoles.js
   ```

## Testing 🧪

### Test User Permissions
1. Create test users for each role
2. Try accessing different collections
3. Verify error messages for unauthorized access

### Test Driver Position Updates
1. Authenticate as a delivery partner
2. Get assigned to an order
3. Call `updateDriverPosition` Cloud Function
4. Verify position is updated in Firestore

### Test LatLng Conversion
1. Create orders with location data
2. Read orders from different apps
3. Verify no type conversion errors

## Common Issues & Solutions 🔍

### Issue: "User role not found"
**Solution**: Run the role sync script:
```bash
node scripts/syncUserRoles.js
```

### Issue: "Function not found"
**Solution**: Redeploy functions:
```bash
firebase deploy --only functions
```

### Issue: LatLng still showing errors
**Solution**: 
1. Restart the Flutter app completely
2. Check if `firestore_util.dart` changes were saved
3. Run `flutter clean && flutter pub get`

### Issue: Permission still denied
**Solution**:
1. Check if Firestore rules are deployed
2. Verify user has correct custom claims
3. Check authentication state in the app

## Architecture 🏗️

```
Dastarkhwan Food Delivery System
├── User App (Customer)
│   ├── Create orders
│   ├── Track delivery
│   └── View order history
├── Restaurant App
│   ├── Manage menu
│   ├── View orders
│   └── Update order status
├── Delivery App (Delivery Partner)
│   ├── View assigned orders
│   ├── Update location
│   └── Update delivery status
└── Admin Panel
    ├── Manage all users
    ├── Monitor orders
    └── System administration
```

## Next Steps 🎯

1. **Test all apps** with the new security rules
2. **Monitor Cloud Function logs** for any errors
3. **Update app UI** to handle permission errors gracefully
4. **Add real-time location tracking** for better user experience
5. **Implement order notifications** across all apps

## Support 📞

If you encounter any issues:
1. Check the Cloud Function logs in Firebase Console
2. Verify Firestore rules are active
3. Test with different user roles
4. Check app authentication state

Remember to test thoroughly before deploying to production! 🎉
