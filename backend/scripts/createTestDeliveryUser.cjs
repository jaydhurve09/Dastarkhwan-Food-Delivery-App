const admin = require('firebase-admin');

async function createTestDeliveryPartner() {
  try {
    if (!admin.apps.length) {
      const serviceAccount = require('../config/firebaseAdminConfig.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const auth = admin.auth();
    const db = admin.firestore();

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email: 'test.delivery@dastarkhwan.com',
      password: 'testpassword123',
      displayName: 'Test Delivery Partner'
    });

    console.log('✅ Created Firebase Auth user:', userRecord.uid);

    // Create Firestore document
    await db.collection('deliveryPartners').doc(userRecord.uid).set({
      email: 'test.delivery@dastarkhwan.com',
      name: 'Test Delivery Partner',
      isVerified: true,
      phoneNumber: '+1234567890',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Created Firestore document');
    console.log('🔑 Login credentials:');
    console.log('Email: test.delivery@dastarkhwan.com');
    console.log('Password: testpassword123');

  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('ℹ️ User already exists. Login credentials:');
      console.log('Email: test.delivery@dastarkhwan.com');
      console.log('Password: testpassword123');
    } else {
      console.error('Error creating user:', error);
    }
  }
}

createTestDeliveryPartner();
