import { User } from '../models/User.js';

async function checkSuperAdmin() {
  try {
    console.log('Searching for super admin user...');
    const admin = await User.findByEmail('superadmin@dastarkhwan.com');
    
    if (admin) {
      console.log('Super admin user found:');
      console.log({
        id: admin.id,
        email: admin.email,
        role: admin.role,
        firebaseUid: admin.firebaseUid || 'Not set',
        isActive: admin.isActive
      });
    } else {
      console.log('No super admin user found with email: superadmin@dastarkhwan.com');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking super admin user:', error);
    process.exit(1);
  }
}

checkSuperAdmin();
