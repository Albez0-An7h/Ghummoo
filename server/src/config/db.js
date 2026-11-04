const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

let memoryServer = null;

// Connects to MONGODB_URI when set. Otherwise starts an embedded MongoDB (mongodb-memory-server)
// that persists to server/.data so local development and demos work with zero setup.
async function connectDB() {
  mongoose.set('strictQuery', true);
  let uri = process.env.MONGODB_URI;
  let mode = 'external';

  if (!uri) {
    // Keep the downloaded mongod binary in server/.cache regardless of the working directory.
    process.env.MONGOMS_DOWNLOAD_DIR = process.env.MONGOMS_DOWNLOAD_DIR || path.join(__dirname, '..', '..', '.cache', 'mongodb-binaries');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const dbPath = process.env.EMBEDDED_DB_PATH || path.join(__dirname, '..', '..', '.data');
    fs.mkdirSync(dbPath, { recursive: true });
    try {
      memoryServer = await MongoMemoryServer.create({
        instance: { dbPath, storageEngine: 'wiredTiger', port: Number(process.env.EMBEDDED_DB_PORT) || undefined },
      });
    } catch (err) {
      if (/DBPathInUse|lock file/i.test(String(err && err.message))) {
        err.message = `The embedded database at ${dbPath} is already in use by another Ghumo server. `
          + 'Stop the other server (only one can use the embedded DB at a time), or set MONGODB_URI.';
      }
      throw err;
    }
    uri = memoryServer.getUri('ghumo');
    mode = 'embedded';
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`[db] connected (${mode}) → ${mongoose.connection.name}`);
  return { mode };
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop({ doCleanup: false });
}

module.exports = { connectDB, disconnectDB };
