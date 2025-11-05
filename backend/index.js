import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import { db } from './config/firebase.js';
import hostelsRouter from './routes/hostels.js';
import authRouter from './routes/auth.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Verify Firebase initialization
if (!db) {
  console.error('Firebase Firestore not initialized. Check your Firebase configuration.');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: [
    'https://aatiya-gh.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    firebase: 'connected'
  });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api', hostelsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Firebase project: ${process.env.GOOGLE_CLOUD_PROJECT || 'Not set'}`);
});

export default app;
