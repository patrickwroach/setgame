// Script to reset users collection - delete all and recreate with UIDs from Firebase Auth
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function resetUsers() {
  console.log('Starting user collection reset...\n');
  
  try {
    // Step 1: Delete all existing user documents
    console.log('Step 1: Deleting all existing user documents...');
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} documents to delete`);
    
    const deleteBatch = db.batch();
    usersSnapshot.docs.forEach(doc => {
      console.log(`  Deleting: ${doc.id}`);
      deleteBatch.delete(doc.ref);
    });
    
    await deleteBatch.commit();
    console.log('✅ All user documents deleted\n');
    
    // Step 2: Get all Firebase Auth users
    console.log('Step 2: Fetching Firebase Auth users...');
    const listUsersResult = await auth.listUsers();
    console.log(`Found ${listUsersResult.users.length} Firebase Auth users\n`);
    
    // Step 3: Create new user documents keyed by UID
    console.log('Step 3: Creating new user documents...');
    const createBatch = db.batch();
    
    for (const userRecord of listUsersResult.users) {
      const email = userRecord.email || '';
      const emailPrefix = email.split('@')[0] || 'User';
      const sanitized = emailPrefix.replace(/[^a-zA-Z0-9._-]/g, '');
      const displayName = sanitized.substring(0, 50) || 'User';
      
      const userDoc = {
        uid: userRecord.uid,
        email: email.toLowerCase(),
        displayName: displayName,
        approved: true, // Auto-approve existing users
        admin: false, // Default to non-admin, can be updated manually
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      const docRef = db.collection('users').doc(userRecord.uid);
      createBatch.set(docRef, userDoc);
      
      console.log(`  Creating: ${userRecord.uid}`);
      console.log(`    Email: ${email}`);
      console.log(`    Display Name: ${displayName}`);
    }
    
    await createBatch.commit();
    console.log('\n✅ User collection reset complete!');
    console.log(`Created ${listUsersResult.users.length} user documents`);
    
  } catch (error) {
    console.error('\n❌ Reset failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

resetUsers();
