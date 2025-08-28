import DeliveryPartner from '../models/deliveryPartner.js';

async function checkDeliveryPartners() {
  try {
    console.log('Fetching delivery partners...');
    
    // Fetch all delivery partners
    const result = await DeliveryPartner.findPage({
      limit: 50, // Adjust limit as needed
      orderBy: 'created_time'
    });

    const { items: deliveryPartners } = result;
    
    console.log(`\nFound ${deliveryPartners.length} delivery partners:\n`);
    
    // Display basic info about each delivery partner
    deliveryPartners.forEach((partner, index) => {
      const partnerData = partner.toJSON ? partner.toJSON() : partner;
      const { id, name, email, phone, accountStatus, createdAt } = partnerData;
      
      console.log(`[${index + 1}] ID: ${id}`);
      console.log(`    Name: ${name}`);
      console.log(`    Email: ${email}`);
      console.log(`    Phone: ${phone}`);
      console.log(`    Status: ${accountStatus}`);
      console.log(`    Created: ${new Date(createdAt).toLocaleString()}`);
      console.log('----------------------------------------');
    });
    
    // Show sample data of first partner (if exists)
    if (deliveryPartners.length > 0) {
      const samplePartner = deliveryPartners[0];
      const sampleData = samplePartner.toJSON ? samplePartner.toJSON() : samplePartner;
      
      console.log('\nSample delivery partner data structure:');
      console.log(JSON.stringify(sampleData, null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking delivery partners:', error);
    process.exit(1);
  }
}

// Run the function
checkDeliveryPartners();
