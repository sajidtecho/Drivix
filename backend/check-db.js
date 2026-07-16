import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function check() {
  try {
    console.log('Connecting to:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    for (const coll of collections) {
      const count = await mongoose.connection.db.collection(coll.name).countDocuments();
      console.log(`Collection ${coll.name}: ${count} documents`);
    }

    const partners = await mongoose.connection.db.collection('partners').find().toArray();
    console.log('Partners status values:', partners.map(p => p.status));

    const reviews = await mongoose.connection.db.collection('reviews').find().toArray();
    console.log('Reviews ratings:', reviews.map(r => r.rating));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

check();
