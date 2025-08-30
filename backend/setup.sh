#!/bin/bash

# Dastarkhwan Food Delivery App - Complete Setup Script
# This script sets up Firebase rules, deploys functions, and configures user roles

echo "🚀 Starting Dastarkhwan App Setup..."

# Check if we're in the correct directory
if [ ! -f "firebase.json" ]; then
    echo "❌ Error: firebase.json not found. Please run this script from the backend directory."
    exit 1
fi

echo "📋 Step 1: Installing dependencies..."
npm install

echo "🔧 Step 2: Deploying Firestore rules..."
firebase deploy --only firestore:rules

echo "⚡ Step 3: Deploying Cloud Functions..."
firebase deploy --only functions

echo "👥 Step 4: Setting up user roles..."
node scripts/setupCustomClaims.js

echo "🔄 Step 5: Syncing existing user roles..."
node scripts/syncUserRoles.js

echo "✅ Setup completed successfully!"
echo ""
echo "📝 Next Steps:"
echo "1. Update your app's Firebase configuration"
echo "2. Test authentication with different user roles"
echo "3. Verify Firestore permissions are working"
echo "4. Test driver position updates"
echo ""
echo "🔐 User Roles Setup:"
echo "- admin: Full access to all collections"
echo "- delivery: Can update assigned orders and driver positions"
echo "- restaurant: Can manage menu items and view orders"
echo "- user: Can create orders and view their own data"
echo ""
echo "🌐 Available Cloud Functions:"
echo "- updateDriverPosition: Update driver location (delivery partners only)"
echo "- getDriverPosition: Get real-time driver location"
echo "- markOrderPreparedTrigger: Notify delivery partner when order is ready"
