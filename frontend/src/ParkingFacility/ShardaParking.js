import { db } from '../firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';

const seedParkingData = async () => {
  const facilityId = 'sharda-university-mlp';

  // 1. Create the facility
  const facilityRef = doc(db, 'parking_facilities', facilityId);
  await setDoc(facilityRef, {
    id: facilityId,
    name: 'Sharda University MLP',
    address: 'Knowledge Park III, Greater Noida',
    distance: '0.2 km',
    totalSlots: 60,
    availableSlots: 60, // Reset to full capacity
    pricePerHr: 20,
    rating: 4.9,
    floors: ['L1', 'L2', 'L3'],
    features: ['Student Discount', 'CCTV Security', 'EV Stations'],
    color: '#FFCE00',
    badge: 'Campus Choice',
  });

  // 2. Create slots for L1, L2, L3
  const batch = writeBatch(db);
  const floors = [
    { name: 'L1', rows: ['A', 'B', 'C'], cols: 10 }, // 30 slots
    { name: 'L2', rows: ['D', 'E'], cols: 10 },      // 20 slots
    { name: 'L3', rows: ['F'], cols: 10 },           // 10 slots
  ]; // Total 60 slots

  for (const floor of floors) {
    for (const row of floor.rows) {
      for (let i = 1; i <= floor.cols; i++) {
        const slotId = `${row}${i}`;
        const slotRef = doc(collection(facilityRef, 'slots'), slotId);

        batch.set(slotRef, {
          id: slotId,
          floor: floor.name,
          row,
          number: i,
          status: 'available', // ALL slots should be visible/available
          updatedAt: new Date(),
        });
      }
    }
  }

  await batch.commit();
  console.log('✅ Sharda University MLP data seeded successfully');
};

export default seedParkingData;
