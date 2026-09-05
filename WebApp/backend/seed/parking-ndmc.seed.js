/*
  ==============================================================================
  DATA QUALITY & RISK WARNING / NOTICE FOR NDMC PARKING SEED DATA:
  ------------------------------------------------------------------------------
  WARNING: Some capacity numbers in this batch were extracted from an OCR'd
  government PDF document with visible digit corruption in certain entries.

  For example:
  - Niti Marg Parking (NMP): Capacity is uncertain. The source PDF OCR displayed
    a garbled "740" for this row; 140 is an estimate scaled to plot area.
    Do NOT trust either number blindly — confirm against the original NDMC
    document before publishing or enabling online booking for this site.

  IMPORTANT INSTRUCTIONS:
  - Do NOT "clean up", round, or invent placeholder numbers on your own judgment.
  - Keep null fields as `null` where data is not publicly verified at per-site level.
  - Preserve inline `// TODO: verify ...` comments so maintainers know what must be
    confirmed with NDMC officials prior to production release.
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

const ndmcParkingSeedData = [
  {
    parkingName: 'Capitol Point Multilevel Car Parking (BKS Marg)',
    parkingCode: 'CPMLCP',
    address: 'Baba Kharak Singh Marg, next to Hanuman Mandir, Connaught Place, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    latitude: 28.629325, // street-level for Baba Kharak Singh Marg — TODO: verify exact building pin
    longitude: 77.211813,
    openingTime: '00:00',
    closingTime: '23:59',
    totalFloors: 8, // DLF's own listing says 8; an older 2012 case study says 11 — TODO: verify current figure
    totalSlots: 1408,
    availableSlots: null,
    hourlyPrice: 10,
    amenities: [
      'Operated by DLF under 30-year PPP with NDMC',
      'Fully automated — car lifts & pallets, computerized control',
      'LEED Gold certified building',
      'Rate: ₹10 (4hrs) + ₹5/hr (4-8hrs) + ₹5/hr (8-14hrs, i.e. up to 10PM)',
      '~650m from Rajiv Chowk Metro Gate 7'
    ],
    images: [],
    floors: [],
    status: 'Active'
  },
  {
    parkingName: 'Palika Bazar Underground Parking',
    parkingCode: 'PBUP',
    address: 'Palika Parking Road, between Inner & Outer Circle, Connaught Place, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    latitude: 28.6310,
    longitude: 77.2186,
    openingTime: '10:00',
    closingTime: '20:00', // market hours; parking itself may run longer — TODO: verify
    totalFloors: 3,
    totalSlots: 1425, // 975 cars + 450 two-wheelers per official NDMC PDF
    availableSlots: null,
    hourlyPrice: 10,
    amenities: [
      'Owned/operated by NDMC',
      '3 underground levels',
      'Separate car (975) and two-wheeler (450) capacity',
      'Rate: ₹10 (4hrs) + ₹5/hr up to 8hrs + ₹5/hr up to 14hrs'
    ],
    images: [],
    floors: ['L1', 'L2', 'L3'],
    status: 'Active'
  },
  {
    parkingName: 'DLF South Square Multilevel Car Parking',
    parkingCode: 'DSSMLCP',
    address: 'DLF South Square Mall, Lane G, Sarojini Nagar, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110023',
    latitude: 28.5763,
    longitude: 77.1971,
    openingTime: '10:00',
    closingTime: '22:00',
    totalFloors: null,
    totalSlots: 824, // official NDMC PDF says 824; a secondary source says 820 — TODO: confirm exact figure
    availableSlots: null,
    hourlyPrice: 20, // TODO: cross-check against official NDMC rate card, this came from a secondary source
    amenities: [
      'Operated by DLF',
      'Adjacent to Sarojini Nagar Metro Station (Pink Line)',
      'Monthly pass ~₹1,000 for regular commuters'
    ],
    images: [],
    floors: [],
    status: 'Active'
  },
  {
    parkingName: 'NDMC Gate 1 Multilevel Parking, Sarojini Nagar',
    parkingCode: 'NDMCG1SN',
    address: 'Near Gate 1, Sarojini Nagar Market, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110023',
    latitude: 28.5763, // approximate — same market area as DLF South Square, TODO: get exact pin
    longitude: 77.1971,
    openingTime: '06:00',
    closingTime: '23:00',
    totalFloors: null,
    totalSlots: 680, // secondary source only — not in the official NDMC PDF, TODO: verify directly with NDMC
    availableSlots: null,
    hourlyPrice: 10,
    amenities: ['Operated by NDMC', 'Adjacent to main market Gate 1'],
    images: [],
    floors: [],
    status: 'Active'
  },
  {
    parkingName: 'Yashwant Place Surface Parking',
    parkingCode: 'YPSP',
    address: 'Yashwant Place Commercial Complex, Chanakyapuri, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110021',
    latitude: null, // TODO: verify exact — only area-level location found
    longitude: null,
    openingTime: null, // TODO: not published per-site by NDMC
    closingTime: null,
    totalFloors: 1,
    totalSlots: 90, // per official NDMC PDF (4-wheeler capacity)
    availableSlots: null,
    hourlyPrice: 20,
    amenities: ['Surface parking, NDMC-managed', '50 two-wheeler capacity also available'],
    images: [],
    floors: [],
    status: 'Active'
  },
  {
    parkingName: 'Malcha Marg Market Parking',
    parkingCode: 'MMMP',
    address: 'Malcha Marg Market, Chanakyapuri, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110021',
    latitude: null, // TODO: verify
    longitude: null,
    openingTime: null,
    closingTime: null,
    totalFloors: 1,
    totalSlots: 140, // per official NDMC PDF
    availableSlots: null,
    hourlyPrice: 20,
    amenities: ['Surface parking, NDMC-managed', '50 two-wheeler capacity also available'],
    images: [],
    floors: [],
    status: 'Active'
  },
  {
    parkingName: 'Delhi Haat Car Parking',
    parkingCode: 'DHCP',
    address: 'Dilli Haat, INA, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110023',
    latitude: null, // TODO: verify
    longitude: null,
    openingTime: null,
    closingTime: null,
    totalFloors: 1,
    totalSlots: 60, // cars, per official NDMC PDF; separate scooter lot has 190 slots
    availableSlots: null,
    hourlyPrice: 20,
    amenities: ['Surface parking, NDMC-managed', 'Separate dedicated scooter lot: 190 slots'],
    images: [],
    floors: [],
    status: 'Active'
  },
  {
    parkingName: 'Niti Marg Parking',
    parkingCode: 'NMP',
    address: 'Niti Marg, Chanakyapuri, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110021',
    latitude: null, // TODO: verify
    longitude: null,
    openingTime: null,
    closingTime: null,
    totalFloors: 1,
    totalSlots: 140, // UNCERTAIN — source PDF OCR shows a garbled "740" for this row; 140 is an estimate scaled to plot area. TODO: confirm against original NDMC document, do not trust either number blindly
    availableSlots: null,
    hourlyPrice: 20,
    amenities: ['Surface parking, NDMC-managed'],
    images: [],
    floors: [],
    status: 'Active'
  }
];

export async function seedNdmcParkingData() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('❌ Error: Neither MONGO_URI nor MONGODB_URI found in environment variables.');
    process.exit(1);
  }

  try {
    console.log('📡 Connecting to MongoDB for NDMC parking seeding...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully.');

    const upsertResults = [];

    for (const item of ndmcParkingSeedData) {
      const doc = await Parking.findOneAndUpdate(
        { parkingCode: item.parkingCode },
        { $set: item },
        { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
      );
      upsertResults.push(doc);
    }

    console.log('\n🎉 NDMC Parking Seed Completed Successfully!');
    console.log('==========================================================================================');
    console.log('📊 NDMC PARKING FACILITY SEED SUMMARY');
    console.log('==========================================================================================\n');

    const summaryTable = upsertResults.map((p) => ({
      parkingName: p.parkingName,
      status: p.status,
      totalSlots: p.totalSlots !== null && p.totalSlots !== undefined ? p.totalSlots : 'UNVERIFIED',
      coordinates: (p.latitude !== null && p.latitude !== undefined && p.longitude !== null && p.longitude !== undefined)
        ? `${p.latitude}, ${p.longitude}`
        : 'MISSING',
    }));

    console.table(summaryTable);

  } catch (error) {
    console.error('❌ Error during NDMC parking seeding:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB.');
  }
}

// Auto-run if executed directly via `node seed/parking-ndmc.seed.js`
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('parking-ndmc.seed.js')) {
  seedNdmcParkingData();
}

export default ndmcParkingSeedData;
