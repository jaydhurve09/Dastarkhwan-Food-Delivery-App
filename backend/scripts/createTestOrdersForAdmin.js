const admin = require('firebase-admin');
const serviceAccount = require('../config/firebaseAdminConfig.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createTestOrderForAdmin() {
  try {
    // Create a test order in orderedProducts collection (for preparing orders)
    const testOrderedProduct = {
      status: 'preparing',
      orderStatus: 'preparing',
      customerName: 'Test Customer - Admin Panel',
      customerAddress: '789 Admin Test Street, Test City',
      address: '789 Admin Test Street, Test City',
      restaurantName: 'Admin Test Restaurant',
      orderDetails: JSON.stringify([
        { name: 'Admin Test Pizza', quantity: 2, price: 18.99 },
        { name: 'Admin Test Drink', quantity: 2, price: 3.99 }
      ]),
      items: [
        { name: 'Admin Test Pizza', quantity: 2, price: 18.99 },
        { name: 'Admin Test Drink', quantity: 2, price: 3.99 }
      ],
      totalAmount: 45.96,
      orderTime: admin.firestore.FieldValue.serverTimestamp(),
      deliveryPartnerId: '4Ezn9IDhUDPycbvBAWKvlg7hR5L2', // Partner with FCM token
      partnerAssigned: {
        partnerId: '4Ezn9IDhUDPycbvBAWKvlg7hR5L2',
        partnerName: 'Admin Test Delivery Partner',
        phone: '+1234567890',
        id: '4Ezn9IDhUDPycbvBAWKvlg7hR5L2'
      }
    };
    
    const docRef = await db.collection('orderedProducts').add(testOrderedProduct);
    console.log('Admin test order created in orderedProducts with ID:', docRef.id);
    
    // Also create a test order in orders collection (for ongoing orders)
    const testOrder = {
      status: 'assigned_to_delivery',
      customerName: 'Test Customer - Orders Collection',
      customerAddress: '321 Orders Test Avenue, Test City',
      restaurantName: 'Orders Test Restaurant',
      orderDetails: JSON.stringify([
        { name: 'Orders Test Burger', quantity: 1, price: 15.99 },
        { name: 'Orders Test Fries', quantity: 1, price: 5.99 }
      ]),
      items: [
        { name: 'Orders Test Burger', quantity: 1, price: 15.99 },
        { name: 'Orders Test Fries', quantity: 1, price: 5.99 }
      ],
      totalAmount: 21.98,
      orderTime: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const ordersDocRef = await db.collection('orders').add(testOrder);
    console.log('Admin test order created in orders with ID:', ordersDocRef.id);
    
  } catch (error) {
    console.error('Error creating admin test orders:', error);
  }
}

createTestOrderForAdmin();
