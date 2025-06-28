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

// API Endpoints
app.post('/api/generate', async (req, res) => {
  try {
    const idea = req.body.idea;
    const result = `Project Description: "${idea}"\nDetailed solution description...`;
    res.json({ result });
  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({ error: "Generation failed" });
  }
});

app.post('/api/contract', async (req, res) => {
  try {
    const { projectTitle, clientName } = req.body;
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    
    page.drawText(`Contract Agreement\n\nClient: ${clientName}\nProject: ${projectTitle}`, { 
      x: 50, 
      y: 350,
      size: 14
    });
    
    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=contract.pdf');
    res.send(pdfBytes);
  } catch (err) {
    console.error("PDF error:", err);
    res.status(500).json({ error: "PDF generation failed" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Access URL: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
});
