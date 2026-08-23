import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layers, Calendar, Clock, Loader2, ArrowRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoLoader from '../components/common/VideoLoader';
import { API_BASE_URL } from '../config';
import { io } from 'socket.io-client';
import { useToast } from '../context/ToastContext';

const SlotLayout = () => {
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const { showToast } = useToast();
  
  const [loc, setLoc] = useState(locationState?.location ? {
    id: locationState.location._id || locationState.location.id,
    name: locationState.location.parkingName,
    address: locationState.location.address,
    floors: locationState.location.floors || ['L1'],
    pricePerHr: locationState.location.hourlyPrice
  } : null);

  const [selectedFloor, setSelectedFloor] = useState('L1');
  const [floorCapacities, setFloorCapacities] = useState({});
  const [loading, setLoading] = useState(true);

  // Booking Flow parameters
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [duration, setDuration] = useState(2);
  const [usageType, setUsageType] = useState('personal'); // 'personal' | 'commercial'

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

  // Fetch live floor capacities
  const fetchLiveCapacities = async (showLoading = false) => {
    if (!loc) return;
    if (showLoading) setLoading(true);
    const token = localStorage.getItem('drivix_auth_token');
    
    try {
      const capacities = {};
      const floorList = loc.floors || ['L1'];
      
      for (const floorName of floorList) {
        const res = await fetch(`${API_BASE_URL}/api/v1/parking/floors/${floorName}/availability?parkingHubId=${loc.id}&date=${bookingDate}&startTime=${startTime}&duration=${duration}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          capacities[floorName] = {
            totalCapacity: data.totalCapacity,
            occupied: 0,
            reserved: data.reservedCapacity,
            available: data.availableCapacity,
            floorName: data.floorName,
            floorId: data.floorId
          };
        } else {
          // Fallback if floor document doesn't exist yet
          capacities[floorName] = {
            totalCapacity: 100,
            occupied: 0,
            reserved: 0,
            available: 100,
            floorName: floorName
          };
        }
      }
      setFloorCapacities(capacities);
    } catch (err) {
      console.error("Error fetching capacities:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (loc) {
      fetchLiveCapacities(true);
    }
  }, [loc, bookingDate, startTime, duration]);

  // Real-time capacity synchronization
  useEffect(() => {
    if (!loc) return;

    const socket = io(API_BASE_URL.replace('/api/v1', ''), {
      transports: ['polling', 'websocket']
    });

    socket.on('floorCapacityUpdated', (event) => {
      if (String(event.parkingHubId) === String(loc.id)) {
        fetchLiveCapacities(false);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [loc]);

  const handleProceed = () => {
    const selectedCap = floorCapacities[selectedFloor];
    if (selectedCap && selectedCap.available <= 0) {
      showToast("Sorry, this floor is fully reserved for the selected time.", "error");
      return;
    }

    navigate('/slot-booking', {
      state: {
        location: loc,
        slot: null,
        floor: selectedFloor,
        bookingDate,
        startTime,
        duration,
        usageType
      }
    });
  };

  const floors = loc?.floors || ['L1'];

  return (
    <div style={{ paddingTop: '90px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 5% 80px' }}>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>
          Choose Preferred <span className="text-gradient">Floor</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', marginBottom: '28px' }}>
          {loc?.name || 'Loading facility...'} · {loc?.address}
        </p>

        {/* Date, Time & Duration Selectors */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-card)', marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📅 Reservation Schedule
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Booking Date
              </label>
              <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: 'var(--radius-input)', background: 'var(--bg-tertiary)' }}>
                <Calendar size={16} color="var(--accent-primary)" />
                <input 
                  type="date" 
                  value={bookingDate} 
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none', width: '100%', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Start Time
              </label>
              <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: 'var(--radius-input)', background: 'var(--bg-tertiary)' }}>
                <Clock size={16} color="var(--accent-primary)" />
                <input 
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none', width: '100%', fontFamily: 'inherit' }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Duration (Hours)
            </label>
            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: 'var(--radius-input)', background: 'var(--bg-tertiary)' }}>
              <Clock size={16} color="var(--accent-primary)" />
              <select 
                value={duration} 
                onChange={(e) => setDuration(Number(e.target.value))}
                style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none', width: '100%', fontFamily: 'inherit', cursor: 'pointer' }}
              >
                {[1, 2, 3, 4, 6, 8, 12, 24].map((h) => (
                  <option key={h} value={h} style={{ background: 'var(--bg-primary)' }}>{h} {h === 1 ? 'Hour' : 'Hours'}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Vehicle Usage Type */}
          <div style={{ marginTop: '20px', marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Vehicle Usage Type
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { value: 'personal', label: '🚗 Personal / Family' },
                { value: 'commercial', label: '🚛 Commercial' }
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setUsageType(t.value)}
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-button)',
                    fontFamily: 'inherit',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    background: usageType === t.value ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--bg-tertiary)',
                    color: usageType === t.value ? '#000' : 'var(--text-primary)',
                    border: usageType === t.value ? 'none' : '1px solid var(--glass-border)',
                    boxShadow: usageType === t.value ? '0 4px 12px var(--accent-glow)' : 'none',
                    transition: 'all 0.18s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Warning Message Card */}
          {usageType === 'personal' && duration > 6 && (
            <div 
              className="glass-panel"
              style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-card)',
                background: 'rgba(255, 206, 0, 0.03)',
                border: '1.2px solid rgba(255, 206, 0, 0.25)',
                marginBottom: '16px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}
            >
              <AlertTriangle size={18} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Verification Notice
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  For security purposes, personal or family used vehicles booked for more than <strong>6 hours</strong> require owner verification at the parking facility before parking your vehicle.
                </p>
              </div>
            </div>
          )}

          {usageType === 'commercial' && (
            <div 
              className="glass-panel"
              style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-card)',
                background: duration > 12 ? 'rgba(255, 75, 75, 0.05)' : 'rgba(255, 206, 0, 0.03)',
                border: duration > 12 ? '1.2px solid #ff4b4b' : '1.2px solid rgba(255, 206, 0, 0.25)',
                marginBottom: '16px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}
            >
              <AlertTriangle size={18} color={duration > 12 ? '#ff4b4b' : 'var(--accent-primary)'} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: duration > 12 ? '#ff4b4b' : 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {duration > 12 ? 'Limit Exceeded' : 'Verification Required'}
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {duration > 12 
                    ? 'Commercial vehicle bookings cannot exceed 12 hours. Please reduce your duration to 12 hours or less.' 
                    : 'For commercial vehicles, it is mandatory to complete owner and driver verification at the parking facilities before parking your vehicle.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Floor Capacity Cards list */}
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🏢 Floors Capacity status
        </h3>

        {loading ? (
          <div className="glass-panel" style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', borderRadius: 'var(--radius-card)' }}>
            <VideoLoader size={80} />
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.5px' }}>RETRIEVING CAPACITIES...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            {floors.map((floorName) => {
              const isActive = floorName === selectedFloor;
              const cap = floorCapacities[floorName] || { totalCapacity: 0, occupied: 0, reserved: 0, available: 0 };
              
              const isFull = cap.available <= 0;
              const occupancyPercent = cap.totalCapacity > 0 ? Math.round(((cap.occupied + cap.reserved) / cap.totalCapacity) * 100) : 0;
              
              return (
                <motion.div
                  key={floorName}
                  whileHover={!isFull ? { y: -2, scale: 1.01 } : {}}
                  onClick={() => !isFull && setSelectedFloor(floorName)}
                  className="glass-panel"
                  style={{
                    padding: '20px 24px',
                    cursor: isFull ? 'not-allowed' : 'pointer',
                    borderRadius: 'var(--radius-card)',
                    border: isActive ? '1.5px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                    background: isActive ? 'var(--accent-glow)' : 'var(--glass-bg)',
                    opacity: isFull ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Layers size={18} color={isActive ? "var(--accent-primary)" : "var(--text-secondary)"} />
                      <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{floorName}</span>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {isFull ? 'Currently Full' : 'Available Capacity'}
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 850, color: isFull ? '#ff4b4b' : '#00cc6a' }}>
                        {isFull ? '[Unavailable]' : `${cap.available} / ${cap.totalCapacity}`}
                      </span>
                    </div>
                  </div>

                  {/* Capacity Progress Bar */}
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${occupancyPercent}%`, 
                        background: isFull ? '#ff4b4b' : 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease-out'
                      }} 
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <span>Reserved: {cap.reserved} slots</span>
                    <span>Occupied: {cap.occupied} slots</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pricing details and Proceed */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '0 8px' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '2px', letterSpacing: '0.5px' }}>
              RESERVED FLOOR
            </p>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--accent-primary)' }}>{selectedFloor}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Total Est. Cost</p>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--accent-primary)' }}>
              ₹{(loc?.pricePerHr || 60) * duration}
            </span>
          </div>
        </div>

        {/* Proceed Button */}
        <motion.button
          whileHover={!(usageType === 'commercial' && duration > 12) ? { y: -2 } : {}}
          whileTap={!(usageType === 'commercial' && duration > 12) ? { scale: 0.98 } : {}}
          onClick={handleProceed}
          disabled={usageType === 'commercial' && duration > 12}
          className="btn btn-primary"
          style={{
            width: '100%', padding: '18px', fontSize: '1.05rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            opacity: (usageType === 'commercial' && duration > 12) ? 0.5 : 1,
            cursor: (usageType === 'commercial' && duration > 12) ? 'not-allowed' : 'pointer',
            background: (usageType === 'commercial' && duration > 12) ? 'var(--bg-secondary)' : undefined,
            color: (usageType === 'commercial' && duration > 12) ? 'var(--text-muted)' : undefined,
            border: (usageType === 'commercial' && duration > 12) ? '1px solid var(--glass-border)' : undefined,
            boxShadow: (usageType === 'commercial' && duration > 12) ? 'none' : undefined
          }}
        >
          Proceed to Booking Form <ArrowRight size={18} />
        </motion.button>
      </div>
    </div>
  );
};

export default SlotLayout;
