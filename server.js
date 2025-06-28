const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { PDFDocument } = require('pdf-lib');
const admin = require('firebase-admin');
const { OpenAIApi, Configuration } = require('openai');
require('dotenv').config();

// =====================
// Firebase Initialization (Fixed)
// =====================
try {
  // Use base64 encoded credentials if available
  if (process.env.FIREBASE_CREDENTIALS_BASE64) {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString()
    );
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
  } 
  // Fallback to separate environment variables
  else if (process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
    });
  } else {
    throw new Error('Missing Firebase credentials');
  }
  
  console.log("✅ Firebase initialized successfully");
  console.log(`Project: ${admin.app().options.credential.projectId}`);
} catch (err) {
  console.error("🔥 FATAL Firebase init error:", err);
  process.exit(1); // Exit process on critical failure
}

const db = admin.firestore();

// =====================
// OpenAI Initialization
// =====================
const openai = new OpenAIApi(new Configuration({ 
  apiKey: process.env.OPENAI_API_KEY 
}));

// Test connections
(async () => {
  try {
    const testDoc = await db.collection('test').doc('connection').get();
    console.log("✅ Firestore connection successful");
    
    await openai.listModels();
    console.log("✅ OpenAI connection successful");
  } catch (err) {
    console.error("Connection test failed:", err);
  }
})();

// =====================
// Express Server Setup
// =====================
const app = express();
const PORT = process.env.PORT || 3000; // Use Render's PORT

app.use(cors());
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'live', 
    firebase: admin.app().name ? 'connected' : 'disconnected',
    openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing'
  });
});

// Helper: Check required environment variables
function checkEnvVars(vars) {
  const missing = vars.filter(v => !process.env[v]);
  if (missing.length) {
    throw new Error('Missing environment variables: ' + missing.join(', '));
  }
}

// API Endpoints
app.post('/api/generate', async (req, res) => {
  try {
    checkEnvVars(['OPENAI_API_KEY']);
    const idea = req.body.idea;
    if (!idea) throw new Error('No idea provided.');
    // Use OpenAI to generate a legal document draft based on the user's idea
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a legal assistant. Generate a professional legal document draft based on the user\'s idea. Include a title, parties, and main clauses.' },
        { role: 'user', content: idea }
      ],
      max_tokens: 600
    });
    const result = completion.data.choices[0].message.content;
    res.json({ result });
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: 'Server error: ' + (err.message || err) });
  }
});

app.post('/api/contract', async (req, res) => {
  try {
    const { contractText } = req.body;
    if (!contractText) throw new Error('No contract text provided.');
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    page.drawText(contractText, {
      x: 50,
      y: 750,
      size: 12,
      maxWidth: 500
    });
    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=contract.pdf');
    res.send(pdfBytes);
  } catch (err) {
    console.error('PDF error:', err);
    res.status(500).json({ error: 'Server error: ' + (err.message || err) });
  }
});

// --- Subscription System Stub ---
app.post('/api/subscribe', async (req, res) => {
  // TODO: Integrate payment provider and manage subscriptions
  res.json({ status: 'stub', message: 'Subscription endpoint not implemented yet.' });
});

// --- Admin Dashboard Stub ---
app.get('/api/admin/subscriptions', async (req, res) => {
  // TODO: Return list of subscriptions for admin dashboard
  res.json({ status: 'stub', subscriptions: [] });
});

// --- Email Login/Confirmation Stub ---
app.post('/api/auth/login', async (req, res) => {
  // TODO: Implement email login and confirmation
  res.json({ status: 'stub', message: 'Email login not implemented yet.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Access URL: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
});
