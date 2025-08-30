import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // Add your project configuration here
  });
}

const auth = admin.auth();

/**
 * Set custom claims for a user
 * @param {string} uid - User ID
 * @param {string} role - Role (admin, delivery, restaurant, user)
 */
async function setUserRole(uid, role) {
  try {
    await auth.setCustomUserClaims(uid, { role: role });
    console.log(`Successfully set role "${role}" for user ${uid}`);
  } catch (error) {
    console.error(`Error setting role for user ${uid}:`, error);
  }
}

/**
 * Get user's custom claims
 * @param {string} uid - User ID
 */
async function getUserClaims(uid) {
  try {
    const user = await auth.getUser(uid);
    console.log(`Custom claims for user ${uid}:`, user.customClaims);
    return user.customClaims;
  } catch (error) {
    console.error(`Error getting claims for user ${uid}:`, error);
  }
}

/**
 * Set admin role for super admin
 */
async function setupSuperAdmin() {
  // Replace with your admin email
  const adminEmail = 'admin@dastarkhwan.com';
  
  try {
    const user = await auth.getUserByEmail(adminEmail);
    await setUserRole(user.uid, 'admin');
    console.log(`Super admin setup completed for ${adminEmail}`);
  } catch (error) {
    console.error('Error setting up super admin:', error);
  }
}

// Export functions for use in other scripts
export {
  setUserRole,
  getUserClaims,
  setupSuperAdmin
};

// If run directly, set up super admin
if (import.meta.url === `file://${process.argv[1]}`) {
  setupSuperAdmin();
}
