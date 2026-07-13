import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
console.log('Connecting...');
await mongoose.connect(MONGO_URI);

const users = await User.find({});
console.log(`Found ${users.length} users:`);
for (const u of users) {
  console.log(`- Name: ${u.name || u.fullName}, Email: ${u.email}, Role: ${u.role}`);
}

process.exit(0);
