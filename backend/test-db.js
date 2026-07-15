import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const CONN_OPTIONS = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
};

async function testConnections() {
  const ATLAS_URI = process.env.MONGO_URI;
  const LOCAL_URI = process.env.MONGO_LOCAL_URI || 'mongodb://127.0.0.1:27017/drivix';

  console.log('ATLAS_URI from env:', ATLAS_URI);
  console.log('LOCAL_URI:', LOCAL_URI);

  if (ATLAS_URI) {
    console.log('Attempting Atlas connection...');
    try {
      const conn = await mongoose.connect(ATLAS_URI, CONN_OPTIONS);
      console.log('✅ Atlas connected successfully! Host:', conn.connection.host);
      await mongoose.disconnect();
      console.log('Disconnected from Atlas.');
    } catch (err) {
      console.error('❌ Atlas connection failed:', err.message);
    }
  }

  console.log('Attempting Local connection...');
  try {
    const conn = await mongoose.connect(LOCAL_URI, CONN_OPTIONS);
    console.log('✅ Local connected successfully! Host:', conn.connection.host);
    await mongoose.disconnect();
    console.log('Disconnected from Local.');
  } catch (err) {
    console.error('❌ Local connection failed:', err.message);
  }
  
  process.exit(0);
}

testConnections();
