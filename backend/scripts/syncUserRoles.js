import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const auth = admin.auth();
const firestore = admin.firestore();

/**
 * Sync delivery partner roles from Firestore collection
 */
async function syncDeliveryPartnerRoles() {
  try {
    const deliveryPartnersSnapshot = await firestore.collection('deliveryPartners').get();
    
    for (const doc of deliveryPartnersSnapshot.docs) {
      const data = doc.data();
      const uid = doc.id; // Assuming document ID is the user's UID
      
      // Check if user exists in Firebase Auth
      try {
        await auth.getUser(uid);
        // Set delivery role
        await auth.setCustomUserClaims(uid, { role: 'delivery' });
        console.log(`Set delivery role for user: ${uid}`);
      } catch (error) {
        console.log(`User ${uid} not found in Firebase Auth, skipping...`);
      }
    }
    
    console.log('Delivery partner role sync completed');
  } catch (error) {
    console.error('Error syncing delivery partner roles:', error);
  }
}

/**
 * Sync restaurant roles from Firestore collection
 */
async function syncRestaurantRoles() {
  try {
    const restaurantsSnapshot = await firestore.collection('restaurants').get();
    
    for (const doc of restaurantsSnapshot.docs) {
      const data = doc.data();
      // Assuming restaurant has an ownerUid field
      const uid = data.ownerUid;
      
      if (uid) {
        try {
          await auth.getUser(uid);
          // Set restaurant role
          await auth.setCustomUserClaims(uid, { role: 'restaurant' });
          console.log(`Set restaurant role for user: ${uid}`);
        } catch (error) {
          console.log(`User ${uid} not found in Firebase Auth, skipping...`);
        }
      }
    }
    
    console.log('Restaurant role sync completed');
  } catch (error) {
    console.error('Error syncing restaurant roles:', error);
  }
}

/**
 * Set regular user role for all users without custom claims
 */
async function setDefaultUserRoles() {
  try {
    const listUsersResult = await auth.listUsers();
    
    for (const user of listUsersResult.users) {
      if (!user.customClaims || !user.customClaims.role) {
        await auth.setCustomUserClaims(user.uid, { role: 'user' });
        console.log(`Set default user role for: ${user.uid}`);
      }
    }
    
    console.log('Default user roles setup completed');
  } catch (error) {
    console.error('Error setting default user roles:', error);
  }
}

// Run all sync functions
async function syncAllRoles() {
  console.log('Starting role synchronization...');
  await syncDeliveryPartnerRoles();
  await syncRestaurantRoles();
  await setDefaultUserRoles();
  console.log('All role synchronization completed');
}

// If run directly, sync all roles
if (import.meta.url === `file://${process.argv[1]}`) {
  syncAllRoles();
}

export {
  syncDeliveryPartnerRoles,
  syncRestaurantRoles,
  setDefaultUserRoles,
  syncAllRoles
};
