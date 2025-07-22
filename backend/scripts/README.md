# Admin Setup Scripts

This directory contains scripts for managing admin users in the Dastarkhwan system.

## Creating a Super Admin

### Prerequisites
1. Ensure you have Node.js and npm installed
2. Set up your `.env` file with the required Firebase credentials
3. Install dependencies: `npm install`

### Running the Script

To create a super admin, run:

```bash
node scripts/createSuperAdmin.js
```

This will create a super admin with the following default credentials:
- **Email**: superadmin@dastarkhwan.com
- **Password**: ChangeMe123!

### Security Note

After the first login, you should:
1. Change the default password immediately
2. Update the email to a valid email address
3. Enable two-factor authentication for the super admin account

## Environment Variables

Make sure these environment variables are set in your `.env` file:

```
FIREBASE_SERVICE_ACCOUNT={"type": "service_account", ...}
FIREBASE_DATABASE_URL=your-firebase-database-url
```

## Troubleshooting

- If you get Firebase initialization errors, verify your service account credentials
- Ensure the Firebase Admin SDK is properly initialized in your project
- Check the Firebase Console to verify the user was created in the Authentication section
