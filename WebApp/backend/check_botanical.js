import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function checkBotanical() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('parkinglocations');

    const allDocs = await collection.find({
      $or: [
        { parkingName: /botanical/i },
        { address: /botanical/i },
        { parkingName: /38A/i },
        { address: /38A/i },
        { parkingCode: /BG/i }
      ]
    }).toArray();

    console.log(`\n🔍 Found ${allDocs.length} matching document(s) in 'parkinglocations' collection:\n`);
    allDocs.forEach((doc, idx) => {
      console.log(`--- [Record ${idx + 1}] ---`);
      console.log(`ID: ${doc._id}`);
      console.log(`Name: ${doc.parkingName}`);
      console.log(`Code: ${doc.parkingCode}`);
      console.log(`Address: ${doc.address}`);
      console.log(`City: ${doc.city}`);
      console.log(`Status: ${doc.status}`);
      console.log(`Total Slots: ${doc.totalSlots}`);
      console.log(`Available Slots: ${doc.availableSlots}`);
      console.log(`Hourly Price: ${doc.hourlyPrice}`);
      console.log('------------------------\n');
    });

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkBotanical();
