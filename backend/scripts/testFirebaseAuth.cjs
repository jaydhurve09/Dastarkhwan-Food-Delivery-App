const admin = require('firebase-admin');

async function testFirebaseAuthDirectly() {
  try {
    if (!admin.apps.length) {
      const serviceAccount = require('../config/firebaseAdminConfig.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const auth = admin.auth();
    
    // Test 1: List existing users
    console.log('🔍 Testing Firebase Auth connection...');
    const listUsersResult = await auth.listUsers(5);
    console.log(`✅ Found ${listUsersResult.users.length} users in Auth`);
    
    // Test 2: Find our test user
    const email = 'test.delivery@dastarkhwan.com';
    try {
      const userRecord = await auth.getUserByEmail(email);
      console.log(`✅ Found test user: ${userRecord.uid}`);
      
      // Test 3: Create a custom token for testing
      const customToken = await auth.createCustomToken(userRecord.uid);
      console.log('✅ Created custom token for testing');
      console.log('Custom Token (first 50 chars):', customToken.substring(0, 50) + '...');
      
      return { success: true, uid: userRecord.uid, customToken };
      
    } catch (userError) {
      console.log('❌ Test user not found, error:', userError.message);
      return { success: false, error: userError.message };
    }
    
  } catch (error) {
    console.error('❌ Firebase Admin connection failed:', error);
    return { success: false, error: error.message };
  }
}

testFirebaseAuthDirectly().then(result => {
  if (result.success) {
    console.log('\n🎉 Firebase Auth is working correctly!');
    console.log('\n📱 For app login, use:');
    console.log('Email: test.delivery@dastarkhwan.com');
    console.log('Password: testpassword123');
  } else {
    console.log('\n💥 Firebase Auth test failed:', result.error);
  }
});
