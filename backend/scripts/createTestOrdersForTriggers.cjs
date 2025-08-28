const admin = require('firebase-admin');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  const serviceAccount = require('../config/firebaseAdminConfig.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function createTestOrderWithUpdatedPartner() {
  try {
    // Create a test order in orderedProducts collection (for preparing orders)
    const testOrderedProduct = {
      status: 'preparing',
      orderStatus: 'preparing',
      customerName: 'Test Customer - Click Mark Prepared',
      customerAddress: '123 Test Mark Prepared Street',
      address: '123 Test Mark Prepared Street',
      restaurantName: 'Test Restaurant',
      orderDetails: JSON.stringify([
        { name: 'Test Pizza for Mark Prepared', quantity: 1, price: 15.99 }
      ]),
      items: [
        { name: 'Test Pizza for Mark Prepared', quantity: 1, price: 15.99 }
      ],
      totalAmount: 15.99,
      orderTime: admin.firestore.FieldValue.serverTimestamp(),
      deliveryPartnerId: 'DaI5vtwXqaPOW2z2pr3q6pq9ZWm1', // Updated partner ID
      partnerAssigned: {
        partnerId: 'DaI5vtwXqaPOW2z2pr3q6pq9ZWm1',
        partnerName: 'Test Delivery Partner for Mark Prepared',
        phone: '+1234567890',
        id: 'DaI5vtwXqaPOW2z2pr3q6pq9ZWm1'
      }
    };
    
    const docRef = await admin.firestore().collection('orderedProducts').add(testOrderedProduct);
    console.log('✅ Test order for MARK AS PREPARED created with ID:', docRef.id);
    
    // Create a test order in orders collection (for assign partner testing)
    const testOrder = {
      status: 'confirmed',
      customerName: 'Test Customer - Click Assign Partner',
      customerAddress: '456 Test Assign Partner Avenue',
      restaurantName: 'Test Restaurant for Assignment',
      orderDetails: JSON.stringify([
        { name: 'Test Burger for Assignment', quantity: 1, price: 12.99 }
      ]),
      items: [
        { name: 'Test Burger for Assignment', quantity: 1, price: 12.99 }
      ],
      totalAmount: 12.99,
      orderTime: admin.firestore.FieldValue.serverTimestamp()
      // No delivery partner assigned yet - will be assigned via admin panel
    };
    
    const ordersDocRef = await admin.firestore().collection('orders').add(testOrder);
    console.log('✅ Test order for ASSIGN PARTNER created with ID:', ordersDocRef.id);
    
  } catch (error) {
    console.error('❌ Error creating test orders:', error);
  }
}

createTestOrderWithUpdatedPartner();
