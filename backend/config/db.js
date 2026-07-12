/* global process */
import mongoose from 'mongoose';
import User from '../models/User.js';

const ATLAS_URI = process.env.MONGO_URI;
const LOCAL_URI  = process.env.MONGO_LOCAL_URI || 'mongodb://127.0.0.1:27017/drivix';

// Shared Mongoose options: short server-selection timeout so we fail fast
const CONN_OPTIONS = {
  serverSelectionTimeoutMS: 5000,  // give up after 5 s instead of 30 s
  connectTimeoutMS: 5000,
};

const promoteAdmin = async () => {
  try {
    await User.findOneAndUpdate(
      { email: 'drivixmobility@gmail.com' },
      { role: 'admin' }
    );
    console.log('👑 Ensured drivixmobility@gmail.com is admin');
  } catch (_) {
    // non-fatal – ignore if collection not yet seeded
  }
};

const connectDB = async () => {
  // --- 1. Try Atlas first ---
  if (ATLAS_URI) {
    try {
      const conn = await mongoose.connect(ATLAS_URI, CONN_OPTIONS);
      console.log(`📡 MongoDB Atlas connected: ${conn.connection.host}`);
      await promoteAdmin();
      return;
    } catch (atlasErr) {
      console.warn(`⚠️  Atlas unreachable (${atlasErr.message})`);
      console.warn('🔄 Falling back to local MongoDB...');
      // Disconnect any partial connection before retrying
      try { await mongoose.disconnect(); } catch (_) {}
    }
  }

  // --- 2. Fall back to local MongoDB ---
  try {
    const conn = await mongoose.connect(LOCAL_URI, CONN_OPTIONS);
    console.log(`🗄️  Local MongoDB connected: ${conn.connection.host} (offline mode)`);
    await promoteAdmin();
  } catch (localErr) {
    console.error('❌ Local MongoDB also unreachable:', localErr.message);
    console.error(
      '   → Start local MongoDB with: mongod\n' +
      '   → Or connect to a network that allows port 27017 (try mobile hotspot)'
    );
    // Keep server alive so health endpoint still responds; DB-dependent routes will fail gracefully
  }
};

export default connectDB;
