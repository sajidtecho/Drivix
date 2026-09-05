/*
  ==============================================================================
  DATA QUALITY & RISK WARNING / NOTICE FOR SOUTH ZONE PARKING SEED DATA:
  ------------------------------------------------------------------------------
  WARNING: This seed batch contains notable data-quality risks and operational status risks:

  1. Nehru Place Multi-Level Car Parking (NPMLCP):
     - DISPUTED CAPACITY: Inauguration statement (Feb 2026) claims 660 cars + 350+ 2W,
       whereas a Sept 2025 pre-completion report claims the reverse (352 cars + 660 2W).
       Seeded with 660, but flag is preserved. Do NOT treat 660 as settled fact without DDA audit.

  2. M Block Market Automated Parking, GK-1 (MBMGK1):
     - OPERATIONAL STATUS RISK: Inaugurated Sept 2025 but stalled on tree-felling/ramp permissions.
       Seeded as `status: 'Pending'`. Do NOT change to `'Active'` without verifying actual opening with MCD.

  IMPORTANT INSTRUCTIONS:
  - Do NOT "clean up", round, or invent placeholder numbers for null fields.
  - Keep null fields as `null` where data is not publicly verified at per-site level.
  - Preserve inline `// TODO: verify ...` comments so maintainers know what must be
    confirmed before going live.
  ==============================================================================
*/

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Parking from '../models/Parking.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const southZoneParkingSeedData = [
  {
    parkingName: 'Select Citywalk Mall Parking',
    parkingCode: 'SCWMP',
    address: 'Select Citywalk Mall, Saket District Centre, Sector 6, Pushp Vihar, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110017',
    latitude: 28.5241, // two independent sources agree; a third gives 28.5192 (~600m discrepancy) — TODO: confirm exact pin
    longitude: 77.2181,
    openingTime: '10:00',
    closingTime: '22:00',
    totalFloors: null,
    totalSlots: 1200, // cited capacity, private mall — not independently audited
    availableSlots: null,
    hourlyPrice: null, // TODO: no published rate found — mall rates change frequently, verify with mall management
    amenities: [
      'Private mall parking',
      'Nearest metro: Malviya Nagar (Yellow Line)',
      'Gets very crowded on weekends/holidays per visitor reports'
    ],
    images: [],
    floors: [],
    status: 'Active'
  },
  {
    parkingName: 'DLF Promenade Multilevel Parking, Vasant Kunj',
    parkingCode: 'DPMVK',
    address: '3, Nelson Mandela Marg, Vasant Kunj II, Vasant Kunj, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110070',
    latitude: 28.5273,
    longitude: 77.1516,
    openingTime: '11:00',
    closingTime: '22:00',
    totalFloors: null,
    totalSlots: 1017, // 4-wheeler capacity; separately: 500 two-wheeler slots
    availableSlots: null,
    hourlyPrice: null, // TODO: not published
    amenities: [
      'Private mall multilevel parking',
      '500 additional two-wheeler slots',
      'Adjacent to Ambience Mall & DLF Emporio (shared precinct, not shared parking data)',
      'Nearest metro: Vasant Vihar (Magenta Line), ~3.7km'
    ],
    images: [],
    floors: [],
    status: 'Active'
  },
  {
    parkingName: 'Nehru Place Multi-Level Car Parking (DDA)',
    parkingCode: 'NPMLCP',
    address: 'Nehru Place District Centre, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110019',
    latitude: 28.5484, // area-level (Nehru Place metro coords) — TODO: verify exact building pin
    longitude: 77.2508,
    openingTime: null, // TODO: not published
    closingTime: null,
    totalFloors: 6, // basement + 5 upper floors, confirmed at inauguration
    totalSlots: 660, // DISPUTED: LG/CM inauguration statement (Feb 2026) says 660 cars + "over 350" two-wheelers; a Sept 2025 pre-completion report says the REVERSE — 352 cars + 660 two-wheelers. Using the inauguration-day figure as more authoritative, but this is NOT settled. TODO: verify actual car/2W split with DDA before publishing or trusting this number
    availableSlots: null,
    hourlyPrice: null, // TODO: not published as of inauguration
    amenities: [
      'Built by DDA under Nehru Place District Centre redevelopment',
      'Includes EV charging points and disabled-accessible spaces',
      'Inaugurated Feb 2026 by Delhi LG & CM',
      'CAPACITY FIGURE DISPUTED — see comment above, cross-check with DDA before go-live'
    ],
    images: [],
    floors: [],
    status: 'Active'
  },
  {
    parkingName: 'Eros Multilevel Car Parking, Nehru Place',
    parkingCode: 'EMLCPNP',
    address: 'Eros Corporate Tower, Nehru Place, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110019',
    latitude: null, // TODO: verify — only general Nehru Place area coords found
    longitude: null,
    openingTime: '00:00', // listed as open 24 hours
    closingTime: '23:59',
    totalFloors: null,
    totalSlots: null, // TODO: capacity not published anywhere found
    availableSlots: null,
    hourlyPrice: null,
    amenities: ['Private commercial building parking', 'EV charging station', 'Open 24/7'],
    images: [],
    floors: [],
    status: 'Active'
  },
  {
    parkingName: 'M Block Market Automated Multi-Level Parking, GK-1',
    parkingCode: 'MBMGK1',
    address: 'M Block Market, Greater Kailash-1, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110048',
    latitude: null, // TODO: not found — verify
    longitude: null,
    openingTime: null,
    closingTime: null,
    totalFloors: 9, // basement + ground + 7 storeys, 57 cars/floor per source
    totalSlots: 399, // confirmed capacity, cost ₹63.74 crore, SDMC/MCD project
    availableSlots: null,
    hourlyPrice: null, // TODO: not set as of last report — facility wasn't operational yet
    amenities: [
      'Fully automated (robotic lift/panel system), <2.5 min retrieval claimed',
      'EV charging points on ground floor',
      'Operated by private contractor for 10 years post-handover',
      'STATUS RISK: inaugurated Sept 27 2025 but still non-operational as of the last report found (Nov 18 2025), stalled on tree-felling/ramp permissions, expected to open "December" — no confirmation found that it actually opened. Do NOT flip to Active without verifying current status with MCD.'
    ],
    images: [],
    floors: [],
    status: 'Pending'
  }
];

