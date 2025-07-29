import { db } from '../config/firebase.js';

async function checkDeliveryPartnersDirect() {
  try {
    console.log('Fetching delivery partners directly from Firestore...');
    
    // Get reference to the deliveryPartners collection
    const deliveryPartnersRef = db.collection('deliveryPartners');
    
    // Get all documents
    const snapshot = await deliveryPartnersRef.limit(50).get();
    
    if (snapshot.empty) {
      console.log('No delivery partners found in the collection.');
      
      // Check if collection exists by trying to add a test document
      console.log('\nChecking if collection exists by attempting to add a test document...');
      try {
        const testRef = await deliveryPartnersRef.add({
          test: true,
          timestamp: new Date().toISOString(),
          message: 'Test document to verify collection access'
        });
        console.log('✅ Successfully added test document to deliveryPartners collection');
        console.log('Document ID:', testRef.id);
        
        // Clean up test document
        await testRef.delete();
        console.log('✅ Test document cleaned up');
        
      } catch (testError) {
        console.error('\n❌ Error accessing deliveryPartners collection:', testError.message);
        console.log('\nPossible issues:');
        console.log('1. The collection name might be different');
        console.log('2. The Firestore security rules might be preventing access');
        console.log('3. The database might be in a different region or project');
      }
      
      process.exit(0);
    }
    
    console.log(`\nFound ${snapshot.size} delivery partners:\n`);
    
    // Display basic info about each delivery partner
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`[${index + 1}] ID: ${doc.id}`);
      console.log(`    Name: ${data.name || 'N/A'}`);
      console.log(`    Email: ${data.email || 'N/A'}`);
      console.log(`    Phone: ${data.phone || 'N/A'}`);
      console.log(`    Status: ${data.accountStatus || 'N/A'}`);
      console.log(`    Created: ${data.createdAt ? new Date(data.createdAt).toLocaleString() : 'N/A'}`);
      console.log('----------------------------------------');
    });
    
    // Show sample data of first document (if exists)
    if (!snapshot.empty) {
      const firstDoc = snapshot.docs[0];
      console.log('\nSample document structure:');
      console.log(JSON.stringify({
        id: firstDoc.id,
        ...firstDoc.data()
      }, null, 2));
    }
    
  } catch (error) {
    console.error('Error checking delivery partners:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
checkDeliveryPartnersDirect();
