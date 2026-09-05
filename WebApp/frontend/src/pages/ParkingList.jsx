import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdCarousel from '../components/AdCarousel';
import {
  MapPin, Car, Users, Star, ChevronRight, Search,
  Shield, Zap, Clock, Navigation, Filter, SlidersHorizontal,
  RotateCcw, AlertTriangle, CheckCircle2, Building2, DollarSign, X, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import loadingCar from '../assets/Loading_car.mp4';
import { API_BASE_URL } from '../config';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

const ParkingList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState(location.state?.searchQuery || '');
  const [hoveredId, setHoveredId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState(null);

  // Booking Mode: Mode 1 (FUTURE_MANUAL) vs Mode 2 (INSTANT_NEARBY)
  const [bookingMode, setBookingMode] = useState('INSTANT_NEARBY');

  // Filter & Sort States
  const [cityFilter, setCityFilter] = useState('ALL'); // 'ALL', 'New Delhi', 'Noida', 'Greater Noida'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'Active', 'Pending', 'Restricted'
  const [sortBy, setSortBy] = useState('distance'); // 'distance', 'price_asc', 'price_desc', 'slots_desc', 'available_desc'
  const [maxPriceFilter, setMaxPriceFilter] = useState('ALL'); // 'ALL', '15', '25', '50'
  const [onlyEvCharging, setOnlyEvCharging] = useState(false);
  const [onlyMultilevel, setOnlyMultilevel] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

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
        navigator.geolocation.getCurrentPosition(
          updatePos,
          (err2) => {
            console.warn("Unable to fetch user location:", err2);
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
    return R * c;
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
          const mapped = data.map(loc => {
            let statusBadgeColor = '#FFCE00';
            let statusBadgeText = 'Open';
            if (loc.status === 'Active') {
              statusBadgeColor = '#00cc6a';
              statusBadgeText = 'Open';
            } else if (loc.status === 'Pending') {
              statusBadgeColor = '#FFAD00';
              statusBadgeText = 'Pending';
            } else if (loc.status === 'Restricted') {
              statusBadgeColor = '#ff4b4b';
              statusBadgeText = 'Restricted';
            } else if (loc.status === 'Inactive') {
              statusBadgeColor = '#888';
              statusBadgeText = 'Closed';
            }

            return {
              id: loc._id || loc.id,
              name: loc.parkingName,
              address: loc.address,
              city: loc.city || '',
              distance: loc.distance || '1.1 km',
              totalSlots: loc.totalSlots !== null && loc.totalSlots !== undefined ? loc.totalSlots : null,
              availableSlots: loc.availableSlots !== null && loc.availableSlots !== undefined ? loc.availableSlots : null,
              pricePerHr: loc.hourlyPrice !== null && loc.hourlyPrice !== undefined ? loc.hourlyPrice : null,
              rating: loc.rating || 4.7,
              features: loc.amenities && loc.amenities.length > 0 ? loc.amenities : ['CCTV', 'Covered'],
              color: statusBadgeColor,
              badge: statusBadgeText,
              floors: loc.floors || ['L1'],
              ...loc
            };
          });
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

  // Process location distances
  const processedLocations = React.useMemo(() => {
    if (!locations || locations.length === 0) return [];
    
    return [...locations].map((loc) => {
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
    });
  }, [locations, userCoords]);

  // Nearest instant match
  const nearestInstantMatch = React.useMemo(() => {
    if (!processedLocations || processedLocations.length === 0) return null;
    const sorted = [...processedLocations].sort((a, b) => a.distanceVal - b.distanceVal);
    const activeHubs = sorted.filter(l => l.status === 'Active');
    return activeHubs.length > 0 ? activeHubs[0] : sorted[0];
  }, [processedLocations]);

  const matchesSearch = (text, query) => {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.trim().toLowerCase();
    if (!lowerQuery) return true;
    
    if (lowerQuery.includes('noida') && !lowerQuery.includes('greater')) {
      const withoutGreaterNoida = lowerText.replace(/greater\s+noida/g, '');
      return withoutGreaterNoida.includes(lowerQuery);
    }
    return lowerText.includes(lowerQuery);
  };

  // Comprehensive Filter & Sort Logic
  const filtered = React.useMemo(() => {
    if (!processedLocations || processedLocations.length === 0) return [];

    let result = processedLocations.filter((p) => {
      // 1. Keyword search
      const matchesKeyword = matchesSearch(p.name, search) ||
                             matchesSearch(p.address, search) ||
                             matchesSearch(p.city, search) ||
                             matchesSearch(p.parkingCode, search);
      if (!matchesKeyword) return false;

      // 2. City Filter
      if (cityFilter !== 'ALL') {
        const pCity = (p.city || '').toLowerCase();
        const pAddr = (p.address || '').toLowerCase();
        const targetCity = cityFilter.toLowerCase();

        if (targetCity === 'noida') {
          if (pCity.includes('greater') || pAddr.includes('greater noida')) return false;
          if (!pCity.includes('noida') && !pAddr.includes('noida')) return false;
        } else if (targetCity === 'greater noida') {
          if (!pCity.includes('greater') && !pAddr.includes('greater noida')) return false;
        } else if (targetCity === 'new delhi') {
          if (!pCity.includes('delhi') && !pAddr.includes('delhi')) return false;
        }
      }

      // 3. Status Filter
      if (statusFilter !== 'ALL') {
        if (p.status !== statusFilter) return false;
      }

      // 4. Max Price Filter
      if (maxPriceFilter !== 'ALL') {
        const cap = Number(maxPriceFilter);
        const price = p.hourlyPrice ?? p.pricePerHr;
        if (price !== null && price !== undefined && price > cap) return false;
      }

      // 5. EV Charging Filter
      if (onlyEvCharging) {
        const featuresStr = (p.amenities || []).concat(p.features || []).join(' ').toLowerCase();
        if (!featuresStr.includes('ev')) return false;
      }

      // 6. Multilevel / Automated Filter
      if (onlyMultilevel) {
        const text = `${p.name} ${p.address} ${(p.amenities || []).join(' ')}`.toLowerCase();
        const isMlcp = text.includes('multilevel') || text.includes('mlcp') || text.includes('underground') || text.includes('automated') || (p.totalFloors && p.totalFloors > 1);
        if (!isMlcp) return false;
      }

      return true;
    });

    // Sort Logic
    result.sort((a, b) => {
      if (sortBy === 'price_asc') {
        const pA = a.hourlyPrice ?? a.pricePerHr ?? 9999;
        const pB = b.hourlyPrice ?? b.pricePerHr ?? 9999;
        return pA - pB;
      }
      if (sortBy === 'price_desc') {
        const pA = a.hourlyPrice ?? a.pricePerHr ?? -1;
        const pB = b.hourlyPrice ?? b.pricePerHr ?? -1;
        return pB - pA;
      }
      if (sortBy === 'slots_desc') {
        return (b.totalSlots || 0) - (a.totalSlots || 0);
      }
      if (sortBy === 'available_desc') {
        return (b.availableSlots || 0) - (a.availableSlots || 0);
      }
      // Default: closest distance
      return a.distanceVal - b.distanceVal;
    });

    return result;
  }, [processedLocations, search, cityFilter, statusFilter, maxPriceFilter, onlyEvCharging, onlyMultilevel, sortBy]);

  // Active Filters Count
  const activeFilterCount = (cityFilter !== 'ALL' ? 1 : 0) +
                            (statusFilter !== 'ALL' ? 1 : 0) +
                            (maxPriceFilter !== 'ALL' ? 1 : 0) +
                            (sortBy !== 'distance' ? 1 : 0) +
                            (onlyEvCharging ? 1 : 0) +
                            (onlyMultilevel ? 1 : 0);

  const resetFilters = () => {
    setCityFilter('ALL');
    setStatusFilter('ALL');
    setSortBy('distance');
    setMaxPriceFilter('ALL');
    setOnlyEvCharging(false);
    setOnlyMultilevel(false);
    setSearch('');
  };

  const availabilityColor = (avail, total) => {
    if (avail === null || total === null || total === 0) return '#FFCE00';
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
      style={{ paddingTop: '85px', minHeight: '100vh', background: 'var(--bg-primary)', padding: '90px 4% 60px' }}
    >
      {/* Mobile Responsive Override Styles */}
      <style>{`
        @media (max-width: 640px) {
          .parking-card {
            padding: 14px 12px !important;
            border-radius: 16px !important;
          }
          .parking-card-inner {
            gap: 10px !important;
          }
          .parking-card-icon {
            width: 40px !important;
            height: 40px !important;
            border-radius: 10px !important;
          }
          .parking-card-icon svg {
            width: 20px !important;
            height: 20px !important;
          }
          .parking-card-title {
            font-size: 1.05rem !important;
            line-height: 1.25 !important;
          }
          .parking-card-address {
            font-size: 0.78rem !important;
            line-height: 1.35 !important;
            margin-bottom: 8px !important;
            white-space: normal !important;
          }
          .parking-card-address-text {
            word-break: break-word !important;
            white-space: normal !important;
            max-width: 100% !important;
          }
          .parking-card-features {
            display: flex !important;
            gap: 4px !important;
            flex-wrap: wrap !important;
          }
          .parking-card-features span {
            font-size: 0.65rem !important;
            padding: 2px 6px !important;
          }
          .parking-card-actions {
            width: 100% !important;
            justify-content: space-between !important;
          }
          .parking-card-bottom {
            margin-top: 6px !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: '920px', margin: '0 auto' }}>

        {/* Header */}
        <motion.div variants={itemVariants} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car color="#000" size={18} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-secondary)', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
              Smart Parking Directory
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '6px' }}>
            Select <span className="text-gradient">Parking</span> Location
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Filter by city, status, or pricing to find your optimal spot in real-time.
          </p>
        </motion.div>

        {/* Mode 1 & Mode 2 Booking Mode Switcher */}
        <motion.div variants={itemVariants} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <button
            onClick={() => { setBookingMode('INSTANT_NEARBY'); setSearch(''); }}
            style={{
              flex: 1, padding: '9px 12px', borderRadius: '12px', border: '1px solid',
              borderColor: bookingMode === 'INSTANT_NEARBY' ? '#10b981' : 'rgba(255,255,255,0.1)',
              background: bookingMode === 'INSTANT_NEARBY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
              color: bookingMode === 'INSTANT_NEARBY' ? '#10b981' : 'var(--text-secondary)',
              fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Zap size={14} color={bookingMode === 'INSTANT_NEARBY' ? '#10b981' : 'var(--text-secondary)'} />
            Instant Park
          </button>

          <button
            onClick={() => setBookingMode('FUTURE_MANUAL')}
            style={{
              flex: 1, padding: '9px 12px', borderRadius: '12px', border: '1px solid',
              borderColor: bookingMode === 'FUTURE_MANUAL' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
              background: bookingMode === 'FUTURE_MANUAL' ? 'rgba(250, 255, 0, 0.15)' : 'rgba(255,255,255,0.03)',
              color: bookingMode === 'FUTURE_MANUAL' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <MapPin size={14} color={bookingMode === 'FUTURE_MANUAL' ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
            Future Trip
          </button>
        </motion.div>

        {/* Mode 2: Live GPS Recommendation Card */}
        {bookingMode === 'INSTANT_NEARBY' && nearestInstantMatch && (
          <motion.div variants={itemVariants} className="glass-panel" style={{
            padding: '14px 16px', borderRadius: '16px', marginBottom: '18px',
            border: '1.5px solid rgba(16, 185, 129, 0.4)', background: 'rgba(10, 13, 22, 0.85)',
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.12)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10b981', letterSpacing: '0.8px', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 7px', borderRadius: '12px' }}>
                ⚡ LIVE GPS NEAREST MATCH
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#00f2ff' }}>
                {getDistanceText(nearestInstantMatch)} away
              </span>
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', marginBottom: '2px' }}>
              {nearestInstantMatch.name}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '10px', lineHeight: 1.35 }}>
              {nearestInstantMatch.address}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 800, fontSize: '0.9rem' }}>
                {nearestInstantMatch.pricePerHr !== null && nearestInstantMatch.pricePerHr !== undefined
                  ? `₹${nearestInstantMatch.pricePerHr}/hr`
                  : 'Rate Unverified'}
              </span>
              <button
                onClick={() => navigate('/slot-layout', { state: { location: nearestInstantMatch } })}
                style={{
                  background: '#10b981', color: '#000', border: 'none',
                  padding: '7px 16px', borderRadius: '10px', fontWeight: 900,
                  cursor: 'pointer', fontSize: '0.78rem', letterSpacing: '0.3px'
                }}
              >
                INSTANT PARK
              </button>
            </div>
          </motion.div>
        )}

        {/* Search Bar & Filter Toggle Header */}
        <motion.div variants={itemVariants} style={{ marginBottom: '12px' }}>
          <div className="glass-panel" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', borderRadius: '14px',
            background: 'var(--glass-bg)', flexWrap: 'wrap'
          }}>
            <Search size={16} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Search facilities (e.g. Sector 18, Palika, DLF)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1, minWidth: '140px', background: 'transparent', border: 'none',
                outline: 'none', fontSize: '0.88rem', fontFamily: 'inherit',
                color: 'var(--text-primary)',
              }}
            />

            {/* Filter Drawer Toggle Button */}
            <button
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px',
                borderRadius: '8px',
                background: showFilterDrawer || activeFilterCount > 0 ? 'rgba(250, 255, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: showFilterDrawer || activeFilterCount > 0 ? '1px solid rgba(250, 255, 0, 0.4)' : '1px solid var(--glass-border)',
                color: showFilterDrawer || activeFilterCount > 0 ? 'var(--accent-primary)' : 'var(--text-primary)',
                fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <SlidersHorizontal size={14} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span style={{
                  background: 'var(--accent-primary)', color: '#000', borderRadius: '50%',
                  width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.68rem', fontWeight: 900
                }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div
              onClick={() => window.open(`https://www.google.com/maps/search/parking+near+${search || 'me'}`, '_blank')}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 10px',
                borderRadius: '8px', background: 'rgba(250, 255, 0, 0.08)',
                border: '1px solid rgba(250, 255, 0, 0.25)', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Navigation size={12} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)' }}>Maps</span>
            </div>
          </div>
        </motion.div>

        {/* Quick City Filter Chips Bar */}
        <motion.div variants={itemVariants} style={{ display: 'flex', gap: '6px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { id: 'ALL', label: 'All Cities' },
            { id: 'New Delhi', label: '🏛️ New Delhi / NDMC' },
            { id: 'Noida', label: '🌆 Noida City' },
            { id: 'Greater Noida', label: '🏙️ Greater Noida' },
          ].map((chip) => {
            const isActive = cityFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setCityFilter(chip.id)}
                style={{
                  padding: '5px 12px', borderRadius: '14px', border: '1px solid',
                  borderColor: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)',
                  background: isActive ? 'rgba(250, 255, 0, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </motion.div>

        {/* Expandable Advanced Filter Panel */}
        <AnimatePresence>
          {showFilterDrawer && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden', marginBottom: '16px' }}
            >
              <div className="glass-panel" style={{
                padding: '16px 18px', borderRadius: '14px', background: 'rgba(15, 20, 32, 0.95)',
                border: '1px solid rgba(250, 255, 0, 0.25)', boxShadow: '0 10px 28px rgba(0,0,0,0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Filter size={15} color="var(--accent-primary)" />
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>Filter & Sort Parking Facilities</h3>
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={resetFilters}
                      style={{
                        background: 'transparent', border: 'none', color: '#ff4b4b',
                        fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <RotateCcw size={12} /> Clear All
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                  
                  {/* Location / City Filter */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Location / City
                    </label>
                    <select
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      style={{
                        width: '100%', padding: '7px 10px', borderRadius: '8px',
                        background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600, outline: 'none'
                      }}
                    >
                      <option value="ALL">All Locations / Cities</option>
                      <option value="New Delhi">🏛️ New Delhi / NDMC & South Zone</option>
                      <option value="Noida">🌆 Noida City</option>
                      <option value="Greater Noida">🏙️ Greater Noida</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Operational Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{
                        width: '100%', padding: '7px 10px', borderRadius: '8px',
                        background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600, outline: 'none'
                      }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="Active">🟢 Active (Open to Public)</option>
                      <option value="Pending">🟡 Pending (Opening Soon)</option>
                      <option value="Restricted">⚠️ Restricted (Special Warning)</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Sort Results By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{
                        width: '100%', padding: '7px 10px', borderRadius: '8px',
                        background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600, outline: 'none'
                      }}
                    >
                      <option value="distance">📍 Distance (Closest First)</option>
                      <option value="price_asc">💵 Price (Low to High)</option>
                      <option value="price_desc">💵 Price (High to Low)</option>
                      <option value="slots_desc">🅿️ Total Capacity (Highest)</option>
                      <option value="available_desc">⚡ Available Slots (Highest)</option>
                    </select>
                  </div>

                  {/* Max Hourly Rate */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Max Hourly Rate
                    </label>
                    <select
                      value={maxPriceFilter}
                      onChange={(e) => setMaxPriceFilter(e.target.value)}
                      style={{
                        width: '100%', padding: '7px 10px', borderRadius: '8px',
                        background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600, outline: 'none'
                      }}
                    >
                      <option value="ALL">Any Rate</option>
                      <option value="15">Under ₹15 / hr</option>
                      <option value="25">Under ₹25 / hr</option>
                      <option value="50">Under ₹50 / hr</option>
                    </select>
                  </div>

                </div>

                {/* Feature Checkbox Toggles */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer',
                    fontSize: '0.78rem', fontWeight: 700, color: onlyEvCharging ? 'var(--accent-primary)' : 'var(--text-secondary)'
                  }}>
                    <input
                      type="checkbox"
                      checked={onlyEvCharging}
                      onChange={(e) => setOnlyEvCharging(e.target.checked)}
                      style={{ accentColor: 'var(--accent-primary)', width: '14px', height: '14px' }}
                    />
                    ⚡ EV Charging Available
                  </label>

                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer',
                    fontSize: '0.78rem', fontWeight: 700, color: onlyMultilevel ? 'var(--accent-primary)' : 'var(--text-secondary)'
                  }}>
                    <input
                      type="checkbox"
                      checked={onlyMultilevel}
                      onChange={(e) => setOnlyMultilevel(e.target.checked)}
                      style={{ accentColor: 'var(--accent-primary)', width: '14px', height: '14px' }}
                    />
                    🏢 Multilevel / Underground (MLCP)
                  </label>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats & Results Summary Row */}
        <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Showing <span style={{ color: 'var(--accent-primary)' }}>{filtered.length}</span> of {processedLocations.length} locations
            </span>
            {activeFilterCount > 0 && (
              <span style={{ fontSize: '0.7rem', background: 'rgba(250, 255, 0, 0.12)', color: 'var(--accent-primary)', padding: '2px 6px', borderRadius: '8px', fontWeight: 700 }}>
                Filtered ({activeFilterCount})
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {[{ label: 'Total Slots', value: filtered.reduce((a, p) => a + (p.totalSlots || 0), 0) },
              { label: 'Available', value: filtered.reduce((a, p) => a + (p.availableSlots || 0), 0) }
            ].map((st) => (
              <div key={st.label} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                {st.label}: <span style={{ color: '#fff' }}>{st.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Location Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filtered.map((loc) => {
            const total = loc.totalSlots;
            const dynamicAvailable = loc.availableSlots;
            const avColor = availabilityColor(dynamicAvailable, total);
            const pct = (total && total > 0 && dynamicAvailable !== null) ? Math.round((dynamicAvailable / total) * 100) : 0;
            const displayPrice = loc.hourlyPrice !== null && loc.hourlyPrice !== undefined ? `₹${loc.hourlyPrice}` : null;

            return (
              <motion.div
                key={loc.id}
                variants={itemVariants}
                whileHover={{ y: -2, scale: 1.002 }}
                onHoverStart={() => setHoveredId(loc.id)}
                onHoverEnd={() => setHoveredId(null)}
                onClick={() => navigate('/slot-layout', { state: { location: loc } })}
                className="glass-panel parking-card"
                style={{
                  padding: '18px 20px', cursor: 'pointer', overflow: 'hidden', position: 'relative',
                  border: hoveredId === loc.id ? `1.5px solid ${loc.color}77` : '1px solid var(--glass-border)',
                  transition: 'all 0.2s ease',
                  borderRadius: '18px'
                }}
              >
                {/* Color accent bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                  background: `linear-gradient(90deg, ${loc.color}, transparent)`,
                }} />

                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }} className="parking-card-inner">
                  
                  {/* Facility Icon */}
                  <div style={{
                    width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
                    background: `${loc.color}18`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', border: `1.5px solid ${loc.color}33`,
                  }} className="parking-card-icon">
                    <Car size={22} color={loc.color} />
                  </div>

                  {/* Info Block */}
                  <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                    
                    {/* Header Row: Title & Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }} className="parking-card-header">
                      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, lineHeight: 1.25 }} className="parking-card-title">
                        {loc.name}
                      </h2>

                      {/* Status Badge */}
                      <div 
                        className="parking-card-badge"
                        style={{
                          padding: '3px 8px', borderRadius: 'var(--radius-pill)', fontSize: '0.68rem',
                          fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: 0,
                          background: `${loc.color}22`, color: loc.color, border: `1px solid ${loc.color}44`,
                          display: 'flex', alignItems: 'center', gap: '3px'
                        }}
                      >
                        {loc.status === 'Restricted' && <AlertTriangle size={11} />}
                        {loc.badge}
                      </div>
                    </div>
                    
                    {/* Full Address & Distance */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '8px', flexWrap: 'wrap' }} className="parking-card-address">
                      <MapPin size={13} style={{ flexShrink: 0, marginTop: '3px' }} />
                      <span className="parking-card-address-text" style={{ wordBreak: 'break-word', flex: 1, lineHeight: 1.35 }}>
                        {loc.address}
                      </span>
                      <span style={{ padding: '2px 7px', borderRadius: '8px', background: 'var(--bg-secondary)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-secondary)', flexShrink: 0 }}>
                        {getDistanceText(loc)}
                      </span>
                    </div>

                    {/* RESTRICTED STATUS WARNING BANNER */}
                    {loc.status === 'Restricted' && (
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#ff4b4b', borderRadius: '10px', padding: '8px 10px', marginBottom: '8px',
                        fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: '6px'
                      }}>
                        <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong>RESTRICTED ACCESS:</strong> ~90% capacity utilized for dealership vehicle storage. Limited public slots available.
                        </div>
                      </div>
                    )}

                    {/* PENDING STATUS WARNING BANNER */}
                    {loc.status === 'Pending' && (
                      <div style={{
                        background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)',
                        color: '#FFAD00', borderRadius: '10px', padding: '8px 10px', marginBottom: '8px',
                        fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: '6px'
                      }}>
                        <Clock size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong>OPERATIONAL PENDING:</strong> Facility inaugurated but operational status pending final municipal verification.
                        </div>
                      </div>
                    )}

                    {/* Availability Bar */}
                    <div style={{ marginBottom: '8px' }} className="parking-card-avail">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Availability</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: avColor }}>
                          {total !== null && dynamicAvailable !== null ? `${dynamicAvailable}/${total} slots` : (total !== null ? `${total} Total Slots` : 'Unverified')}
                        </span>
                      </div>
                      {total !== null && dynamicAvailable !== null && (
                        <div style={{ height: '5px', borderRadius: '3px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
                            style={{ height: '100%', borderRadius: '3px', background: avColor }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Features & Action */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '6px' }} className="parking-card-bottom">
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }} className="parking-card-features">
                        {(loc.features || []).slice(0, 3).map((f) => (
                          <span key={f} style={{
                            fontSize: '0.68rem', fontWeight: 600, padding: '2px 7px',
                            borderRadius: '6px', background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)', border: '1px solid var(--glass-border)',
                          }}>{f}</span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }} className="parking-card-actions">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Star size={13} color="#FFCE00" fill="#FFCE00" />
                            <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{loc.rating}</span>
                          </div>
                          <span style={{ fontSize: '1rem', fontWeight: 900, color: displayPrice ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                            {displayPrice ? `${displayPrice}/hr` : 'Unverified'}
                          </span>
                        </div>

                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '3px', padding: '5px 12px',
                          borderRadius: '10px', background: `${loc.color}18`, border: `1px solid ${loc.color}35`,
                          color: loc.color, fontWeight: 800, fontSize: '0.8rem', flexShrink: 0
                        }}>
                          {loc.status === 'Restricted' ? 'View' : 'Slots'} <ChevronRight size={13} />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filtered.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ type: 'spring', stiffness: 100 }}
            className="glass-panel"
            style={{ 
              textAlign: 'center', 
              padding: '40px 20px', 
              borderRadius: '18px', 
              border: '1px solid var(--glass-border)',
              background: 'rgba(255, 255, 255, 0.01)',
              boxShadow: '0 16px 36px rgba(0,0,0,0.15)',
              maxWidth: '500px',
              margin: '28px auto 0',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🚗💨</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>
              No Facilities Found 🔎
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto 16px', lineHeight: 1.4, fontSize: '0.85rem' }}>
              No parking facilities matched your selected search or filter criteria. Try adjusting your filters.
            </p>
            <button
              onClick={resetFilters}
              style={{
                background: 'var(--accent-primary)', color: '#000', border: 'none',
                padding: '9px 18px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem'
              }}
            >
              Reset All Filters
            </button>
          </motion.div>
        )}

        {/* Dynamic Advertisement Carousel */}
        <div style={{ marginTop: '20px', width: '100%' }}>
          <AdCarousel />
        </div>

        {loading && (
           <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <video 
                src={loadingCar} 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="loader-video"
                style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px' }} 
              />
              <p style={{ color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '1.2px', fontSize: '0.8rem' }}>CONNECTING TO PARKING...</p>
           </div>
        )}
      </div>
    </motion.div>
  );
};

export default ParkingList;
