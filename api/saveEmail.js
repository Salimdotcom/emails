import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*'); // Remplacez '*' par votre domaine WordPress pour plus de sécurité
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const uri = process.env.MONGODB_URI; // Use environment variable
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('email_db'); // Your database name
    await db.collection('emails').insertOne({
      email,
      timestamp: new Date(),
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to save email' });
  } finally {
    await client.close();
  }
}
