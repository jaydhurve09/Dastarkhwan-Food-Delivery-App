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
import menuCategoryRoutes from './routes/menuCategoryRoutes.js'; 
import testRoutes from './routes/testRoutes.js';
import orderRoutes from './routes/orderRoutes.js'; // Import order routes
import { db, auth } from './config/firebase.js'; // Import Firebase services
import deliveryPartnerRoutes from './routes/deliveryPartnerRoutes.js'; // Import delivery partner routes
import promoCodeRoutes from './routes/promoCodeRoutes.js'; // Import promo code routes
import feedbackRoutes from './routes/feedbackRoutes.js'; // Import feedback routes
// Get current file pathimport feedbackRoutes from './routes/feedbackRoutes.js';
import complaintsRoutes from './routes/complaintsRoutes.js'; // Import complaints routes

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api/auth', userAuthRoutes);
app.use('/api/auth/admin', adminAuthRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use('/api/menu-categories', menuCategoryRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/test', testRoutes);
app.use('/api/delivery-partners', deliveryPartnerRoutes);
app.use('/api/promo-codes', promoCodeRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/complaints', complaintsRoutes);

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Dastarkhwan API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: 'Not authorized, token failed'
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      error: err.message
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const server = app.listen(port, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
});

process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});