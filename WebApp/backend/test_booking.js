import mongoose from 'mongoose';
import { createBooking } from './controllers/bookingController.js';
import User from './models/User.js';

const MONGO_URI = 'mongodb+srv://drivixmobility_db_user:X9lvJNDZ1RUknC4N@drivix.irkmtpg.mongodb.net/drivix';

async function test() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('📡 Connected to MongoDB Atlas.');

    // Find a test user
    const user = await User.findOne({ email: 'standard_user@drivix.com' }) || await User.findOne({});
    if (!user) {
      console.log('No user found in the DB.');
      return;
    }
    console.log('Using user:', user.email);

    // Find Sharda University location
    const ParkingLocation = mongoose.model('ParkingLocation');
    const sharda = await ParkingLocation.findOne({ parkingName: 'Sharda University' });
    if (!sharda) {
      console.log('Sharda University location not found.');
      return;
    }

    // Find a floor
    const ParkingFloor = mongoose.model('ParkingFloor');
    const floor = await ParkingFloor.findOne({ parkingHubId: sharda._id });
    if (!floor) {
      console.log('Floor not found.');
      return;
    }

    const req = {
      user: user,
      app: {
        get(name) {
          return null; // Mock socketio get
        }
      },
      body: {
        bookingId: `DRX-TEST-${Date.now().toString(36).toUpperCase()}`,
        name: 'Test User',
        mobile: '9999999901',
        vehicleNumber: 'DL01STANDARD',
        vehicleName: 'Sedan',
        locationId: sharda._id.toString(),
        locationName: sharda.parkingName,
        slotId: "L1-A1", // <-- Send "L1-A1" slot ID
        floor: floor.floorName,
        entryDate: new Date().toISOString().split('T')[0],
        entryTime: '18:00',
        duration: 2,
        totalCost: 120,
        paymentMode: 'PAY_AFTER_CHECKOUT'
      }
    };

    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.responseData = data;
        return this;
      }
    };

    console.log('Calling createBooking...');
    await createBooking(req, res);
    console.log('Response Status:', res.statusCode);
    console.log('Response Data:', res.responseData);

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

test();
