import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
const ParkingLocation = mongoose.model('ParkingLocation', new mongoose.Schema({}, { strict: false }));
const ParkingFloor = mongoose.model('ParkingFloor', new mongoose.Schema({}, { strict: false }));

const MONGO_URI = 'mongodb+srv://drivixmobility_db_user:X9lvJNDZ1RUknC4N@drivix.irkmtpg.mongodb.net/drivix';

async function test() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('📡 Connected.');

    // 1. Hash password123 and update drivixmobility@gmail.com
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    await User.findOneAndUpdate({ email: 'drivixmobility@gmail.com' }, { password: hashedPassword });
    console.log('Password updated for drivixmobility@gmail.com.');

    // 2. Login on Render to get token
    console.log('Logging in on Render...');
    const loginRes = await fetch('https://drivix-backend-0qvx.onrender.com/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'drivixmobility@gmail.com',
        password: 'password123'
      })
    });

    console.log('Login Status:', loginRes.status);
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.log('Login failed:', loginData);
      return;
    }
    const token = loginData.token;
    console.log('Login successful. Token obtained.');

    const sharda = await ParkingLocation.findOne({ parkingName: 'Sharda University' });
    const floor = await ParkingFloor.findOne({ parkingHubId: sharda._id });

    // Send payload just like the frontend
    const payload = {
      bookingId: `DRX-TEST-${Date.now().toString(36).toUpperCase()}`,
      name: 'Test User',
      mobile: '9999999901',
      vehicleNumber: 'DL01STANDARD',
      vehicleName: 'Sedan',
      locationId: sharda._id.toString(),
      locationName: sharda.parkingName,
      slotId: null,
      floor: floor.floorName,
      entryDate: new Date().toISOString().split('T')[0],
      entryTime: '18:00',
      duration: 2,
      totalCost: 120,
      paymentMode: 'PAY_AFTER_CHECKOUT'
    };

    console.log('Sending booking request to Render server...');
    const res = await fetch('https://drivix-backend-0qvx.onrender.com/api/v1/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    console.log('Booking Status:', res.status);
    const data = await res.json();
    console.log('Booking Data:', data);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

test();
