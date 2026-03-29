import { db } from './firebase';
import { collection, doc, query, onSnapshot, where, getDocs, updateDoc, increment } from 'firebase/firestore';

export const subscribeToParkingFacilities = (callback) => {
  const q = query(collection(db, 'parking_facilities'));
  return onSnapshot(q, (snapshot) => {
    const facilities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(facilities);
  });
};

export const subscribeToSlots = (facilityId, floor, callback) => {
  const facilityRef = doc(db, 'parking_facilities', facilityId);
  const slotsRef = collection(facilityRef, 'slots');
  const q = query(slotsRef, where('floor', '==', floor));
  
  return onSnapshot(q, (snapshot) => {
    const slots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(slots);
  });
};

export const updateSlotStatus = async (facilityId, slotId, status) => {
  const facilityRef = doc(db, 'parking_facilities', facilityId);
  const slotRef = doc(collection(facilityRef, 'slots'), slotId);
  
  return updateDoc(slotRef, { 
    status,
    updatedAt: new Date(),
  });
};

export const incrementFacilityAvaibility = async (facilityId, amount) => {
  const facilityRef = doc(db, 'parking_facilities', facilityId);
  return updateDoc(facilityRef, {
    availableSlots: increment(amount)
  });
};
