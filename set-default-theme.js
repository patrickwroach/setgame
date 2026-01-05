const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setDefaultThemeForAllUsers() {
  try {
    console.log('Starting to update all users with default theme preference...');
    
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    
    if (snapshot.empty) {
      console.log('No users found in the database.');
      return;
    }
    
    console.log(`Found ${snapshot.size} users to update.`);
    
    let updateCount = 0;
    let skipCount = 0;
    const batch = db.batch();
    
    snapshot.forEach((doc) => {
      const userData = doc.data();
      
      // Only update if themePreference doesn't exist
      if (!userData.themePreference) {
        batch.update(doc.ref, { themePreference: 'system' });
        updateCount++;
        console.log(`Queued update for user: ${doc.id} (${userData.email || 'no email'})`);
      } else {
        skipCount++;
        console.log(`Skipping user: ${doc.id} (already has theme: ${userData.themePreference})`);
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`\n✅ Successfully updated ${updateCount} users with default theme 'system'.`);
    } else {
      console.log('\n✅ No users needed updating.');
    }
    
    console.log(`📊 Summary: ${updateCount} updated, ${skipCount} skipped, ${snapshot.size} total users.`);
    
  } catch (error) {
    console.error('❌ Error updating users:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

setDefaultThemeForAllUsers();
