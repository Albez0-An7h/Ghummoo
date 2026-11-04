require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { connectDB, disconnectDB } = require('./config/db');
const { seedIfEmpty } = require('./seedData');

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('JWT_SECRET must be set in production.');
    process.exit(1);
  }
  process.env.JWT_SECRET = 'dev-only-insecure-secret';
  console.warn('[auth] JWT_SECRET not set; using an insecure development secret.');
}

const app = require('./app');

const PORT = process.env.PORT || 5050;

async function start() {
  const { mode } = await connectDB();
  if (process.env.SEED_ON_EMPTY !== 'false' && (mode === 'embedded' || process.env.SEED_ON_EMPTY === 'true')) {
    await seedIfEmpty();
  }
  const server = app.listen(PORT, '0.0.0.0', () => console.log(`[ghumo] listening on http://localhost:${PORT}`));
  let closing = false;
  const shutdown = (signal) => async () => {
    if (closing) return;
    closing = true;
    server.close();
    await disconnectDB().catch(() => {});
    // nodemon's default restart signal: re-raise it so nodemon knows we're done.
    if (signal === 'SIGUSR2') process.kill(process.pid, 'SIGUSR2');
    else process.exit(0);
  };
  process.on('SIGINT', shutdown('SIGINT'));
  process.on('SIGTERM', shutdown('SIGTERM'));
  process.once('SIGUSR2', shutdown('SIGUSR2'));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
