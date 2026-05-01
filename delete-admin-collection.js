// Script to delete the admin_users collection
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

async function deleteCollection() {
  try {
    console.log('Deleting admin_users collection...\n');
    
    const snapshot = await db.collection('admin_users').get();
    console.log(`Found ${snapshot.size} documents to delete`);
    
    if (snapshot.size === 0) {
      console.log('Collection is already empty or does not exist');
      process.exit(0);
    }
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      console.log(`  Deleting: ${doc.id}`);
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log('\n✅ Successfully deleted admin_users collection');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

deleteCollection();
