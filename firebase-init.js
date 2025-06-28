// firebase-init.js
const admin = require('firebase-admin');

function initializeFirebase() {
  try {
    // Method 1: Use base64 encoded credentials (recommended)
    if (process.env.FIREBASE_CREDENTIALS_BASE64) {
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString()
      );
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });
      return admin;
    }

    // Method 2: Use separate env variables (fallback)
    if (process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
      });
      return admin;
    }

    throw new Error('Missing Firebase credentials');
  } catch (error) {
    console.error('🔥 Fatal: Firebase initialization failed:', error);
    process.exit(1);
  }
}

module.exports = initializeFirebase();
