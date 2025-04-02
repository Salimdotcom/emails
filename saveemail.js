import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  // Handle only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const { email } = req.body;
  
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ 
      error: 'Invalid email format',
      validExample: 'user@example.com'
    });
  }

  // MongoDB connection
  const client = new MongoClient(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection('subscribers');

    // Insert document with timestamp
    const result = await collection.insertOne({
      email: email.toLowerCase().trim(),
      createdAt: new Date(),
      source: 'website-form',
      status: 'pending'
    });

    // Successful insertion
    res.status(201).json({
      success: true,
      message: 'Email received successfully',
      mongoId: result.insertedId
    });

  } catch (error) {
    // Handle duplicate emails
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: 'Email already exists in our system'
      });
    }

    // General error handling
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      debugId: Date.now()
    });

  } finally {
    await client.close();
  }
}
