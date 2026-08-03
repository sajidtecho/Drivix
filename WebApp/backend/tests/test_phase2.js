import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import ParkingLocation from '../models/ParkingLocation.js';
import ParkingFloor from '../models/ParkingFloor.js';
import Slot from '../models/Slot.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import { runDatabaseMigration } from '../utils/migration.js';
import { createBooking, assignSlot, confirmArrival } from '../controllers/bookingController.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://drivixmobility_db_user:X9lvJNDZ1RUknC4N@drivix.irkmtpg.mongodb.net/drivix';

async function runTests() {
  console.log('🧪 Starting Phase 2 Integration Tests (AI Dynamic Slot Allocation)...');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('📡 Connected to database.');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }

  let testUserStandard, testUserDisabled, testLocation, testFloor;
  let evVehicle, standardVehicle;

  try {
    // 1. Setup Users & Vehicles
    testUserStandard = await User.findOne({ email: 'standard_user@drivix.com' });
    if (!testUserStandard) {
      testUserStandard = await User.create({
        fullName: 'Standard User',
        email: 'standard_user@drivix.com',
        mobile: '9999999901',
        role: 'user',
        password: 'password123',
        preferences: { parkingType: 'Open Space', evCharging: false }
      });
    }

    testUserDisabled = await User.findOne({ email: 'disabled_user@drivix.com' });
    if (!testUserDisabled) {
      testUserDisabled = await User.create({
        fullName: 'Disabled User',
        email: 'disabled_user@drivix.com',
        mobile: '9999999902',
        role: 'user',
        password: 'password123',
        preferences: { parkingType: 'Disabled', evCharging: false }
      });
    }

    standardVehicle = await Vehicle.findOne({ vehicleNumber: 'DL01STANDARD' });
    if (!standardVehicle) {
      standardVehicle = await Vehicle.create({
        userId: testUserStandard._id,
        vehicleNumber: 'DL01STANDARD',
        vehicleType: 'Sedan',
        fuelType: 'Petrol'
      });
    }

    evVehicle = await Vehicle.findOne({ vehicleNumber: 'DL01EVEVEV' });
    if (!evVehicle) {
      evVehicle = await Vehicle.create({
        userId: testUserStandard._id,
        vehicleNumber: 'DL01EVEVEV',
        vehicleType: 'SUV',
        fuelType: 'EV'
      });
    }

    // 2. Setup Parking Hub with 4 Slots (T2-A1, T2-A2, T2-A3, T2-A4)
    // T2-A1: Standard slot (further away)
    // T2-A2: Standard slot (closer, near elevator)
    // T2-A3: EV slot (EV supported)
    // T2-A4: Disabled slot (Accessibility)
    testLocation = await ParkingLocation.create({
      parkingName: 'Dynamic Rank Hub',
      parkingCode: 'DRH-' + Date.now().toString(36).toUpperCase(),
      address: 'Rank Street 202',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      latitude: 28.6139,
      longitude: 77.2090,
      openingTime: '00:00',
      closingTime: '23:59',
      totalFloors: 1,
      totalSlots: 4,
      availableSlots: 4,
      hourlyPrice: 50,
      floors: ['T2']
    });

    console.log(`📍 Created test location: ${testLocation.parkingName}`);

    // Run database migration to build the floor document
    await runDatabaseMigration();

    testFloor = await ParkingFloor.findOne({ parkingHubId: testLocation._id, floorName: 'T2' });
    console.log(`🏢 Floor T2 document created. Real floorId: ${testFloor._id}`);

    // Create 4 slots with the correct real floorId
    await Slot.create([
      {
        facilityId: testLocation._id,
        id: 'T2-A1',
        floor: 'T2',
        row: 'A',
        slotNumber: '1',
        number: 1,
        floorId: testFloor._id,
        status: 'available',
        EVSupported: false,
        Accessibility: false,
        NearElevator: false,
        NearExit: false
      },
      {
        facilityId: testLocation._id,
        id: 'T2-A2',
        floor: 'T2',
        row: 'A',
        slotNumber: '2',
        number: 2,
        floorId: testFloor._id,
        status: 'available',
        EVSupported: false,
        Accessibility: false,
        NearElevator: true,
        NearExit: true
      },
      {
        facilityId: testLocation._id,
        id: 'T2-A3',
        floor: 'T2',
        row: 'A',
        slotNumber: '3',
        number: 3,
        floorId: testFloor._id,
        status: 'available',
        EVSupported: true,
        Accessibility: false,
        NearElevator: false,
        NearExit: false
      },
      {
        facilityId: testLocation._id,
        id: 'T2-A4',
        floor: 'T2',
        row: 'A',
        slotNumber: '4',
        number: 4,
        floorId: testFloor._id,
        status: 'available',
        EVSupported: false,
        Accessibility: true,
        NearElevator: false,
        NearExit: false
      }
    ]);
    console.log('✅ Created 4 mock slots with real floorId.');

    // Update floor details/capacities to sync with the newly created slots
    testFloor.totalSlots = 4;
    testFloor.availableSlots = 4;
    await testFloor.save();
    console.log(`🏢 Updated floor: ${testFloor.floorName} (Capacity: ${testFloor.totalSlots})`);

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

    // 3. TEST CASE 1: Standard User allocation (should rank Near Elevator T2-A2 above T2-A1)
    console.log('\n👉 Test Case 1: Allocating Standard User slot...');
    const req1 = {
      user: testUserStandard,
      body: {
        bookingId: 'DRX-P2-001',
        name: 'Standard Guest',
        mobile: '9999999901',
        vehicleNumber: 'DL01STANDARD',
        vehicleName: 'Sedan S',
        locationId: testLocation._id,
        floor: 'T2',
        entryDate: '2026-09-02',
        entryTime: '10:00',
        duration: 2,
        paymentMode: 'PAY_AFTER_CHECKOUT'
      },
      app: { get: () => null }
    };
    const resB1 = mockRes();
    await createBooking(req1, resB1);
    
    if (resB1.statusCode && resB1.statusCode >= 400) {
      throw new Error(`Booking 1 creation failed: ${resB1.data.message}`);
    }
    const booking1 = resB1.data;

    const res1 = mockRes();
    await assignSlot({ params: { id: booking1._id } }, res1);

    if (res1.statusCode && res1.statusCode >= 400) {
      throw new Error(`Test Case 1 failed: ${res1.data.message}`);
    }

    console.log(`✅ Standard user assigned slot: ${res1.data.booking.slotId} (Expected: T2-A2 due to NearElevator/NearExit scores)`);
    if (res1.data.booking.slotId !== 'T2-A2') {
      throw new Error('Test Case 1 failed: T2-A2 should have been assigned.');
    }

    // 4. TEST CASE 2: EV User allocation (should assign T2-A3 with EVSupported)
    console.log('\n👉 Test Case 2: Allocating EV User slot...');
    const req2 = {
      user: testUserStandard,
      body: {
        bookingId: 'DRX-P2-002',
        name: 'EV Guest',
        mobile: '9999999901',
        vehicleNumber: 'DL01EVEVEV',
        vehicleName: 'SUV E',
        locationId: testLocation._id,
        floor: 'T2',
        entryDate: '2026-09-02',
        entryTime: '10:00',
        duration: 2,
        paymentMode: 'PAY_AFTER_CHECKOUT',
        additionalServices: ['EV Charging']
      },
      app: { get: () => null }
    };
    const resB2 = mockRes();
    await createBooking(req2, resB2);

    if (resB2.statusCode && resB2.statusCode >= 400) {
      throw new Error(`Booking 2 creation failed: ${resB2.data.message}`);
    }
    const booking2 = resB2.data;

    const res2 = mockRes();
    await assignSlot({ params: { id: booking2._id } }, res2);

    if (res2.statusCode && res2.statusCode >= 400) {
      throw new Error(`Test Case 2 failed: ${res2.data.message}`);
    }

    console.log(`✅ EV user assigned slot: ${res2.data.booking.slotId} (Expected: T2-A3)`);
    if (res2.data.booking.slotId !== 'T2-A3') {
      throw new Error('Test Case 2 failed: T2-A3 should have been assigned.');
    }

    // 5. TEST CASE 3: Accessibility User allocation (should assign T2-A4 with Accessibility)
    console.log('\n👉 Test Case 3: Allocating Accessibility User slot...');
    const req3 = {
      user: testUserDisabled,
      body: {
        bookingId: 'DRX-P2-003',
        name: 'Disabled Guest',
        mobile: '9999999902',
        vehicleNumber: 'DL01STANDARD',
        vehicleName: 'Sedan S',
        locationId: testLocation._id,
        floor: 'T2',
        entryDate: '2026-09-02',
        entryTime: '10:00',
        duration: 2,
        paymentMode: 'PAY_AFTER_CHECKOUT'
      },
      app: { get: () => null }
    };
    const resB3 = mockRes();
    await createBooking(req3, resB3);

    if (resB3.statusCode && resB3.statusCode >= 400) {
      throw new Error(`Booking 3 creation failed: ${resB3.data.message}`);
    }
    const booking3 = resB3.data;

    const res3 = mockRes();
    await assignSlot({ params: { id: booking3._id } }, res3);

    if (res3.statusCode && res3.statusCode >= 400) {
      throw new Error(`Test Case 3 failed: ${res3.data.message}`);
    }

    console.log(`✅ Disabled user assigned slot: ${res3.data.booking.slotId} (Expected: T2-A4)`);
    if (res3.data.booking.slotId !== 'T2-A4') {
      throw new Error('Test Case 3 failed: T2-A4 should have been assigned.');
    }

    // 6. TEST CASE 4: QR JWT Encrypted Token Check
    console.log('\n👉 Test Case 4: Verifying QR Code JWT token decodability...');
    const token = res3.data.qrToken;
    if (!token) {
      throw new Error('QR Token was not returned in slot assignment response');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'drivix_jwt_secure_secret_key_123!');
    console.log('✅ Decoded JWT Token payload successfully:', decoded);
    if (decoded.slotId !== 'T2-A4' || decoded.bookingId !== 'DRX-P2-003') {
      throw new Error('Decoded token payload values mismatch');
    }

    // 7. TEST CASE 5: Arrival Confirmation - Delay action
    console.log('\n👉 Test Case 5: Testing Arrival Check - Postponing schedule by 30 mins...');
    const req4 = {
      user: testUserStandard,
      body: {
        bookingId: 'DRX-P2-004',
        name: 'Delay Guest',
        mobile: '9999999901',
        vehicleNumber: 'DL01STANDARD',
        vehicleName: 'Sedan S',
        locationId: testLocation._id,
        floor: 'T2',
        entryDate: '2026-09-02',
        entryTime: '10:00',
        duration: 1,
        paymentMode: 'PAY_AFTER_CHECKOUT'
      },
      app: { get: () => null }
    };
    const resB4 = mockRes();
    await createBooking(req4, resB4);

    if (resB4.statusCode && resB4.statusCode >= 400) {
      throw new Error(`Booking 4 creation failed: ${resB4.data.message}`);
    }
    const booking4 = resB4.data;

    const res5 = mockRes();
    await confirmArrival({
      params: { id: booking4._id },
      body: { action: 'delay' }
    }, res5);

    if (res5.statusCode && res5.statusCode >= 400) {
      throw new Error(`Test Case 5 failed: ${res5.data.message}`);
    }
    console.log(`✅ Postponed start time: ${res5.data.booking.startTime} (Expected: 10:30), endTime: ${res5.data.booking.endTime} (Expected: 11:30)`);
    if (res5.data.booking.startTime !== '10:30' || res5.data.booking.endTime !== '11:30') {
      throw new Error('Test Case 5 failed: start time delay was incorrect.');
    }

    // 8. TEST CASE 6: Arrival Confirmation - Yes check-in (should allocate last remaining slot: T2-A1)
    console.log('\n👉 Test Case 6: Testing Arrival Check - Confirming Arrival (Yes)...');
    const res6 = mockRes();
    await confirmArrival({
      params: { id: booking4._id },
      body: { action: 'yes' }
    }, res6);

    if (res6.statusCode && res6.statusCode >= 400) {
      throw new Error(`Test Case 6 failed: ${res6.data.message}`);
    }
    console.log(`✅ User arrival confirmed! Assigned slot: ${res6.data.booking.slotId} (Expected: T2-A1, last available slot)`);
    if (res6.data.booking.slotId !== 'T2-A1') {
      throw new Error('Test Case 6 failed: expected T2-A1.');
    }

  } catch (error) {
    console.error('❌ Phase 2 test error:', error);
  } finally {
    // Clean up test documents
    console.log('\n🧹 Cleaning up test records...');
    if (testLocation) {
      await Booking.deleteMany({ parkingHubId: testLocation._id });
      await Slot.deleteMany({ facilityId: testLocation._id });
      await ParkingFloor.deleteMany({ parkingHubId: testLocation._id });
      await ParkingLocation.findByIdAndDelete(testLocation._id);
    }
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database. All Phase 2 tests completed.');
  }
}

runTests();
