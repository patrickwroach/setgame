// Script to set a user as admin
// Usage: node set-admin.js <email> <true|false>

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  })
});

const db = admin.firestore();
const auth = admin.auth();

async function setAdmin(email, isAdmin) {
  try {
    console.log(`Setting admin status for ${email} to ${isAdmin}...\n`);
    
    // Find user by email in Firebase Auth
    const userRecord = await auth.getUserByEmail(email);
    console.log(`Found user: ${userRecord.uid}`);
    
    // Update user document
    const userDocRef = db.collection('users').doc(userRecord.uid);
    await userDocRef.update({
      admin: isAdmin
    });
    
    console.log(`✅ Successfully set admin=${isAdmin} for ${email}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

// Parse command line arguments
const email = process.argv[2];
const adminValue = process.argv[3];

if (!email || !adminValue) {
  console.error('Usage: node set-admin.js <email> <true|false>');
  process.exit(1);
}

const isAdmin = adminValue.toLowerCase() === 'true';
setAdmin(email, isAdmin);
