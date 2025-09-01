import { adminAuth, db } from '../config/firebase.js';
import dotenv from 'dotenv';

// Configure dotenv to load .env file
dotenv.config({ path: '.env' });

const createMockOrders = async () => {
  console.log('🍔 Creating mock orders for delivery testing...');
  
  try {
    // Get our test delivery partner
    const testPartnerEmail = 'delivery.test@dastarkhwan.com';
    const userRecord = await adminAuth.getUserByEmail(testPartnerEmail);
  const deliveryPartnerRef = db.collection('deliveryPartners').doc(userRecord.uid);
    
    console.log(`✅ Found delivery partner: ${userRecord.uid}`);
    
    // Mock order data
    const mockOrders = [
      {
        orderNumber: 'ORD001',
        customerName: 'Aarav Sharma',
        customerPhone: '+919876543210',
        restaurantName: 'Spice Garden',
        restaurantAddress: 'Shop 12, Food Court, Central Mall, Nagpur',
        deliveryAddress: 'Flat 204, Skyline Apartments, Sitabuldi, Nagpur, 440012',
        orderStatus: 'preparing',
        paymentStatus: 'paid',
        paymentMethod: 'online',
        orderTotal: 450.00,
        deliveryFee: 40.00,
        distance: 2.8,
        estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        items: [
          {
            name: 'Chicken Biryani',
            quantity: 1,
            price: 280.00,
            customizations: ['Extra Raita', 'Medium Spicy']
          },
          {
            name: 'Mutton Curry',
            quantity: 1,
            price: 320.00,
            customizations: ['Extra Gravy']
          }
        ],
        specialInstructions: 'Please call before delivery. Gate code: 1234',
        createdAt: new Date(),
        updatedAt: new Date(),
  deliveryPartnerId: deliveryPartnerRef,
  delivery_partner_uid: userRecord.uid,
        assignedAt: new Date()
      },
      {
        orderNumber: 'ORD002',
        customerName: 'Priya Patel',
        customerPhone: '+919123456789',
        restaurantName: 'Pizza Corner',
        restaurantAddress: '45, Civil Lines, Near Post Office, Nagpur',
        deliveryAddress: 'Bungalow 23, Rajeev Nagar, Kharbi, Nagpur, 440024',
        orderStatus: 'confirmed',
        paymentStatus: 'paid',
        paymentMethod: 'online',
        orderTotal: 680.00,
        deliveryFee: 50.00,
        distance: 4.2,
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
        items: [
          {
            name: 'Margherita Pizza (Large)',
            quantity: 1,
            price: 420.00,
            customizations: ['Extra Cheese', 'Thin Crust']
          },
          {
            name: 'Garlic Bread',
            quantity: 2,
            price: 130.00,
            customizations: []
          }
        ],
        specialInstructions: 'Ring the bell twice. Apartment on first floor.',
        createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        updatedAt: new Date(),
  deliveryPartnerId: deliveryPartnerRef,
  delivery_partner_uid: userRecord.uid,
        assignedAt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      },
      {
        orderNumber: 'ORD003',
        customerName: 'Rohit Verma',
        customerPhone: '+919988776655',
        restaurantName: 'Burger Junction',
        restaurantAddress: 'Ground Floor, Metro Mall, Wardha Road, Nagpur',
        deliveryAddress: 'House 67, Shivaji Nagar, Seminary Hills, Nagpur, 440006',
        orderStatus: 'on_way',
        paymentStatus: 'pending',
        paymentMethod: 'cod',
        orderTotal: 320.00,
        deliveryFee: 30.00,
        distance: 1.5,
        estimatedDeliveryTime: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
        items: [
          {
            name: 'Chicken Burger',
            quantity: 2,
            price: 180.00,
            customizations: ['No Onions', 'Extra Sauce']
          },
          {
            name: 'French Fries',
            quantity: 1,
            price: 80.00,
            customizations: ['Large Size']
          }
        ],
        specialInstructions: 'Cash on delivery. Please bring change for ₹500.',
        createdAt: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
        updatedAt: new Date(Date.now() - 5 * 60 * 1000), // Updated 5 minutes ago
  deliveryPartnerId: deliveryPartnerRef,
  delivery_partner_uid: userRecord.uid,
        assignedAt: new Date(Date.now() - 20 * 60 * 1000) // 20 minutes ago
      }
    ];
    
    console.log(`📦 Creating ${mockOrders.length} mock orders...`);
    
    // Create each order
    for (let i = 0; i < mockOrders.length; i++) {
      const order = mockOrders[i];
      const docRef = await db.collection('orders').add(order);
      console.log(`✅ Created order ${order.orderNumber} with ID: ${docRef.id}`);
    }
    
    console.log('\n🎉 Mock orders created successfully!');
    console.log('\n📱 You can now test the delivery app with these orders:');
    mockOrders.forEach(order => {
      console.log(`   📋 ${order.orderNumber} - ${order.customerName} - ₹${order.orderTotal} - ${order.orderStatus}`);
    });
    
    console.log('\n🚚 Login to delivery app with:');
    console.log(`   Email: ${testPartnerEmail}`);
    console.log(`   Password: Test@1234`);
    
  } catch (error) {
    console.error('❌ Error creating mock orders:', error);
    process.exit(1);
  }
  
  process.exit(0);
};

// Run the function
createMockOrders();
