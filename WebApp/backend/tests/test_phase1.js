import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ParkingLocation from '../models/ParkingLocation.js';
import ParkingFloor from '../models/ParkingFloor.js';
import Slot from '../models/Slot.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { runDatabaseMigration } from '../utils/migration.js';
import { createBooking, vacateBooking, extendBooking } from '../controllers/bookingController.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://drivixmobility_db_user:X9lvJNDZ1RUknC4N@drivix.irkmtpg.mongodb.net/drivix';

async function runTests() {
  console.log('🧪 Starting Phase 1 Integration Tests...');
  
  // 1. Connect to Database
  try {
    await mongoose.connect(MONGO_URI);
    console.log('📡 Connected to test database.');
  } catch (err) {
    console.error('❌ Failed to connect to database:', err);
    process.exit(1);
  }

  // 2. Prepare test data
  let testUser, testLocation, testFloor;
  try {
    // Find or create a test user
    testUser = await User.findOne({ email: 'test_user@drivix.com' });
    if (!testUser) {
      testUser = await User.create({
        fullName: 'Test User',
        email: 'test_user@drivix.com',
        mobile: '9999999999',
        role: 'user',
        password: 'password123'
      });
    }

    // Create a temporary test parking location with capacity = 2
    testLocation = await ParkingLocation.create({
      parkingName: 'Test Capacity Hub',
      parkingCode: 'TCH-' + Date.now().toString(36).toUpperCase(),
      address: 'Test Street 101',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      latitude: 28.6139,
      longitude: 77.2090,
      openingTime: '00:00',
      closingTime: '23:59',
      totalFloors: 1,
      totalSlots: 2,
      availableSlots: 2,
      hourlyPrice: 50,
      floors: ['T1']
    });

    console.log(`📍 Created test parking location: ${testLocation.parkingName} (Capacity: 2)`);

    // Create mock slot documents so capacity is counted correctly
    await Slot.create([
      {
        facilityId: testLocation._id,
        id: 'T1-A1',
        floor: 'T1',
        row: 'A',
        number: 1,
        status: 'available',
        floorId: new mongoose.Types.ObjectId() // temporary placeholder, will be updated by migration
      },
      {
        facilityId: testLocation._id,
        id: 'T1-A2',
        floor: 'T1',
        row: 'A',
        number: 2,
        status: 'available',
        floorId: new mongoose.Types.ObjectId()
      }
    ]);
    console.log('✅ Created mock slots T1-A1 and T1-A2 for test location.');

    // Run database migration to initialize floor for our test location
    await runDatabaseMigration();

    // Verify ParkingFloor was created
    testFloor = await ParkingFloor.findOne({ parkingHubId: testLocation._id, floorName: 'T1' });
    if (!testFloor) {
      throw new Error('Migration failed to create ParkingFloor');
    }
    console.log(`🏢 Created floor doc '${testFloor.floorName}' with totalSlots: ${testFloor.totalSlots}`);

    // Create mock req / res helper
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

    // 3. TEST CASE 1: Book slot below capacity (should succeed)
    console.log('\n👉 Test Case 1: Booking slot 1 of 2 (below capacity)');
    const req1 = {
      user: testUser,
      body: {
        bookingId: 'DRX-TEST-001',
        name: 'Test driver 1',
        mobile: '9999999999',
        vehicleNumber: 'DL01AB1234',
        vehicleName: 'Sedan X',
        locationId: testLocation._id,
        floor: 'T1',
        entryDate: '2026-09-01',
        entryTime: '12:00',
        duration: 2,
        paymentMode: 'PAY_AFTER_CHECKOUT'
      },
      app: { get: () => null } // Stub Socket.io
    };
    const res1 = mockRes();
    await createBooking(req1, res1);

    if (res1.statusCode && res1.statusCode >= 400) {
      throw new Error(`Test Case 1 failed: ${res1.data.message}`);
    }
    console.log('✅ Booking 1 confirmed successfully (slotId is null).');

    // 4. TEST CASE 2: Book slot 2 of 2 (at capacity)
    console.log('\n👉 Test Case 2: Booking slot 2 of 2 (reaching capacity)');
    const req2 = {
      user: testUser,
      body: {
        bookingId: 'DRX-TEST-002',
        name: 'Test driver 2',
        mobile: '9999999998',
        vehicleNumber: 'DL01AB5678',
        vehicleName: 'SUV Y',
        locationId: testLocation._id,
        floor: 'T1',
        entryDate: '2026-09-01',
        entryTime: '12:00',
        duration: 2,
        paymentMode: 'PAY_AFTER_CHECKOUT'
      },
      app: { get: () => null }
    };
    const res2 = mockRes();
    await createBooking(req2, res2);

    if (res2.statusCode && res2.statusCode >= 400) {
      throw new Error(`Test Case 2 failed: ${res2.data.message}`);
    }
    console.log('✅ Booking 2 confirmed successfully.');

    // 5. TEST CASE 3: Book slot 3 of 2 (exceeding capacity) - should be rejected!
    console.log('\n👉 Test Case 3: Booking slot 3 of 2 (should be rejected)');
    const req3 = {
      user: testUser,
      body: {
        bookingId: 'DRX-TEST-003',
        name: 'Test driver 3',
        mobile: '9999999997',
        vehicleNumber: 'DL01AB9012',
        vehicleName: 'Hatchback Z',
        locationId: testLocation._id,
        floor: 'T1',
        entryDate: '2026-09-01',
        entryTime: '12:00',
        duration: 2,
        paymentMode: 'PAY_AFTER_CHECKOUT'
      },
      app: { get: () => null }
    };
    const res3 = mockRes();
    await createBooking(req3, res3);

    if (res3.statusCode === 400 && res3.data.message.includes('rejected')) {
      console.log('✅ Test Case 3 passed: Booking correctly rejected because floor capacity is full.');
    } else {
      throw new Error(`Test Case 3 failed: Expected 400 rejection, got ${res3.statusCode}`);
    }

    // Verify floor capacities document
    testFloor = await ParkingFloor.findById(testFloor._id);
    console.log(`📊 Floor state - Total: ${testFloor.totalSlots}, Reserved: ${testFloor.reservedCapacity}, Available: ${testFloor.availableSlots}`);

    // 6. TEST CASE 4: Vacate booking 1 (should free up capacity)
    console.log('\n👉 Test Case 4: Vacating booking 1 to release capacity');
    const booking1 = res1.data;
    const req4 = {
      user: testUser,
      params: { id: booking1._id },
      body: { paymentMethod: 'cash' },
      app: { get: () => null }
    };
    const res4 = mockRes();
    await vacateBooking(req4, res4);

    if (res4.statusCode && res4.statusCode >= 400) {
      throw new Error(`Test Case 4 failed: ${res4.data.message}`);
    }
    console.log('✅ Booking 1 vacated successfully.');

    // Verify floor capacities document after vacate
    testFloor = await ParkingFloor.findById(testFloor._id);
    console.log(`📊 Floor state after checkout - Total: ${testFloor.totalSlots}, Reserved: ${testFloor.reservedCapacity}, Available: ${testFloor.availableSlots}`);

    // 7. TEST CASE 5: Book slot 3 again (should now succeed since capacity is available)
    console.log('\n👉 Test Case 5: Retrying booking 3 (should succeed now)');
    const res5 = mockRes();
    await createBooking(req3, res5);

    if (res5.statusCode && res5.statusCode >= 400) {
      throw new Error(`Test Case 5 failed: ${res5.data.message}`);
    }
    console.log('✅ Booking 3 confirmed successfully.');

    // 8. TEST CASE 6: Extend booking duration (should check capacity)
    console.log('\n👉 Test Case 6: Extending booking 3 duration (capacity limit)');
    // Try to extend booking 3 by 2 hours.
    // Total capacity = 2, active bookings are Booking 2 and Booking 3.
    // Overlap remains 2/2, so capacity check should approve it because it's the same booking overlapping with itself.
    const booking3 = res5.data;
    const req6 = {
      user: testUser,
      params: { id: booking3._id },
      body: { additionalHours: 2, additionalCost: 100 },
      app: { get: () => null }
    };
    const res6 = mockRes();
    await extendBooking(req6, res6);

    if (res6.statusCode && res6.statusCode >= 400) {
      throw new Error(`Test Case 6 failed: ${res6.data.message}`);
    }
    console.log(`✅ Booking 3 extended successfully. New duration: ${res6.data.booking.duration} hours.`);

  } catch (error) {
    console.error('❌ Integration test error:', error);
  } finally {
    // 9. CLEAN UP
    console.log('\n🧹 Cleaning up test records...');
    if (testLocation) {
      await Booking.deleteMany({ parkingHubId: testLocation._id });
      await Slot.deleteMany({ facilityId: testLocation._id });
      await ParkingFloor.deleteMany({ parkingHubId: testLocation._id });
      await ParkingLocation.findByIdAndDelete(testLocation._id);
      console.log('🗑️ Test documents deleted.');
    }
    await mongoose.disconnect();
    console.log('🔌 Disconnected from test database. Exiting.');
  }
}

runTests();
