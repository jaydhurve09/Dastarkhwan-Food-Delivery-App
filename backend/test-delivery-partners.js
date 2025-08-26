// Test script for delivery partner endpoints
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function testDeliveryPartnerEndpoints() {
  try {
    console.log('Testing delivery partner endpoints...\n');

    // Test get all delivery partners
    console.log('1. Testing GET /delivery-partners/');
    const allPartnersResponse = await fetch(`${BASE_URL}/delivery-partners/`);
    const allPartners = await allPartnersResponse.json();
    console.log(`Status: ${allPartnersResponse.status}`);
    console.log(`Total partners: ${allPartners.length}`);
    console.log('Sample partner:', allPartners[0]);
    console.log('---\n');

    // Test get active delivery partners
    console.log('2. Testing GET /delivery-partners/active');
    const activePartnersResponse = await fetch(`${BASE_URL}/delivery-partners/active`);
    const activePartners = await activePartnersResponse.json();
    console.log(`Status: ${activePartnersResponse.status}`);
    console.log(`Active partners: ${activePartners.length}`);
    console.log('Active partners:', activePartners.map(p => ({ 
      id: p.id, 
      name: p.displayName || p.name, 
      isActive: p.isActive 
    })));
    console.log('---\n');

    // Test get ongoing orders
    console.log('3. Testing GET /orders/ongoing');
    const ordersResponse = await fetch(`${BASE_URL}/orders/ongoing`);
    const orders = await ordersResponse.json();
    console.log(`Status: ${ordersResponse.status}`);
    console.log(`Ongoing orders: ${orders.length}`);
    if (orders.length > 0) {
      console.log('Sample order:', {
        id: orders[0].id,
        orderId: orders[0].orderId,
        orderStatus: orders[0].orderStatus,
        partnerAssigned: orders[0].partnerAssigned
      });
    }
    console.log('---\n');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testDeliveryPartnerEndpoints();
