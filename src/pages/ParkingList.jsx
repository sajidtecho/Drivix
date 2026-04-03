import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Car, Users, Star, ChevronRight, Search,
  Shield, Zap, Clock, Navigation
} from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import seedParkingData from '../ParkingFacility/ShardaParking';



const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};
const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 90 } },
};

const ParkingList = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState('');
  const [hoveredId, setHoveredId] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const q = query(collection(db, 'parking_facilities'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLocations(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const seedRealData = async () => {
    try {
      await seedParkingData();
      alert('Sharda University MLP Initialized Successfully!');
    } catch (err) {
      console.error(err);
      alert('Initialization Failed: ' + err.message);
    }
  };

  const filtered = locations.filter((p) =>
    (p.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p.address?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const availabilityColor = (avail, total) => {
    const pct = avail / total;
    if (pct > 0.4) return '#00cc6a';
    if (pct > 0.15) return '#FFAD00';
    return '#ff4b4b';
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ paddingTop: '100px', minHeight: '100vh', background: 'var(--bg-primary)', padding: '110px 5% 80px' }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <motion.div variants={itemVariants} style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-input)', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car color="#000" size={22} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-secondary)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Smart Parking
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '12px' }}>
            Select <span className="text-gradient">Parking</span>
            <br />Location
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
            Choose a parking building to see real-time slot availability.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
          <div className="glass-panel" style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '14px 20px', borderRadius: 'var(--radius-card)',
            background: 'var(--glass-bg)',
          }}>
            <Search size={20} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Search parking facilities (e.g. Sharda Univ)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                outline: 'none', fontSize: '1rem', fontFamily: 'inherit',
                color: 'var(--text-primary)',
              }}
            />
            <div 
              onClick={() => window.open(`https://www.google.com/maps/search/parking+near+${search || 'me'}`, '_blank')}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', 
                borderRadius: 'var(--radius-input)', background: 'rgba(250, 255, 0, 0.1)', 
                border: '1px solid rgba(250, 255, 0, 0.25)', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(250, 255, 0, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(250, 255, 0, 0.1)'}
            >
              <Navigation size={14} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-primary)' }}>Maps Search</span>
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div variants={itemVariants} style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {[{ label: 'Locations', value: locations.length, Icon: MapPin },
            { label: 'Total Slots', value: locations.reduce((a, p) => a + (p.totalSlots || 0), 0), Icon: Car },
            { label: 'Available', value: locations.reduce((a, p) => a + (p.availableSlots || 0), 0), Icon: Zap }
          ].map((stat) => (
            <div key={stat.label} className="glass-panel" style={{ flex: '1 1 120px', padding: '16px 20px', borderRadius: 'var(--radius-input)', textAlign: 'center' }}>
              <stat.Icon size={18} color="var(--accent-primary)" style={{ marginBottom: '6px' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stat.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Location Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filtered.map((loc) => {
            const avColor = availabilityColor(loc.availableSlots, loc.totalSlots);
            const pct = Math.round((loc.availableSlots / loc.totalSlots) * 100);
            return (
              <motion.div
                key={loc.id}
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.005 }}
                onHoverStart={() => setHoveredId(loc.id)}
                onHoverEnd={() => setHoveredId(null)}
                onClick={() => navigate('/slot-layout', { state: { location: loc } })}
                className="glass-panel"
                style={{
                  padding: '28px', cursor: 'pointer', overflow: 'hidden', position: 'relative',
                  border: hoveredId === loc.id ? `1.5px solid ${loc.color}55` : '1px solid var(--glass-border)',
                  transition: 'all 0.25s ease',
                }}
              >
                {/* Color accent */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                  background: `linear-gradient(90deg, ${loc.color}, transparent)`,
                }} />

                {/* Badge */}
                <div style={{
                  position: 'absolute', top: '20px', right: '20px',
                  padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: '0.72rem',
                  fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase',
                  background: `${loc.color}22`, color: loc.color, border: `1px solid ${loc.color}44`,
                }}>
                  {loc.badge}
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }} className="parking-card-inner">
                  <style>{`
                    @media (max-width: 640px) {
                      .parking-card-inner {
                        flex-direction: column !important;
                      }
                      .parking-card-icon {
                        width: 48px !important;
                        height: 48px !important;
                      }
                      .parking-card-title {
                        padding-right: 0 !important;
                        font-size: 1.15rem !important;
                      }
                      .parking-card-bottom {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                      }
                      .parking-card-actions {
                         width: 100% !important;
                         justify-content: space-between !important;
                      }
                    }
                  `}</style>
                  {/* Icon */}
                  <div style={{
                    width: '60px', height: '60px', borderRadius: 'var(--radius-card)', flexShrink: 0,
                    background: `${loc.color}18`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', border: `1.5px solid ${loc.color}33`,
                  }} className="parking-card-icon">
                    <Car size={28} color={loc.color} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '4px', paddingRight: '80px' }} className="parking-card-title">
                      {loc.name}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '16px', flexWrap: 'wrap' }}>
                      <MapPin size={14} />
                      <span>{loc.address}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-input)', background: 'var(--bg-secondary)', fontSize: '0.78rem', fontWeight: 600 }}>
                        {loc.distance}
                      </span>
                    </div>

                    {/* Availability bar */}
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Availability</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: avColor }}>
                          {loc.availableSlots}/{loc.totalSlots} slots
                        </span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                          style={{ height: '100%', borderRadius: '3px', background: avColor }}
                        />
                      </div>
                    </div>

                    {/* Bottom row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }} className="parking-card-bottom">
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {loc.features.map((f) => (
                          <span key={f} style={{
                            fontSize: '0.7rem', fontWeight: 600, padding: '4px 10px',
                            borderRadius: 'var(--radius-input)', background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)', border: '1px solid var(--glass-border)',
                          }}>{f}</span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', justifyContent: 'space-between' }} className="parking-card-actions">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={14} color="#FFCE00" fill="#FFCE00" />
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{loc.rating}</span>
                          </div>
                          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent-primary)' }}>
                            ₹{loc.pricePerHr}<span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>/hr</span>
                          </span>
                        </div>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                          borderRadius: 'var(--radius-button)', background: `${loc.color}15`, border: `1px solid ${loc.color}30`,
                          color: loc.color, fontWeight: 700, fontSize: '0.88rem',
                        }}>
                          Slots <ChevronRight size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-card)', border: '1px solid var(--glass-border)' }}>
            <MapPin size={48} color="var(--accent-primary)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>No Facilities Found</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 24px' }}>
              We couldn't find any parking facilities in your system. Initialize the default configuration to begin.
            </p>
            <button
               onClick={seedRealData}
               className="btn btn-primary"
               style={{ padding: '14px 30px', fontWeight: 800 }}
            >
              Initialize Sharda University MLP
            </button>
          </motion.div>
        )}

        {loading && (
           <div style={{ textAlign: 'center', padding: '40px' }}>
             <p style={{ color: 'var(--text-secondary)' }}>Connecting to Firestore...</p>
           </div>
        )}
      </div>
    </motion.div>
  );
};

export default ParkingList;
