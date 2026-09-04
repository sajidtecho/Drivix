import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Parking from '../models/Parking.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend .env
dotenv.config({ path: path.join(__dirname, '../.env') });

/*
  ==============================================================================
  README NOTE ON PRICING STRUCTURE:
  ------------------------------------------------------------------------------
  Note: The current schema uses a simplified flat `hourlyPrice` field for convenience.
  However, the actual NMRC (Noida Metro Rail Corporation) rate structure is tiered
  based on duration and vehicle type (Car vs. Bike / 2W vs. 4W).

  For example:
  - Car (4W): ₹25 for first 6 hrs, ₹50 for 6-12 hrs, ₹56 for full day, ₹1100 monthly pass.
  - Bike (2W): ₹15 for first 6 hrs, ₹25 for 6-12 hrs, ₹30 for full day, ₹500 monthly pass.
  - Overnight penalty: ₹200 (2W) / ₹300 (4W).

  FUTURE SCHEMA SUGGESTION (Comment only - not implemented yet):
  Consider adding a `pricingTiers` sub-document array and a `vehicleType` enum field:
  
  pricingTiers: [
    {
      vehicleType: { type: String, enum: ['2W', '4W'] },
      slab1: { durationHours: 6, rate: Number },
      slab2: { durationHours: 12, rate: Number },
      fullDayRate: Number,
      monthlyPassRate: Number,
      overnightPenalty: Number
    }
  ]
  ==============================================================================
*/

const parkingSeedData = [
  {
    parkingName: 'Alpha 1 Metro Station',
    parkingCode: 'A1MS',
    address: 'Block E, Alpha I, Greater Noida',
    city: 'Greater Noida',
    state: 'Uttar Pradesh',
    pincode: '201310',
    latitude: 28.470948,
    longitude: 77.512593,
    openingTime: '05:00',
    closingTime: '23:00',
    totalFloors: null, // TODO: verify with NMRC before going live
    totalSlots: null, // TODO: verify with NMRC before going live
    availableSlots: null, // TODO: verify with NMRC before going live
    hourlyPrice: 25,
    amenities: [
      'Operated by NMRC',
      'Car: ₹25/6hrs, ₹50/6-12hrs, ₹56/full day, ₹1100/month',
      'Bike: ₹15/6hrs, ₹25/6-12hrs, ₹30/full day, ₹500/month',
      'Overnight penalty: ₹200 (2W) / ₹300 (4W)'
    ],
    images: [],
    floors: [],
    status: 'Active'
  },
  {
    parkingName: 'Delta 1 Metro Station',
    parkingCode: 'D1MS',
    address: 'Block A, Delta I, Brahmpur Rajraula Urf Nawada, Greater Noida',
    city: 'Greater Noida',
    state: 'Uttar Pradesh',
    pincode: '201310',
    latitude: 28.478448,
    longitude: 77.525704,
    openingTime: '05:00',
    closingTime: '23:00',
    totalFloors: null, // TODO: verify with NMRC before going live
    totalSlots: null, // TODO: verify with NMRC before going live
    availableSlots: null, // TODO: verify with NMRC before going live
    hourlyPrice: 25,
    amenities: [
      'Operated by NMRC',
      'Car: ₹25/6hrs, ₹50/6-12hrs, ₹56/full day, ₹1100/month',
      'Bike: ₹15/6hrs, ₹25/6-12hrs, ₹30/full day, ₹500/month',
      'Overnight penalty: ₹200 (2W) / ₹300 (4W)'
    ],
    images: [],
    floors: [],
    status: 'Active'
  },
  {
    parkingName: 'Pari Chowk Metro Station',
    parkingCode: 'PCMS',
    address: 'Tugalpur Village, Knowledge Park I, Greater Noida',
    city: 'Greater Noida',
    state: 'Uttar Pradesh',
    pincode: '201310',
    latitude: 28.463276,
    longitude: 77.508196,
    openingTime: '05:00',
    closingTime: '23:00',
    totalFloors: null, // TODO: verify with NMRC before going live
    totalSlots: 300,
    availableSlots: null, // TODO: verify with NMRC before going live
    hourlyPrice: 25,
    amenities: [
      'Operated by NMRC',
      'Added May 2023',
      'Car: ₹25/6hrs, ₹50/6-12hrs, ₹56/full day, ₹1100/month',
      'Bike: ₹15/6hrs, ₹25/6-12hrs, ₹30/full day, ₹500/month'
    ],
    images: [],
    floors: [],
    status: 'Active'
  },
  {
    parkingName: 'Sector 137 Metro Station',
    parkingCode: 'S137MS',
    address: 'Sector 137, Greater Noida (near Noida Expressway)',
    city: 'Greater Noida',
    state: 'Uttar Pradesh',
    pincode: '201305',
    latitude: null, // TODO: verify with NMRC before going live
    longitude: null, // TODO: verify with NMRC before going live
    openingTime: '05:00',
    closingTime: '23:00',
    totalFloors: null, // TODO: verify with NMRC before going live
    totalSlots: null, // TODO: verify with NMRC before going live
    availableSlots: null, // TODO: verify with NMRC before going live
    hourlyPrice: 25,
    amenities: [
      'Operated by NMRC',
      'One of the original three Aqua Line parking lots (predates 2023 expansion)'
    ],
    images: [],
    floors: [],
    status: 'Active'
  },
  {
    parkingName: 'Knowledge Park II Metro Station',
    parkingCode: 'KP2MS',
    address: 'Knowledge Park II, Greater Noida',
    city: 'Greater Noida',
    state: 'Uttar Pradesh',
    pincode: '201310',
    latitude: 28.456956,
    longitude: 77.500189,
    openingTime: null, // TODO: verify with NMRC before going live
    closingTime: null, // TODO: verify with NMRC before going live
    totalFloors: null, // TODO: verify with NMRC before going live
    totalSlots: 0,
    availableSlots: 0,
    hourlyPrice: 0,
    amenities: [],
    images: [],
    floors: [],
    status: 'Inactive'
  },
  {
    parkingName: 'GNIDA Circular Parking (Knowledge Park II-III)',
    parkingCode: 'GCPKP23',
    address: 'Between Knowledge Park II and III, near India Exposition Centre & Mart, Greater Noida',
    city: 'Greater Noida',
    state: 'Uttar Pradesh',
    pincode: '201306',
    latitude: null, // TODO: verify with NMRC before going live
    longitude: null, // TODO: verify with NMRC before going live
    openingTime: null, // TODO: verify with NMRC before going live
    closingTime: null, // TODO: verify with NMRC before going live
    totalFloors: null, // TODO: verify with NMRC before going live
    totalSlots: null, // TODO: verify with NMRC before going live
    availableSlots: null, // TODO: verify with NMRC before going live
    hourlyPrice: null, // TODO: verify with NMRC before going live
    amenities: [
      'GNIDA-owned 37-acre circular plot under redevelopment',
      'Planned structured parking (~75,000 sqm of 150,000 sqm plot)',
      'Planned amenities: toilets, kiosks, green space, event area'
    ],
    images: [],
    floors: [],
    status: 'Pending'
  }
];