export async function seedSouthZoneParkingData() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('❌ Error: Neither MONGO_URI nor MONGODB_URI found in environment variables.');
    process.exit(1);
  }

  try {
    console.log('📡 Connecting to MongoDB for South Zone parking seeding...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully.');

    const upsertResults = [];

    for (const item of southZoneParkingSeedData) {
      const doc = await Parking.findOneAndUpdate(
        { parkingCode: item.parkingCode },
        { $set: item },
        { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
      );
      upsertResults.push(doc);
    }

    console.log('\n🎉 South Zone Parking Seed Completed Successfully!');
    console.log('==========================================================================================');
    console.log('📊 SOUTH ZONE PARKING FACILITY SEED SUMMARY');
    console.log('==========================================================================================\n');

    const summaryTable = upsertResults.map((p) => {
      let totalSlotsDisplay = 'UNVERIFIED';
      if (p.parkingCode === 'NPMLCP') {
        totalSlotsDisplay = `${p.totalSlots} (DISPUTED)`;
      } else if (p.totalSlots !== null && p.totalSlots !== undefined) {
        totalSlotsDisplay = p.totalSlots;
      }

      const coordinatesDisplay = (p.latitude !== null && p.latitude !== undefined && p.longitude !== null && p.longitude !== undefined)
        ? `${p.latitude}, ${p.longitude}`
        : 'MISSING';

      return {
        parkingName: p.parkingName,
        status: p.status,
        totalSlots: totalSlotsDisplay,
        coordinates: coordinatesDisplay,
      };
    });

    console.table(summaryTable);

  } catch (error) {
    console.error('❌ Error during South Zone parking seeding:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB.');
  }
}

// Auto-run if executed directly via `node seed/parking-south-zone.seed.js`
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('parking-south-zone.seed.js')) {
  seedSouthZoneParkingData();
}

export default southZoneParkingSeedData;
