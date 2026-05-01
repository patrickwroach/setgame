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

async function setupCollections() {
  try {
    // Create admin_users
    console.log('Creating admin_users...');
    await db.collection('admin_users').doc('patrickwroach@gmail.com').set({
      email: 'patrickwroach@gmail.com',
      createdAt: new Date().toISOString()
    });
    await db.collection('admin_users').doc('seanfcutler@gmail.com').set({
      email: 'seanfcutler@gmail.com',
      createdAt: new Date().toISOString()
    });
    console.log('✓ Admin users created');

    console.log('\n✅ Setup complete!');
    console.log('You can now delete the allowed_emails collection from Firestore if it exists.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setupCollections();
