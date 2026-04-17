import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Car, Layers, Loader2 } from 'lucide-react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import loadingCar from '../assets/Loading_car.webm';

const SLOT_STATUS = {
  available: { label: 'Available', color: '#00cc6a', bg: 'rgba(0,204,106,0.12)', border: 'rgba(0,204,106,0.35)' },
  booked:    { label: 'Booked',    color: '#ff4b4b', bg: 'rgba(255,75,75,0.12)',  border: 'rgba(255,75,75,0.35)' },
  reserved:  { label: 'Reserved',  color: '#FFAD00', bg: 'rgba(255,173,0,0.12)', border: 'rgba(255,173,0,0.35)' },
  selected:  { label: 'Selected',  color: 'var(--accent-primary)', bg: 'rgba(255,206,0,0.15)', border: 'var(--accent-primary)' },
};

const SlotLayout = () => {
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  
  const [loc, setLoc] = useState(locationState?.location || null);
  const [selectedFloor, setSelectedFloor] = useState(loc?.floors?.[0] || 'L1');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch location if not passed in state
  useEffect(() => {
    if (!loc) {
      const docRef = doc(db, 'parking_facilities', 'sharda-university-mlp');
      const unsub = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const d = { id: snapshot.id, ...snapshot.data() };
          setLoc(d);
          if (!selectedFloor) setSelectedFloor(d.floors?.[0] || 'L1');
        }
      });
      return unsub;
    }
  }, [loc, selectedFloor]);

  // Fetch slots for selected floor
  useEffect(() => {
    if (!loc) return;

    const slotsRef = collection(doc(db, 'parking_facilities', loc.id), 'slots');
    const q = query(slotsRef, where('floor', '==', selectedFloor));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => {
        if (a.row !== b.row) return a.row.localeCompare(b.row);
        return a.number - b.number;
      });
      setSlots(data);
      setLoading(false);
    });

    return unsub;
  }, [loc, selectedFloor]);

  // Fetch active bookings for this location to verify current occupancy
  useEffect(() => {
    if (!loc) return;

    const bookingsRef = collection(db, 'bookings');
    const q = query(
      bookingsRef, 
      where('locationId', '==', loc.id), 
      where('status', '==', 'booked')
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const bks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveBookings(bks);
    });

    return unsub;
  }, [loc]);

  const floors = useMemo(() => loc?.floors || ['L1'], [loc]);

  const slotRows = useMemo(() => {
    return slots.reduce((acc, slot) => {
      if (!acc[slot.row]) acc[slot.row] = [];
      acc[slot.row].push(slot);
      return acc;
    }, {});
  }, [slots]);

  const handleSlotClick = useCallback((slotId, status) => {
    if (status === 'booked' || status === 'reserved') return;
    setSelectedSlot(prev => prev === slotId ? null : slotId);
  }, []);

  return (
    <div style={{ paddingTop: '90px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 5% 80px' }}>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>
          Select <span className="text-gradient">Slot</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '28px' }}>
          {loc?.name || 'Loading facility...'} · {loc?.address}
        </p>

        {/* Legend */}
        <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          {Object.entries(SLOT_STATUS).filter(([k]) => k !== 'selected').map(([key, val]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: 'var(--radius-button)', background: val.bg, border: `2px solid ${val.border}` }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{val.label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: 'var(--radius-button)', background: SLOT_STATUS.selected.bg, border: `2px solid ${SLOT_STATUS.selected.border}` }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Selection</span>
          </div>
        </div>

        {/* Floor Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
          {floors.map((floor) => {
            const isActive = floor === selectedFloor;
            return (
              <motion.button
                key={floor}
                whileTap={{ scale: 0.96 }}
                onClick={() => { setLoading(true); setSelectedFloor(floor); setSelectedSlot(null); }}
                style={{
                  padding: '12px 20px', borderRadius: 'var(--radius-button)', cursor: 'pointer',
                  fontFamily: 'inherit', fontWeight: 700, fontSize: '0.88rem',
                  display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
                  background: isActive ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--glass-bg)',
                  color: isActive ? '#000' : 'var(--text-primary)',
                  border: isActive ? 'none' : '1px solid var(--glass-border)',
                  boxShadow: isActive ? '0 4px 15px var(--accent-glow)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <Layers size={15} />
                {floor}
              </motion.button>
            );
          })}
        </div>

        {/* Slot Grid Overlay */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedFloor}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--radius-card)', marginBottom: '24px', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
              {loading ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                   <video 
                    src={loadingCar} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                   <p style={{ color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.5px' }}>SYNCING SLOTS...</p>
                </div>
              ) : (
                <>
                  <div style={{
                    textAlign: 'center', fontSize: '0.75rem', fontWeight: 700,
                    letterSpacing: '4px', color: 'var(--text-secondary)', marginBottom: '20px',
                    padding: '10px', borderRadius: 'var(--radius-button)', background: 'var(--bg-secondary)',
                    border: '1px dashed var(--glass-border)',
                  }}>
                    🚗 ENTRY / EXIT
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.entries(slotRows).map(([rowLabel, rowSlots]) => (
                      <div key={rowLabel} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                         <div style={{
                          width: '28px', height: '28px', borderRadius: 'var(--radius-button)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--bg-secondary)', fontSize: '0.8rem',
                          fontWeight: 800, color: 'var(--text-secondary)', flexShrink: 0,
                        }}>
                          {rowLabel}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flex: 1, flexWrap: 'wrap' }}>
                          {rowSlots.map((slot) => {
                             // Dynamic Real-time Availability Logic:
                             // A slot is "booked" ONLY if there is an active booking record for it
                             const hasActiveBooking = activeBookings.some(b => b.slotId === slot.id);
                             
                             let status = slot.id === selectedSlot ? 'selected' : (hasActiveBooking ? 'booked' : 'available');
                             
                             // Optional: If you want to keep 'reserved' support from the DB
                             if (status === 'available' && slot.status === 'reserved') {
                               status = 'reserved';
                             }

                             const st = SLOT_STATUS[status];
                             const isClickable = status === 'available' || status === 'selected';

                             return (
                               <motion.button
                                 key={slot.id}
                                 whileHover={isClickable ? { scale: 1.12, y: -2 } : {}}
                                 whileTap={isClickable ? { scale: 0.95 } : {}}
                                 onClick={() => handleSlotClick(slot.id, status)}
                                 style={{
                                   width: 'clamp(32px, 10vw, 52px)',
                                   height: 'clamp(32px, 8vw, 44px)',
                                   borderRadius: 'var(--radius-button)',
                                   background: st.bg,
                                   border: `2px solid ${st.border}`,
                                   cursor: isClickable ? 'pointer' : 'not-allowed',
                                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                                   fontSize: '0.65rem', fontWeight: 800,
                                   color: st.color,
                                   position: 'relative',
                                   boxShadow: status === 'selected' ? `0 0 12px ${st.color}44` : 'none',
                                 }}
                               >
                                 {status === 'selected' ? <Car size={14} color={st.color} /> : slot.id}
                               </motion.button>
                             );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Selected Slot Information */}
        <AnimatePresence>
          {selectedSlot && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20, transition: { ease: [0.7, 0, 1, 1], duration: 0.3 } }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="glass-panel"
              style={{
                padding: '24px 28px', borderRadius: 'var(--radius-card)', marginBottom: '24px',
                border: '1.5px solid rgba(59,130,246,0.4)',
                background: 'rgba(59,130,246,0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '4px', letterSpacing: '1px' }}>
                    SELECTED SLOT
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-primary)' }}>{selectedSlot}</span>
                    <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-pill)', background: 'var(--accent-glow)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {selectedFloor}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Rate per hour</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-primary)' }}>
                    ₹{loc?.pricePerHr}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Proceed Button */}
        <motion.button
          whileHover={selectedSlot ? { y: -2 } : {}}
          whileTap={selectedSlot ? { scale: 0.98 } : {}}
          onClick={() => {
            if (!selectedSlot) return;
            navigate('/slot-booking', {
              state: {
                location: loc,
                slot: selectedSlot,
                floor: selectedFloor,
              }
            });
          }}
          disabled={!selectedSlot}
          className="btn btn-primary"
          style={{
            width: '100%', padding: '18px', fontSize: '1.05rem', fontWeight: 800,
            opacity: selectedSlot ? 1 : 0.45, cursor: selectedSlot ? 'pointer' : 'not-allowed',
          }}
        >
          {selectedSlot ? `Proceed with Slot ${selectedSlot} →` : 'Select a slot to continue'}
        </motion.button>
      </div>
    </div>
  );
};

export default SlotLayout;
