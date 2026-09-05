/*
  ==============================================================================
  DATA QUALITY & RISK WARNING / NOTICE FOR NOIDA CITY PARKING SEED DATA:
  ------------------------------------------------------------------------------
  CRITICAL WARNING - RESTRICTED PUBLIC ACCESS:
  - Sector 38A (Botanical Garden) Multilevel Parking (NBGMLCP):
    Constructed with ₹580 crore of public funds and inaugurated in 2020 by UP CM.
    However, a Sept 2024 investigative report (Newslaundry) revealed ~90% of capacity
    has been repurposed as a private vehicle warehouse for car dealerships (MG, Tata,
    Kia, Skoda, Cars24), with only a small fraction genuinely open for public parking.

    Seeded with `status: 'Restricted'`.
    DO NOT weaken or remove this status warning, and DO NOT set to 'Active' without
    on-site verification. Applications/UIs must display appropriate warnings or
    restrictions for this facility.

  INLINE UNCERTAINTIES & MISSING DATA:
  - Sectors 1, 3, 5, 16A share a single rate card, but individual floor/slot capacities
    and exact building coordinates are unverified.
  - GIP Mall capacity (10,000) comes from marketing material, not independent audit.
  - Do NOT invent placeholder numbers for null fields. Keep inline TODO comments.
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

const noidaCityParkingSeedData = [
  {
    parkingName: 'Sector 18 Multilevel Car Parking',
    parkingCode: 'N18MLCP',
    address: 'Road No. 18, Pocket L, Sector 18, Noida, Uttar Pradesh',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    latitude: 28.5708, // metro-adjacent coordinate, TODO: verify exact building pin vs metro station pin
    longitude: 77.3261,
    openingTime: null, // TODO: not published — likely aligns with market hours, verify
    closingTime: null,
    totalFloors: 8, // 8 storeys + basement per investigative source
    totalSlots: 3000, // per CitySpidey 2019 report — TODO: verify current figure, may have changed since 2019
    availableSlots: null,
    hourlyPrice: 30, // first 2 hours; then +₹10/hr
    amenities: [
      'Operated by Noida Authority',
      'Bookable via "Noida Park Smart" app',
      'Rate: ₹30 (first 2 hrs) + ₹10/hr after',
      'Night charges escalate sharply after 1-2 AM (reported up to ₹500) — TODO: verify current night rate structure',
      'Historically underused vs. nearby free/cheap surface parking — public preference issue, not a capacity issue'
    ],
    images: [],
    floors: [],
    status: 'Active'
  },
  {
    parkingName: 'Sector 38A (Botanical Garden) Multilevel Car Parking',
    parkingCode: 'NBGMLCP',
    address: 'Sector 38A, near Botanical Garden Metro Station, Noida, Uttar Pradesh',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201303',
    latitude: 28.5642,
    longitude: 77.3348,
    openingTime: null,
    closingTime: null,
    totalFloors: 8, // 8-storey incl. basement, largest Noida Authority MLCP by construction cost (₹580 crore)
    totalSlots: null, // TODO: nominal design capacity not confirmed in sources found — DO NOT assume full capacity is available, see status note
    availableSlots: null,
    hourlyPrice: 20, // ₹20/hr + ₹10 additional hour for 4W; 2W: ₹10 first hr + ₹5/hr after
    amenities: [
      'Operated by Noida Authority; O&M handed to private operator (MG Infra Solutions) in 2022',
      'Rate: 4W ₹20/hr + ₹10 additional hr, capped ₹80/day; 2W ₹10 (1st hr) + ₹5/hr after'
    ],
    images: [],
    floors: [],
    status: 'Restricted' // CRITICAL: Sept 2024 investigative report (Newslaundry) found ~90% of this facility repurposed as a private vehicle warehouse for car dealers (MG, Tata, Kia, Skoda, Cars24), despite being built with ₹580cr public money and inaugurated as a public facility in 2020. Only a small fraction is genuinely open for public parking. DO NOT change to 'Active' without a fresh, current on-site verification — the discrepancy between official status and actual public usability is the whole point of this record.
  },
  {
    parkingName: 'Sector 1 Underground Multilevel Car Parking',
    parkingCode: 'N01MLCP',
    address: 'Sector 1, Noida, Uttar Pradesh',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    latitude: null, // TODO: only a general sector-level location found, verify exact building coordinate
    longitude: null,
    openingTime: null,
    closingTime: null,
    totalFloors: null, // known to be underground, exact floor count not found
    totalSlots: null, // TODO: no individually published capacity found
    availableSlots: null,
    hourlyPrice: 20, // shared rate card with Sectors 3, 5, 16A
    amenities: [
      'Operated by Noida Authority',
      'Bookable via "Noida Park Smart" app',
      'Rate: 4W ₹20 (first 2 hrs) + ₹10/hr, capped ₹80/day; 2W/auto ₹10 (first 2 hrs) + ₹5/hr, capped ₹40/day'
    ],
    images: [],
    floors: [],
    status: 'Active'
  },
  {
    parkingName: 'Sector 3 Multilevel Car Parking',
    parkingCode: 'N03MLCP',
    address: 'Sector 3, Noida, Uttar Pradesh',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    latitude: null, // TODO: verify — no individually published location found
    longitude: null,
    openingTime: null,
    closingTime: null,
    totalFloors: null,
    totalSlots: null, // TODO: not found
    availableSlots: null,
    hourlyPrice: 20,
    amenities: [
      'Operated by Noida Authority',
      'Bookable via "Noida Park Smart" app',
      'Rate: 4W ₹20 (first 2 hrs) + ₹10/hr, capped ₹80/day; 2W/auto ₹10 (first 2 hrs) + ₹5/hr, capped ₹40/day'
    ],
    images: [],
    floors: [],
    status: 'Active'
  },
  {
    parkingName: 'Sector 5 Multilevel Car Parking',
    parkingCode: 'N05MLCP',
    address: 'Sector 5, Noida, Uttar Pradesh',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    latitude: null, // TODO: verify
    longitude: null,
    openingTime: null,
    closingTime: null,
    totalFloors: null,
    totalSlots: null, // TODO: not found
    availableSlots: null,
    hourlyPrice: 20,
    amenities: [
      'Operated by Noida Authority',
      'Bookable via "Noida Park Smart" app',
      'Rate: 4W ₹20 (first 2 hrs) + ₹10/hr, capped ₹80/day; 2W/auto ₹10 (first 2 hrs) + ₹5/hr, capped ₹40/day'
    ],
    images: [],
    floors: [],
    status: 'Active'
  },
  {
    parkingName: 'Sector 16A Multilevel Car Parking',
    parkingCode: 'N16AMLCP',
    address: 'Sector 16A, Noida, Uttar Pradesh',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    latitude: null, // TODO: verify — likely near Noida Sector 16 metro, not confirmed
    longitude: null,
    openingTime: null,
    closingTime: null,
    totalFloors: null,
    totalSlots: null, // TODO: not found
    availableSlots: null,
    hourlyPrice: 20,
    amenities: [
      'Operated by Noida Authority',
      'Bookable via "Noida Park Smart" app',
      'Rate: 4W ₹20 (first 2 hrs) + ₹10/hr, capped ₹80/day; 2W/auto ₹10 (first 2 hrs) + ₹5/hr, capped ₹40/day'
    ],
    images: [],
    floors: [],
    status: 'Active'
  },
  {
    parkingName: 'DLF Mall of India Valet Parking',
    parkingCode: 'DMOIVP',
    address: 'Sector 18, Noida, Uttar Pradesh',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    latitude: 28.5708, // approximate — mall is adjacent to Sector 18 metro/market cluster, TODO: verify exact pin
    longitude: 77.3261,
    openingTime: '10:00', // TODO: verify against current mall hours
    closingTime: '22:00',
    totalFloors: 7, // mall building floors — NOT parking-specific floor count
    totalSlots: null, // TODO: valet-only, no self-park capacity published
    availableSlots: null,
    hourlyPrice: null, // TODO: valet pricing not published, typically charged differently than self-park
    amenities: [
      'Private mall parking, valet only',
      '333 stores, PVR Cinemas (7 screens)',
      'Adjacent to Noida Sector 18 metro station (Blue Line)'
    ],
    images: [],
    floors: [],
    status: 'Active'
  },
  {
    parkingName: 'The Great India Place (GIP) Mall Parking',
    parkingCode: 'GIPMP',
    address: 'Sector 38A, Noida, Uttar Pradesh',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201303',
    latitude: 28.5684,
    longitude: 77.3258,
    openingTime: '10:00', // TODO: verify against current mall hours
    closingTime: '22:00',
    totalFloors: 4, // mall building floors — NOT parking-specific floor count
    totalSlots: 10000, // cited on Wikipedia as "10,000+ vehicles" — TODO: treat as a rounded marketing figure, not an audited number; verify with mall management before relying on it
    availableSlots: null,
    hourlyPrice: null, // TODO: not published
    amenities: [
      'Private mall parking',
      'Adjacent to Worlds of Wonder amusement park',
      'Distinct from the Noida Authority MLCP at the same Sector 38A / Botanical Garden location (see NBGMLCP) — do not merge these two records, they are different facilities operated by different entities'
    ],
    images: [],
    floors: [],
    status: 'Active'
  }
];

export async function seedNoidaCityParkingData() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('❌ Error: Neither MONGO_URI nor MONGODB_URI found in environment variables.');
    process.exit(1);
  }

  try {
    console.log('📡 Connecting to MongoDB for Noida City parking seeding...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully.');

    const upsertResults = [];

    for (const item of noidaCityParkingSeedData) {
      const doc = await Parking.findOneAndUpdate(
        { parkingCode: item.parkingCode },
        { $set: item },
        { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
      );
      upsertResults.push(doc);
    }

    console.log('\n🎉 Noida City Parking Seed Completed Successfully!');
    console.log('==========================================================================================');
    console.log('📊 NOIDA CITY PARKING FACILITY SEED SUMMARY');
    console.log('==========================================================================================\n');

    const summaryTable = upsertResults.map((p) => {
      const totalSlotsDisplay = p.totalSlots !== null && p.totalSlots !== undefined ? p.totalSlots : 'UNVERIFIED';
      const dataQualityFlag = (p.parkingCode === 'NBGMLCP' || p.status === 'Restricted') ? 'RESTRICTED - SEE NOTES' : 'OK';

      return {
        parkingName: p.parkingName,
        status: p.status,
        totalSlots: totalSlotsDisplay,
        dataQualityFlag: dataQualityFlag,
      };
    });

    console.table(summaryTable);

  } catch (error) {
    console.error('❌ Error during Noida City parking seeding:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB.');
  }
}

// Auto-run if executed directly via `node seed/parking-noida-city.seed.js`
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('parking-noida-city.seed.js')) {
  seedNoidaCityParkingData();
}

export default noidaCityParkingSeedData;
