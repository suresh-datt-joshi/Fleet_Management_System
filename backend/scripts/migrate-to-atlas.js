/**
 * One-time migration: copy all collections from local MongoDB to Atlas.
 * Usage: node scripts/migrate-to-atlas.js
 */
import { MongoClient } from 'mongodb';

const LOCAL_URI = process.env.LOCAL_MONGODB_URI || 'mongodb://127.0.0.1:27017/fleet_management';
const ATLAS_URI = process.env.ATLAS_MONGODB_URI;

if (!ATLAS_URI) {
  console.error('Set ATLAS_MONGODB_URI to your Atlas connection string (include /fleet_management database name).');
  process.exit(1);
}

const DB_NAME = 'fleet_management';
const BATCH_SIZE = 500;

async function copyCollection(sourceDb, targetDb, name) {
  const source = sourceDb.collection(name);
  const target = targetDb.collection(name);

  const count = await source.countDocuments();
  if (count === 0) {
    console.log(`  ${name}: skipped (empty)`);
    return { name, copied: 0 };
  }

  await target.deleteMany({});

  let copied = 0;
  const cursor = source.find({}).batchSize(BATCH_SIZE);

  let batch = [];
  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length >= BATCH_SIZE) {
      await target.insertMany(batch, { ordered: false });
      copied += batch.length;
      batch = [];
    }
  }

  if (batch.length > 0) {
    await target.insertMany(batch, { ordered: false });
    copied += batch.length;
  }

  const targetCount = await target.countDocuments();
  if (targetCount !== count) {
    throw new Error(`${name}: count mismatch (source=${count}, target=${targetCount})`);
  }

  console.log(`  ${name}: ${copied} documents`);
  return { name, copied };
}

async function main() {
  const localClient = new MongoClient(LOCAL_URI);
  const atlasClient = new MongoClient(ATLAS_URI);

  try {
    await localClient.connect();
    await atlasClient.connect();
    console.log('Connected to local MongoDB and Atlas');

    const localDb = localClient.db(DB_NAME);
    const atlasDb = atlasClient.db(DB_NAME);

    const collections = (await localDb.listCollections().toArray())
      .map((c) => c.name)
      .filter((name) => !name.startsWith('system.'));

    console.log(`Migrating ${collections.length} collections...\n`);

    const results = [];
    for (const name of collections) {
      results.push(await copyCollection(localDb, atlasDb, name));
    }

    const total = results.reduce((sum, r) => sum + r.copied, 0);
    console.log(`\nMigration complete: ${total} documents across ${collections.length} collections`);
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
