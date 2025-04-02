import { MongoClient } from 'mongodb';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Configure CORS
const corsMiddleware = cors({
  origin: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : 'https://your-production-domain.com',
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
});

// Rate limiting: 5 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

export default async function handler(req, res) {
  // Apply CORS and rate limiting
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  await new Promise((resolve, reject) => {
    limiter(req, res, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  // --- [YOUR CODE STARTS HERE] ---
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const { email } = req.body;
  
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ 
      error: 'Invalid email format',
      example: 'valid@example.com'
    });
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection('subscribers');

    const result = await collection.insertOne({
      email: email.toLowerCase().trim(),
      createdAt: new Date(),
      source: 'website-form'
    });

    res.status(201).json({
      success: true,
      message: 'Email received',
      id: result.insertedId
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email exists' });
    }
    
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal error' });

  } finally {
    await client.close();
  }
  // --- [YOUR CODE ENDS HERE] ---
}
