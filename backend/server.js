import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';
import morgan from 'morgan';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userAuthRoutes from './routes/userAuthRoutes.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import menuItemRoutes from './routes/menuItemRoutes.js';
import testRoutes from './routes/testRoutes.js';
import orderRoutes from './routes/orderRoutes.js'; // Import order routes
import { db, auth } from './config/firebase.js'; // Import Firebase services
import deliveryPartnerRoutes from './routes/deliveryPartnerRoutes.js'; // Import delivery partner routes
import promoCodeRoutes from './routes/promoCodeRoutes.js'; // Import promo code routes

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

// Global middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
// API Routes
app.use('/api/auth', userAuthRoutes);
app.use('/api/auth/admin', adminAuthRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/test', testRoutes);
app.use('/api/delivery-partners', deliveryPartnerRoutes);
app.use('/api/promo-codes', promoCodeRoutes);
// Simple request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Dastarkhwan API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test Firebase connection
app.get('/test-firebase', async (req, res) => {
  try {
    // Test Firestore
    const testRef = db.collection('test');
    const docRef = await testRef.add({ 
      test: new Date().toISOString(),
      message: 'Firebase connection test'
    });
    
    // Test Auth
    const users = await auth.listUsers(1);
    
    res.json({
      status: 'success',
      message: 'Firebase connection test successful',
      firestore: {
        success: true,
        documentId: docRef.id,
        message: 'Write successful'
      },
      auth: {
        success: true,
        userCount: users.users.length,
        message: `Found ${users.users.length} user(s)`
      }
    });
  } catch (error) {
    console.error('Firebase test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Firebase test failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: 'Not authorized, token failed'
    });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      error: err.message
    });
  }

  // Handle other errors
  res.status(err.statusCode || 500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});