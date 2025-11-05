import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import { db } from './config/firebase.js';
import hostelsRouter from './routes/hostels.js';
import createAuthRouter from './routes/auth.js';
import studentsRouter from './routes/students.js';
import { authMiddleware } from './middleware/auth.js';

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
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
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
// auth router is a factory that needs the firestore `db` instance
const authRouter = createAuthRouter(db);
app.use('/api/auth', authRouter);

// compatibility endpoint: some frontend code calls /api/users/me
// return the same profile as GET /api/auth/me for backward-compat
app.get('/api/users/me', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.userId || req.user.uid;
    if (!userId) return res.status(400).json({ error: 'Invalid user id' });
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
    const d = userDoc.data();
    return res.json({ id: userDoc.id, fullName: d.fullName, username: d.username, role: d.role });
  } catch (err) {
    console.error('GET /api/users/me error:', err);
    return res.status(500).json({ error: String(err) });
  }
});
// Mount students router before hostels router so anonymous student submissions
// (POST /api/students) are not intercepted by the hostels auth middleware.
app.use('/api/students', studentsRouter);
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
