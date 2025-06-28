const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { PDFDocument } = require('pdf-lib');
const admin = require('firebase-admin');
const { OpenAIApi, Configuration } = require('openai');
require('dotenv').config();

// Environment variable verification
console.log("Firebase Project ID:", process.env.FIREBASE_PROJECT_ID);
console.log("Firebase Client Email:", process.env.FIREBASE_CLIENT_EMAIL);

// Firebase Admin Initialization
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey
    })
  });
  console.log("Firebase initialized");
} catch (err) {
  console.error("Firebase init error:", err);
}

// Test Firestore connection
const db = admin.firestore();
db.collection('test').doc('test').get()
  .then(doc => console.log("Firestore connection successful"))
  .catch(err => console.error("Firestore error:", err));

// OpenAI Initialization
const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));
// Test OpenAI connection
async function testOpenAI() {
  try {
    await openai.listModels();
    console.log("OpenAI connection successful");
  } catch (err) {
    console.error("OpenAI error:", err);
  }
}
testOpenAI();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/api/generate', async (req, res) => {
  const idea = req.body.idea;
  const result = `Project Description: "${idea}"\nThis software should be built to solve the following problem...`;
  res.json({ result });
});

app.post('/api/contract', async (req, res) => {
  const { projectTitle, clientName } = req.body;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  page.drawText(`Contract for ${clientName}\nProject Title: ${projectTitle}`, { x: 50, y: 350 });
  const pdfBytes = await pdfDoc.save();
  res.setHeader('Content-Type', 'application/pdf');
  res.send(pdfBytes);
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

