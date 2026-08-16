import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ParkingLocation from '../models/ParkingLocation.js';
import ParkingFloor from '../models/ParkingFloor.js';
import Slot from '../models/Slot.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { runDatabaseMigration } from '../utils/migration.js';
import { createBooking } from '../controllers/bookingController.js';
import { simulateEntry, simulateExit } from '../controllers/gateController.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://drivixmobility_db_user:X9lvJNDZ1RUknC4N@drivix.irkmtpg.mongodb.net/drivix';

async function runTests() {
  console.log('🧪 Starting Phase 3 Integration Tests (ANPR Simulator Gate)...');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('📡 Connected to database.');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }

  let testUser, testLocation, testFloor;

  try {
    // 1. Setup User
    testUser = await User.findOne({ email: 'gate_test_user@drivix.com' });
    if (!testUser) {
      testUser = await User.create({
        fullName: 'Gate Test User',
        email: 'gate_test_user@drivix.com',
        mobile: '9999999903',
        role: 'user',
        password: 'password123'
      });
    }

    // 2. Setup Parking Hub with 1 Slot (T3-A1)
    testLocation = await ParkingLocation.create({
      parkingName: 'Gate Simulator Hub',
      parkingCode: 'GSH-' + Date.now().toString(36).toUpperCase(),
      address: 'Gate Street 303',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      latitude: 28.6139,
      longitude: 77.2090,
      openingTime: '00:00',
      closingTime: '23:59',
      totalFloors: 1,
      totalSlots: 1,
      availableSlots: 1,
      hourlyPrice: 50,
      floors: ['T3']
    });

    console.log(`📍 Created test location: ${testLocation.parkingName}`);

    // Create Floor document via migration
    await runDatabaseMigration();
    testFloor = await ParkingFloor.findOne({ parkingHubId: testLocation._id, floorName: 'T3' });

    // Create Slot T3-A1
    await Slot.create({
      facilityId: testLocation._id,
      id: 'T3-A1',
      floor: 'T3',
      row: 'A',
      slotNumber: '1',
      number: 1,
      floorId: testFloor._id,
      status: 'available',
      EVSupported: false,
      Accessibility: false,
      NearElevator: false,
      NearExit: false
    });
    console.log('✅ Created mock slot T3-A1.');

    // Update floor slots count to sync
    testFloor.totalSlots = 1;
    testFloor.availableSlots = 1;
    await testFloor.save();

    // Helper for mock HTTP responses
    const mockRes = () => {
      const res = {};
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.json = (data) => {
        res.data = data;
        return res;
      };
      return res;
    };

    // 3. Create active reservation on floor T3 for plate DL03GATE (unassigned)
    console.log('🔄 Creating active Confirmed reservation for plate DL03GATE...');
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayLocalDate = `${year}-${month}-${day}`;

    // Set startTime to 5 minutes in the future to avoid validation errors, while remaining within entry window
    let testMin = now.getMinutes() + 5;
    let testHour = now.getHours();
    if (testMin >= 60) {
      testMin -= 60;
      testHour += 1;
    }
    if (testHour >= 24) {
      testHour -= 24;
    }
    const startTimeStr = `${String(testHour).padStart(2, '0')}:${String(testMin).padStart(2, '0')}`;

    const reqCreate = {
      user: testUser,
      body: {
        bookingId: 'DRX-P3-001',
        name: 'Gate Tester',
        mobile: '9999999903',
        vehicleNumber: 'DL03GATE',
        vehicleName: 'Sedan G',
        locationId: testLocation._id,
        floor: 'T3',
        entryDate: todayLocalDate,
        entryTime: startTimeStr,
        duration: 4,
        paymentMode: 'PAY_AFTER_CHECKOUT'
      },
      app: { get: () => null }
    };
    const resCreate = mockRes();
    await createBooking(reqCreate, resCreate);

    if (resCreate.statusCode && resCreate.statusCode >= 400) {
      throw new Error(`Booking creation failed: ${resCreate.data.message}`);
    }
    const bookingDoc = resCreate.data;
    console.log(`✅ Booking created. ID: ${bookingDoc.bookingId}, Status: ${bookingDoc.status}, slotId: ${bookingDoc.slotId}`);

    // 4. TEST CASE 1: Entry gate check-in for an invalid vehicle number plate (should fail)
    console.log('\n👉 Test Case 1: Simulating Entry Check-In with invalid plate (DL03FAKE)...');
    const resEntry1 = mockRes();
    await simulateEntry({
      body: {
        vehicleNumber: 'DL03FAKE',
        parkingHubId: testLocation._id
      }
    }, resEntry1);

    console.log(`✅ Result: Status code ${resEntry1.statusCode} (Expected: 404), Message: "${resEntry1.data.message}"`);
    if (resEntry1.statusCode !== 404) {
      throw new Error('Test Case 1 failed: Expected 404 error');
    }

    // 5. TEST CASE 2: Entry gate check-in for valid vehicle number plate DL03GATE
    // Since slotId is currently null, it should auto-assign T3-A1 reactively!
    console.log('\n👉 Test Case 2: Simulating Entry Check-In with valid plate (DL03GATE)...');
    const resEntry2 = mockRes();
    await simulateEntry({
      body: {
        vehicleNumber: 'DL03GATE',
        parkingHubId: testLocation._id
      }
    }, resEntry2);

    if (resEntry2.statusCode && resEntry2.statusCode >= 400) {
      throw new Error(`Test Case 2 failed: ${resEntry2.data.message}`);
    }

    const updatedBooking = resEntry2.data.booking;
    console.log(`✅ Access Granted! Slot allocated reactively: ${updatedBooking.slotId}`);
    console.log(`✅ Booking Status updated to: "${updatedBooking.status}" (Expected: Checked In)`);
    
    // Assert slot is occupied in DB
    const checkedSlot = await Slot.findOne({ id: 'T3-A1', facilityId: testLocation._id });
    console.log(`📊 Slot state in DB: ${checkedSlot.id} is "${checkedSlot.CurrentStatus}" (Expected: Occupied)`);
    
    if (updatedBooking.slotId !== 'T3-A1' || updatedBooking.status !== 'Checked In' || checkedSlot.CurrentStatus !== 'Occupied') {
      throw new Error('Test Case 2 validation failed');
    }

    // 6. TEST CASE 3: Exit gate check-out for plate DL03GATE
    console.log('\n👉 Test Case 3: Simulating Exit Check-Out for plate (DL03GATE)...');
    const resExit = mockRes();
    await simulateExit({
      body: {
        vehicleNumber: 'DL03GATE',
        parkingHubId: testLocation._id
      }
    }, resExit);

    if (resExit.statusCode && resExit.statusCode >= 400) {
      throw new Error(`Test Case 3 failed: ${resExit.data.message}`);
    }

    const exitedBooking = resExit.data.booking;
    console.log(`✅ Access Granted! Booking Status updated to: "${exitedBooking.status}" (Expected: Checked Out)`);
    
    const vacatedSlot = await Slot.findOne({ id: 'T3-A1', facilityId: testLocation._id });
    console.log(`📊 Slot state in DB: ${vacatedSlot.id} is "${vacatedSlot.CurrentStatus}" (Expected: Available)`);

    if (exitedBooking.status !== 'Checked Out' || vacatedSlot.CurrentStatus !== 'Available') {
      throw new Error('Test Case 3 validation failed');
    }

  } catch (error) {
    console.error('❌ Phase 3 test error:', error);
  } finally {
    // 7. Clean up
    console.log('\n🧹 Cleaning up test records...');
    if (testLocation) {
      await Booking.deleteMany({ parkingHubId: testLocation._id });
      await Slot.deleteMany({ facilityId: testLocation._id });
      await ParkingFloor.deleteMany({ parkingHubId: testLocation._id });
      await ParkingLocation.findByIdAndDelete(testLocation._id);
    }
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database. All Phase 3 tests completed.');
  }
}

runTests();
