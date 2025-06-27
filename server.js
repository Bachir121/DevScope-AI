
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { PDFDocument } = require('pdf-lib');
require('dotenv').config();

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
