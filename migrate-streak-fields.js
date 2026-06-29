// Backfill currentStreak and longestStreak on daily_completions docs.
// Usage: node migrate-streak-fields.js [--force]

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

function parseDateString(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayDateStringEastern() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(now);
}

function getCompletedDateSet(completions) {
  return new Set(
    Object.entries(completions || {})
      .filter(([_, completion]) => completion && completion.completed)
      .map(([date]) => date)
  );
}

function calculateCurrentStreak(completions, completedDates, today) {
  if (completedDates.size === 0) return 0;

  // If user played today and marked incomplete, streak is broken.
  if (completions[today] && !completions[today].completed) {
    return 0;
  }

  const todayDate = parseDateString(today);
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  const todayKey = formatDateString(todayDate);
  const yesterdayKey = formatDateString(yesterdayDate);

  const anchorKey = completedDates.has(todayKey)
    ? todayKey
    : completedDates.has(yesterdayKey)
      ? yesterdayKey
      : null;

  if (!anchorKey) return 0;

  let streak = 0;
  let checkDate = parseDateString(anchorKey);

  while (completedDates.has(formatDateString(checkDate))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

function calculateLongestStreak(completedDates) {
  if (completedDates.size === 0) return 0;

  const sortedDates = Array.from(completedDates).sort((a, b) => a.localeCompare(b));
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = parseDateString(sortedDates[i - 1]);
    const curr = parseDateString(sortedDates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

async function migrateStreakFields() {
  const force = process.argv.includes('--force');
  const today = getTodayDateStringEastern();

  console.log('Starting streak field migration...');
  console.log(`Today (Eastern): ${today}`);
  console.log(`Mode: ${force ? 'force recompute' : 'skip docs with cached streak fields'}\n`);

  const snapshot = await db.collection('daily_completions').get();
  console.log(`Found ${snapshot.size} daily_completions docs`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    try {
      const data = doc.data() || {};
      const hasCachedFields = typeof data.currentStreak === 'number' && typeof data.longestStreak === 'number';

      if (!force && hasCachedFields) {
        skipped++;
        continue;
      }

      const completions = data.completions || {};
      const completedDates = getCompletedDateSet(completions);

      const currentStreak = calculateCurrentStreak(completions, completedDates, today);
      const longestStreak = calculateLongestStreak(completedDates);

      batch.update(doc.ref, { currentStreak, longestStreak });
      batchCount++;
      updated++;

      if (batchCount === 400) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    } catch (error) {
      failed++;
      console.error(`Failed doc ${doc.id}:`, error.message || error);
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log('\nMigration complete.');
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
}

migrateStreakFields()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
