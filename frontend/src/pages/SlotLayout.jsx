import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Car, Layers, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import loadingCar from '../assets/Loading_car.webm';
import { API_BASE_URL } from '../config';
import { io } from 'socket.io-client';
import { useToast } from '../context/ToastContext';

const SLOT_STATUS = {
  available:             { label: 'Available',            color: '#00cc6a', bg: 'rgba(0,204,106,0.12)',  border: 'rgba(0,204,106,0.35)' },
  temporarily_reserved:  { label: 'Temporarily Reserved', color: '#FFCE00', bg: 'rgba(255,206,0,0.12)',  border: 'rgba(255,206,0,0.35)' },
  booked:                { label: 'Booking Confirmed',    color: '#0090FF', bg: 'rgba(0,144,255,0.12)',  border: 'rgba(0,144,255,0.35)' },
  occupied:              { label: 'Occupied',             color: '#ff4b4b', bg: 'rgba(255,75,75,0.12)',   border: 'rgba(255,75,75,0.35)' },
  maintenance:           { label: 'Maintenance',          color: '#8a8a8a', bg: 'rgba(138,138,138,0.12)', border: 'rgba(138,138,138,0.35)' },
  selected:              { label: 'Selected by You',      color: 'var(--accent-primary)', bg: 'rgba(255,206,0,0.15)', border: 'var(--accent-primary)' },
};

