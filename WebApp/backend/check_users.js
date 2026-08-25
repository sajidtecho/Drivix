import mongoose from 'mongoose';

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
const MONGO_URI = 'mongodb+srv://drivixmobility_db_user:X9lvJNDZ1RUknC4N@drivix.irkmtpg.mongodb.net/drivix';

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('📡 Connected.');

    const users = await User.find({});
    console.log(`Users: ${users.length}`);
    for (const u of users) {
      console.log(` - Email: ${u.email}, Role: ${u.role}, Name: ${u.fullName || u.name}`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