export async function seedParkingData() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('❌ Error: Neither MONGO_URI nor MONGODB_URI found in environment variables.');
    process.exit(1);
  }

  try {
    console.log('📡 Connecting to MongoDB for parking seeding...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully.');

    const upsertResults = [];

    for (const item of parkingSeedData) {
      const doc = await Parking.findOneAndUpdate(
        { parkingCode: item.parkingCode },
        { $set: item },
        { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
      );
      upsertResults.push(doc);
    }

    console.log('\n🎉 Parking Seed Completed Successfully!');
    console.log('==========================================================================================');
    console.log('📊 NMRC / GNIDA PARKING FACILITY SEED & UNVERIFIED CHECKLIST SUMMARY TABLE');
    console.log('==========================================================================================\n');

    const summaryTable = upsertResults.map((p) => {
      const unverified = [];
      if (p.latitude === null || p.longitude === null) unverified.push('Coordinates (lat/lng)');
      if (p.openingTime === null || p.closingTime === null) unverified.push('Timings (open/close)');
      if (p.totalSlots === null) unverified.push('Total Slots');
      if (p.availableSlots === null) unverified.push('Available Slots');
      if (p.totalFloors === null) unverified.push('Floors');
      if (p.hourlyPrice === null) unverified.push('Hourly Price');

      return {
        'Parking Code': p.parkingCode,
        'Parking Name': p.parkingName,
        'City': p.city,
        'Status': p.status,
        'Unverified Fields (Null)': unverified.length > 0 ? unverified.join(', ') : 'None (Fully Verified)',
      };
    });

    console.table(summaryTable);
    console.log('\n📋 CHECKLIST FOR NMRC/GNIDA CONFIRMATION BEFORE PRODUCTION LIVE:');
    console.log('------------------------------------------------------------------------------------------');
    summaryTable.forEach((row) => {
      if (row['Unverified Fields (Null)'] !== 'None (Fully Verified)') {
        console.log(`• [${row['Parking Code']}] ${row['Parking Name']}: Need to verify -> ${row['Unverified Fields (Null)']}`);
      }
    });
    console.log('------------------------------------------------------------------------------------------\n');

  } catch (error) {
    console.error('❌ Error during parking seeding:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

// Auto-run if executed directly via `node seed/parking.seed.js`
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('parking.seed.js')) {
  seedParkingData();
}

export default parkingSeedData;
