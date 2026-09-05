import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function deleteLegacyBG() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('parkinglocations');

    const result = await collection.deleteOne({ parkingCode: 'BG12' });

    if (result.deletedCount > 0) {
      console.log(`✅ Successfully deleted legacy record 'BG12' (Botanical garden) from 'parkinglocations' collection.`);
    } else {
      console.log(`⚠️ Record 'BG12' not found or already deleted.`);
    }

  } catch (err) {
    console.error('❌ Error during deletion:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

deleteLegacyBG();