const SlotLayout = () => {
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const { showToast } = useToast();
  
  const [loc, setLoc] = useState(locationState?.location ? {
    id: locationState.location._id || locationState.location.id,
    name: locationState.location.parkingName,
    address: locationState.location.address,
    floors: locationState.location.floors || ['L1']
  } : null);

  const [selectedFloor, setSelectedFloor] = useState('L1');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // Real-time reservation countdown:
  const [reservationExpiry, setReservationExpiry] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Fetch locations list to set default location if not passed in state
  useEffect(() => {
    if (!loc) {
      const fetchDefaultLoc = async () => {
        const token = localStorage.getItem('drivix_auth_token');
        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/parking`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.length > 0) {
              const target = data.find(l => l.parkingName === 'Sharda University') || data[0];
              const mapped = {
                id: target._id,
                name: target.parkingName,
                address: target.address,
                pricePerHr: target.hourlyPrice,
                floors: target.floors || ['L1'],
                ...target
              };
              setLoc(mapped);
              setSelectedFloor(mapped.floors?.[0] || 'L1');
            }
          }
        } catch (err) {
          console.error('Error fetching fallback location:', err);
        }
      };
      fetchDefaultLoc();
    }
  }, [loc]);

  // Fetch slots for selected floor with Focus-Aware Smart Polling (Serverless Real-Time Sync)
  useEffect(() => {
    if (!loc) return;

    const fetchLocSlots = async (showLoading = false) => {
      if (showLoading) setLoading(true);
      const token = localStorage.getItem('drivix_auth_token');
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/parking/${loc.id}/slots?floor=${selectedFloor}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSlots(data);

          // Restore selection if slot is still reserved under our name
          const ourReservedSlot = data.find(s => s.status === 'temporarily_reserved' && s.reservedBy === localStorage.getItem('drivix_user_uid'));
          if (ourReservedSlot) {
            setSelectedSlot(ourReservedSlot.id);
            setReservationExpiry(new Date(ourReservedSlot.reservationExpiresAt));
          }
        }
      } catch (err) {
        console.error("Error fetching slots:", err);
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    fetchLocSlots(true);

    // Visibility-aware smart background interval (failsafe fallback for serverless hosting)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchLocSlots(false);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [loc, selectedFloor]);

  // Connect Socket.IO for immediate state synchronization
  useEffect(() => {
    if (!loc) return;

    const socket = io(API_BASE_URL.replace('/api/v1', ''), {
      transports: ['websocket'],
      upgrade: false
    });

    socket.on('connect', () => {
      console.log('Connected to real-time slots server via Socket.IO');
    });

    socket.on('slotStatusUpdated', (event) => {
      if (event.facilityId === loc.id) {
        setSlots((prevSlots) =>
          prevSlots.map((slot) =>
            slot.id === event.id
              ? {
                  ...slot,
                  status: event.status,
                  reservationExpiresAt: event.reservationExpiresAt,
                  reservedBy: event.reservedBy || slot.reservedBy
                }
              : slot
          )
        );

        // If the slot we currently hold was released by the server, clear local selection
        if (event.id === selectedSlot && event.status === 'available') {
          setSelectedSlot(null);
          setReservationExpiry(null);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [loc, selectedSlot]);

  // Handle active countdown timers
  useEffect(() => {
    if (!reservationExpiry) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.round((new Date(reservationExpiry) - new Date()) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        setSelectedSlot(null);
        setReservationExpiry(null);
        showToast("Your 5-minute temporary slot reservation has expired. Please select a slot again.", "warning");
      }
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [reservationExpiry, showToast]);

  // Release slot on unmount if it's still reserved
  useEffect(() => {
    return () => {
      if (selectedSlot && loc?.id) {
        const token = localStorage.getItem('drivix_auth_token');
        fetch(`${API_BASE_URL}/api/v1/parking/${loc.id}/slots/${selectedSlot}/release`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(err => console.error("Error releasing slot on unmount:", err));
      }
    };
  }, [selectedSlot, loc]);

  const floors = useMemo(() => loc?.floors || ['L1'], [loc]);

  const slotRows = useMemo(() => {
    return slots.reduce((acc, slot) => {
      if (!acc[slot.row]) acc[slot.row] = [];
      acc[slot.row].push(slot);
      return acc;
    }, {});
  }, [slots]);

  const handleSlotClick = async (slotId, status) => {
    const token = localStorage.getItem('drivix_auth_token');
    
    // 1. If slot is already booked, occupied, maintenance, or reserved by another user
    if (status === 'booked' || status === 'occupied' || status === 'maintenance' || status === 'temporarily_reserved') {
      showToast("This slot is currently being booked by another user. Please choose another available slot.", "error");
      return;
    }

    // 2. If slot is already selected by current user -> release it
    if (slotId === selectedSlot) {
      try {
        setSelectedSlot(null);
        setReservationExpiry(null);
        setTimeLeft(0);
        await fetch(`${API_BASE_URL}/api/v1/parking/${loc.id}/slots/${slotId}/release`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Error releasing slot:", err);
      }
      return;
    }

    // 3. If another slot was selected previously -> release it first
    if (selectedSlot) {
      try {
        await fetch(`${API_BASE_URL}/api/v1/parking/${loc.id}/slots/${selectedSlot}/release`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Error releasing previous slot:", err);
      }
    }

    // 4. Reserve the new slot
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/parking/${loc.id}/slots/${slotId}/reserve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const updatedSlot = await res.json();
        setSelectedSlot(slotId);
        setReservationExpiry(new Date(updatedSlot.reservationExpiresAt));
      } else {
        const errData = await res.json();
        showToast(errData.message || "This slot is currently being booked by another user. Please choose another available slot.", "error");
      }
    } catch (err) {
      console.error("Error reserving slot:", err);
      showToast("Could not reserve slot. Please try again.", "error");
    }
  };

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
                             const isTempReserved = slot.status === 'temporarily_reserved' && new Date(slot.reservationExpiresAt) > new Date();
                             
                             let status = 'available';
                             if (slot.id === selectedSlot) {
                               status = 'selected';
                             } else if (isTempReserved) {
                               status = 'temporarily_reserved';
                             } else if (slot.status === 'booked') {
                               status = 'booked';
                             } else if (slot.status === 'occupied') {
                               status = 'occupied';
                             } else if (slot.status === 'maintenance') {
                               status = 'maintenance';
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

        {/* Reservation Countdown Alert */}
        <AnimatePresence>
          {selectedSlot && timeLeft > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-panel"
              style={{
                padding: '16px', borderRadius: 'var(--radius-card)', marginBottom: '24px',
                background: 'rgba(255, 206, 0, 0.08)', border: '1.5px solid var(--accent-primary)',
                textAlign: 'center'
              }}
            >
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-primary)' }}>
                ⚠️ Slot {selectedSlot} reserved temporarily. Complete booking in <strong>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</strong>
              </p>
            </motion.div>
          )}
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
