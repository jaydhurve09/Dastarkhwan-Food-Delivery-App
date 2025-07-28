import express from 'express';
import { User } from '../models/User.js';

const router = express.Router();

// Test endpoint to check Firestore connection
router.get('/test-firestore', async (req, res) => {
  try {
    console.log('[TEST] Testing Firestore connection...');
    
    // Test User model connection
    const userTest = await User.testConnection();
    
    // Additional test: Try to get collection directly
    let directTest = { success: false };
    try {
      const db = (await import('../config/firebase.js')).db;
      const snapshot = await db.collection('users').limit(1).get();
      directTest = {
        success: true,
        collection: 'users',
        hasDocuments: !snapshot.empty
      };
    } catch (error) {
      directTest.error = error.message;
    }

    res.json({
      success: true,
      userModelTest: userTest,
      directFirestoreTest: directTest,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TEST] Error in test endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});

export default router;
