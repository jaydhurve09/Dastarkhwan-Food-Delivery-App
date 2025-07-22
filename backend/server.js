import 'dotenv/config';
import express from 'express';
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import morgan from 'morgan';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

// Read and parse the service account file
const serviceAccountPath = join(__dirname, 'firebaseAdminConfig.json');
const serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Uncomment if you're using Realtime Database
  // databaseURL: "https://dastarkhawn-demo-default-rtdb.firebaseio.com"
});

// Global middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Simple request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Add a test route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Dastarkhwan API is running',
    timestamp: new Date().toISOString()
  });
});

// Test Firebase connection
app.get('/test-firebase', async (req, res) => {
  try {
    // Test Firestore
    const db = admin.firestore();
    const testRef = db.collection('test');
    await testRef.add({ test: new Date().toISOString() });
    
    // Test Auth
    const auth = admin.auth();
    const users = await auth.listUsers(1);
    
    res.json({
      status: 'success',
      firestore: 'working',
      auth: users.users.length > 0 ? 'users exist' : 'no users (this is ok)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Firebase test error:', error);
    res.status(500).json({ 
      status: 'error',
      message: error.message 
    });
  }
});

// API Routes
app.use('/api/users', userRoutes);
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
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});