# Dastarkhwan Food Delivery App - Complete Setup Script (PowerShell)
# This script sets up Firebase rules, deploys functions, and configures user roles

Write-Host "🚀 Starting Dastarkhwan App Setup..." -ForegroundColor Green

# Check if we're in the correct directory
if (-not (Test-Path "firebase.json")) {
    Write-Host "❌ Error: firebase.json not found. Please run this script from the backend directory." -ForegroundColor Red
    exit 1
}

Write-Host "📋 Step 1: Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "🔧 Step 2: Deploying Firestore rules..." -ForegroundColor Yellow
firebase deploy --only firestore:rules

Write-Host "⚡ Step 3: Deploying Cloud Functions..." -ForegroundColor Yellow
firebase deploy --only functions

Write-Host "👥 Step 4: Setting up user roles..." -ForegroundColor Yellow
node scripts/setupCustomClaims.js

Write-Host "🔄 Step 5: Syncing existing user roles..." -ForegroundColor Yellow
node scripts/syncUserRoles.js

Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update your apps Firebase configuration"
Write-Host "2. Test authentication with different user roles"
Write-Host "3. Verify Firestore permissions are working"
Write-Host "4. Test driver position updates"
Write-Host ""
Write-Host "🔐 User Roles Setup:" -ForegroundColor Cyan
Write-Host "- admin: Full access to all collections"
Write-Host "- delivery: Can update assigned orders and driver positions"
Write-Host "- restaurant: Can manage menu items and view orders"
Write-Host "- user: Can create orders and view their own data"
Write-Host ""
Write-Host "🌐 Available Cloud Functions:" -ForegroundColor Cyan
Write-Host "- updateDriverPosition: Update driver location (delivery partners only)"
Write-Host "- getDriverPosition: Get real-time driver location"
Write-Host "- markOrderPreparedTrigger: Notify delivery partner when order is ready"
