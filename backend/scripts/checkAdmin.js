import { User } from '../models/User.js';

async function checkAdmin() {
  try {
    console.log('Searching for admin user...');
    const admin = await User.findByEmail('admin@example.com');
    
    if (admin) {
      console.log('Admin user found:');
      console.log({
        id: admin.id,
        email: admin.email,
        role: admin.role,
        firebaseUid: admin.firebaseUid || 'Not set',
        isActive: admin.isActive
      });
    } else {
      console.log('No admin user found with email: admin@example.com');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking admin user:', error);
    process.exit(1);
  }
}

checkAdmin();
