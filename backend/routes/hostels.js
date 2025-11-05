import express from 'express';
import admin from 'firebase-admin';
import { db } from '../config/firebase.js';

const router = express.Router();

// Apply auth middleware to all routes
const authMiddleware = (req, res, next) => {
  // Skip auth for health check
  if (req.path === '/health') return next();
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      code: 'UNAUTHORIZED'
    });
  }
  
  const token = authHeader.split(' ')[1];
  admin.auth().verifyIdToken(token)
    .then(decodedToken => {
      req.user = decodedToken;
      next();
    })
    .catch(error => {
      console.error('Error verifying token:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    });
};

router.use(authMiddleware);

// Create a new hostel
router.post('/hostels', async (req, res) => {
  try {
    const { name, address } = req.body;
    const userId = req.user.uid;

    if (!name || !address) {
      return res.status(400).json({
        success: false,
        error: 'Name and address are required',
        code: 'VALIDATION_ERROR'
      });
    }

    const hostelData = {
      name,
      address,
      ownerId: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('hostels').add(hostelData);
    
    // Update user's hostels array
    await db.collection('users').doc(userId).update({
      hostels: admin.firestore.FieldValue.arrayUnion(docRef.id),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...hostelData
      }
    });

  } catch (error) {
    console.error('Error creating hostel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create hostel',
      code: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all hostels for the authenticated user
router.get('/hostels', async (req, res) => {
  try {
    const userId = req.user.uid;
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const userData = userDoc.data();
    const hostels = userData.hostels || [];
    
    // Get detailed hostel information
    const hostelPromises = hostels.map(hostelId => 
      db.collection('hostels').doc(hostelId).get()
        .then(doc => doc.exists ? { id: doc.id, ...doc.data() } : null)
    );
    
    const hostelData = (await Promise.all(hostelPromises)).filter(Boolean);
    
    res.json({
      success: true,
      data: hostelData
    });

  } catch (error) {
    console.error('Error fetching hostels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hostels',
      code: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
