import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function listAll() {
  try {
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    const collection = db.collection('parkinglocations');
    const docs = await collection.find({}).toArray();

    console.log(`\n Total documents in 'parkinglocations' collection: ${docs.length}\n`);
    console.table(docs.map(d => ({
      _id: d._id.toString(),
      parkingCode: d.parkingCode,
      parkingName: d.parkingName,
      city: d.city,
      status: d.status,
      totalSlots: d.totalSlots,
      hourlyPrice: d.hourlyPrice
    })));

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

listAll();
