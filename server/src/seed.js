// Resets the database and loads demo data:  npm run seed
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { connectDB, disconnectDB } = require('./config/db');
const { seed, clearAll } = require('./seedData');
const { runFoundation } = require('./migrations/v0_1');

(async () => {
  if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
    console.error('Refusing to wipe a production database. Re-run with --force if you are sure.');
    process.exit(1);
  }
  await connectDB();
  await clearAll();
  await seed();
  await runFoundation({ log: console.log });
  console.log('Demo data loaded. Demo accounts are listed in README.md.');
  await disconnectDB();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
