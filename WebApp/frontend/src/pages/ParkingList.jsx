import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdCarousel from '../components/AdCarousel';
import {
  MapPin, Car, Users, Star, ChevronRight, Search,
  Shield, Zap, Clock, Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import loadingCar from '../assets/Loading_car.mp4';
import { API_BASE_URL } from '../config';



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
  const location = useLocation();
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState(location.state?.searchQuery || '');
  const [hoveredId, setHoveredId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = React.useState(null);

  // Booking Mode: Mode 1 (FUTURE_MANUAL) vs Mode 2 (INSTANT_NEARBY)
  const [bookingMode, setBookingMode] = useState('INSTANT_NEARBY');

  // Real-time browser live location tracking with fallback
  React.useEffect(() => {
    if (navigator.geolocation) {
      const updatePos = (pos) => {
        if (pos?.coords?.latitude && pos?.coords?.longitude) {
          setUserCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
        }
      };

      const handleErr = (err) => {
        console.warn("High accuracy browser location fallback triggered:", err);
        // Fallback to standard accuracy
        navigator.geolocation.getCurrentPosition(
          updatePos,
          (err2) => {
            console.warn("Unable to fetch user location:", err2);
            // Default reference location (Greater Noida / Knowledge Park II region)
            setUserCoords({ latitude: 28.4744, longitude: 77.5040 });
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      };

      navigator.geolocation.getCurrentPosition(updatePos, handleErr, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 10000
      });

      const watchId = navigator.geolocation.watchPosition(updatePos, handleErr, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000
      });

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setUserCoords({ latitude: 28.4744, longitude: 77.5040 });
    }
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
        
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const getDistanceText = (loc) => {
    if (!loc) return '1.1 km';
    if (loc.computedDistanceText) return loc.computedDistanceText;
    if (!userCoords || !loc.latitude || !loc.longitude) {
      return loc.distance || '1.1 km';
    }
    const km = calculateDistance(
      userCoords.latitude,
      userCoords.longitude,
      Number(loc.latitude),
      Number(loc.longitude)
    );
    if (km === null) return loc.distance || '1.1 km';
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

  React.useEffect(() => {
    const fetchLocations = async () => {
      const token = localStorage.getItem('drivix_auth_token');
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/parking`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Map MongoDB schema to client-side attributes
          const mapped = data.map(loc => ({
            id: loc._id || loc.id,
            name: loc.parkingName,
            address: loc.address,
            distance: loc.distance || '1.1 km',
            totalSlots: loc.totalSlots || 0,
            availableSlots: loc.availableSlots || 0,
            pricePerHr: loc.hourlyPrice || 20,
            rating: loc.rating || 4.7,
            features: loc.amenities && loc.amenities.length > 0 ? loc.amenities : ['CCTV', 'Covered'],
            color: loc.color || '#FFCE00',
            badge: loc.status === 'Active' ? 'Open' : 'Closed',
            floors: loc.floors || ['L1'],
            ...loc
          }));
          setLocations(mapped);
        }
      } catch (err) {
        console.error('Error fetching parking locations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Process and sort parking locations by exact live distance (closest first)
  const processedLocations = React.useMemo(() => {
    if (!locations || locations.length === 0) return [];
    
    return [...locations]
      .map((loc) => {
        const lat = Number(loc.latitude);
        const lon = Number(loc.longitude);
        let km = null;
        if (userCoords && lat && lon) {
          km = calculateDistance(userCoords.latitude, userCoords.longitude, lat, lon);
        }
        
        let formattedDist = loc.distance || '1.1 km';
        if (km !== null) {
          formattedDist = km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
        }

        return {
          ...loc,
          distanceVal: km !== null ? km : 99999,
          computedDistanceText: formattedDist
        };
      })
      .sort((a, b) => a.distanceVal - b.distanceVal);
  }, [locations, userCoords]);

  // Nearest instant match picked dynamically from live location-sorted active facilities
  const nearestInstantMatch = React.useMemo(() => {
    if (!processedLocations || processedLocations.length === 0) return null;
    const activeHubs = processedLocations.filter(l => l.status !== 'Inactive' && l.status !== 'Pending');
    return activeHubs.length > 0 ? activeHubs[0] : processedLocations[0];
  }, [processedLocations]);

  const matchesSearch = (text, query) => {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.trim().toLowerCase();
    
    if (!lowerQuery) return true;
    
    // Noida vs Greater Noida logic:
    // If the search query contains 'noida' but does NOT contain 'greater',
    // we filter out 'greater noida' from the match text so we don't return false positives.
    if (lowerQuery.includes('noida') && !lowerQuery.includes('greater')) {
      const withoutGreaterNoida = lowerText.replace(/greater\s+noida/g, '');
      return withoutGreaterNoida.includes(lowerQuery);
    }
    
    return lowerText.includes(lowerQuery);
  };

  const filtered = processedLocations.filter((p) =>
    matchesSearch(p.name, search) || matchesSearch(p.address, search)
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

        {/* Mode 1 & Mode 2 Booking Mode Switcher */}
        <motion.div variants={itemVariants} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => { setBookingMode('INSTANT_NEARBY'); setSearch(''); }}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: '14px', border: '1px solid',
              borderColor: bookingMode === 'INSTANT_NEARBY' ? '#10b981' : 'rgba(255,255,255,0.1)',
              background: bookingMode === 'INSTANT_NEARBY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
              color: bookingMode === 'INSTANT_NEARBY' ? '#10b981' : 'var(--text-secondary)',
              fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Zap size={16} color={bookingMode === 'INSTANT_NEARBY' ? '#10b981' : 'var(--text-secondary)'} />
            Instant Park
          </button>

          <button
            onClick={() => setBookingMode('FUTURE_MANUAL')}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: '14px', border: '1px solid',
              borderColor: bookingMode === 'FUTURE_MANUAL' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
              background: bookingMode === 'FUTURE_MANUAL' ? 'rgba(250, 255, 0, 0.15)' : 'rgba(255,255,255,0.03)',
              color: bookingMode === 'FUTURE_MANUAL' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <MapPin size={16} color={bookingMode === 'FUTURE_MANUAL' ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
            Future Trip
          </button>
        </motion.div>

        {/* Mode 2: Live GPS Recommendation Card */}
        {bookingMode === 'INSTANT_NEARBY' && nearestInstantMatch && (
          <motion.div variants={itemVariants} className="glass-panel" style={{
            padding: '20px', borderRadius: '20px', marginBottom: '28px',
            border: '1.5px solid rgba(16, 185, 129, 0.4)', background: 'rgba(10, 13, 22, 0.85)',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', letterSpacing: '1px', background: 'rgba(16, 185, 129, 0.12)', padding: '4px 10px', borderRadius: '20px' }}>
                ⚡ LIVE GPS NEAREST MATCH
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#00f2ff' }}>
                {getDistanceText(nearestInstantMatch)} away
              </span>
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>
              {nearestInstantMatch.name}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
              {nearestInstantMatch.address}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 800, fontSize: '1rem' }}>
                ₹{nearestInstantMatch.pricePerHr || nearestInstantMatch.hourlyPrice || 20}/hr
              </span>
              <button
                onClick={() => navigate('/slot-layout', { state: { location: nearestInstantMatch } })}
                style={{
                  background: '#10b981', color: '#000', border: 'none',
                  padding: '10px 24px', borderRadius: '14px', fontWeight: 900,
                  cursor: 'pointer', fontSize: '0.85rem', letterSpacing: '0.5px'
                }}
              >
                INSTANT PARK HERE NOW
              </button>
            </div>
          </motion.div>
        )}

        {/* Search Bar */}
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
        <motion.div variants={itemVariants} style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {[{ label: 'Locations', value: processedLocations.length, Icon: MapPin },
            { label: 'Total Slots', value: processedLocations.reduce((a, p) => a + (p.totalSlots || 0), 0), Icon: Car },
            { 
              label: 'Available', 
              value: processedLocations.reduce((a, p) => a + (p.availableSlots || 0), 0), 
              Icon: Zap 
            }
          ].map((stat) => (
            <div key={stat.label} className="glass-panel" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '6px 16px', 
              borderRadius: '99px', 
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--glass-border)',
              flex: '0 1 auto',
              minWidth: '135px',
            }}>
              <div style={{ 
                width: '28px', 
                height: '28px', 
                borderRadius: '50%', 
                background: 'rgba(255, 206, 0, 0.08)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <stat.Icon size={13} color="var(--accent-primary)" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.1 }}>{stat.value}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase', marginTop: '1px' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Location Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filtered.map((loc) => {
            const total = loc.totalSlots || 0;
            const dynamicAvailable = loc.availableSlots || 0;
            
            const avColor = availabilityColor(dynamicAvailable, total);
            const pct = total > 0 ? Math.round((dynamicAvailable / total) * 100) : 0;
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
                        {getDistanceText(loc)}
                      </span>
                    </div>

                    {/* Availability bar */}
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Availability</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: avColor }}>
                          {dynamicAvailable}/{total} slots
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
                        {(loc.features || []).map((f) => (
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
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ type: 'spring', stiffness: 100 }}
            className="glass-panel"
            style={{ 
              textAlign: 'center', 
              padding: '60px 30px', 
              borderRadius: 'var(--radius-card)', 
              border: '1px solid var(--glass-border)',
              background: 'rgba(255, 255, 255, 0.01)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              maxWidth: '600px',
              margin: '40px auto 0',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '-50px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100px',
              height: '100px',
              background: 'var(--accent-glow)',
              filter: 'blur(30px)',
              borderRadius: '50%'
            }} />

            <motion.div
              animate={{ 
                y: [0, -12, 0],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2, 
                ease: "easeInOut" 
              }}
              style={{ 
                fontSize: '4rem', 
                marginBottom: '20px',
                display: 'inline-block',
                filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))'
              }}
            >
              🚗💨
            </motion.div>
            
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              No Facilities Available 🔎
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 24px', lineHeight: 1.5, fontSize: '0.95rem' }}>
              Oops! We couldn't find any parking hubs matching "{search}".
            </p>
          </motion.div>
        )}

        {/* Dynamic Advertisement Carousel */}
        <div style={{ marginTop: '32px', width: '100%' }}>
          <AdCarousel />
        </div>

        {loading && (
           <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <video 
                src={loadingCar} 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="loader-video"
                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 16px' }} 
              />
              <p style={{ color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '2px' }}>CONNECTING TO PARKING...</p>
           </div>
        )}
      </div>
    </motion.div>
  );
};

export default ParkingList;
