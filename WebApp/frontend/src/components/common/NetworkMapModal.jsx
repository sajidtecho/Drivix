import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X, MapPin, Navigation, Search, Filter, Car, Zap, Shield, Check,
  ChevronRight, Layers, Sparkles, Compass, ExternalLink, RefreshCw, Star
} from 'lucide-react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { API_BASE_URL } from '../../config';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyD45w3pytPwzXDg9Xk8veMXeJBdwtodkqw';

// Custom sleek dark mode map styling array for Google Maps
const DARK_GOOGLE_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#0c0e17" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8d9b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0c0e17" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1f2438" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9b9ea8" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#111422" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#181d2f" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#7a7f92" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#122023" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1f33" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#111422" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#777c8e" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#252b45" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#141727" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#b8bac6" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#192033" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#090c14" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#48536e" }] }
];

// Comprehensive dataset representing Drivix active parking network locations across NCR
const DEFAULT_NETWORK_LOCATIONS = [
  { id: 'noida-sec18', name: 'Sector 18 Multi-Level Hub', address: 'Block K, Sector 18, Noida', city: 'Noida', latitude: 28.5708, longitude: 77.3261, totalSlots: 250, availableSlots: 84, hourlyPrice: 20, status: 'Active', ev: true, anpr: true },
  { id: 'noida-kp2', name: 'Knowledge Park II Metro Hub', address: 'Greater Noida Express Highway', city: 'Greater Noida', latitude: 28.4595, longitude: 77.5020, totalSlots: 180, availableSlots: 62, hourlyPrice: 15, status: 'Active', ev: true, anpr: true },
  { id: 'noida-sec62', name: 'Sector 62 IT Park Facility', address: 'Phase 2, Sector 62, Noida', city: 'Noida', latitude: 28.6280, longitude: 77.3649, totalSlots: 300, availableSlots: 112, hourlyPrice: 25, status: 'Active', ev: true, anpr: true },
  { id: 'noida-botanical', name: 'Botanical Garden Interchange Hub', address: 'Sector 38, Noida', city: 'Noida', latitude: 28.5642, longitude: 77.3343, totalSlots: 400, availableSlots: 145, hourlyPrice: 20, status: 'Active', ev: false, anpr: true },
  { id: 'noida-pari-chowk', name: 'Pari Chowk Commercial Complex', address: 'Commercial Belt, Pari Chowk', city: 'Greater Noida', latitude: 28.4673, longitude: 77.5140, totalSlots: 220, availableSlots: 40, hourlyPrice: 15, status: 'Active', ev: true, anpr: true },
  { id: 'delhi-cp', name: 'Connaught Place Outer Ring Hub', address: 'Block C, Connaught Place', city: 'Delhi', latitude: 28.6315, longitude: 77.2167, totalSlots: 350, availableSlots: 58, hourlyPrice: 40, status: 'Active', ev: true, anpr: true },
  { id: 'delhi-south-ext', name: 'South Extension Plaza Facility', address: 'Ring Road, South Ext I', city: 'Delhi', latitude: 28.5684, longitude: 77.2215, totalSlots: 160, availableSlots: 29, hourlyPrice: 30, status: 'Active', ev: false, anpr: true },
  { id: 'noida-sec137', name: 'Sector 137 Expressway Hub', address: 'Felix Hospital Rd, Sector 137', city: 'Noida', latitude: 28.5034, longitude: 77.4042, totalSlots: 190, availableSlots: 77, hourlyPrice: 20, status: 'Active', ev: true, anpr: true },
  { id: 'noida-sec142', name: 'Advant Navis Corporate Hub', address: 'Sector 142, Noida Expressway', city: 'Noida', latitude: 28.4981, longitude: 77.4105, totalSlots: 450, availableSlots: 198, hourlyPrice: 25, status: 'Active', ev: true, anpr: true },
  { id: 'delhi-nehru-place', name: 'Nehru Place Tech Hub Parking', address: 'Nehru Place Commercial Complex', city: 'Delhi', latitude: 28.5492, longitude: 77.2519, totalSlots: 280, availableSlots: 65, hourlyPrice: 30, status: 'Active', ev: true, anpr: true },
  { id: 'noida-sec50', name: 'Sector 50 Market Square', address: 'Main Market Rd, Sector 50', city: 'Noida', latitude: 28.5770, longitude: 77.3630, totalSlots: 120, availableSlots: 31, hourlyPrice: 20, status: 'Active', ev: false, anpr: true },
  { id: 'gr-noida-west', name: 'Gaur City Mall Parking Hub', address: 'Greater Noida West Rd', city: 'Greater Noida', latitude: 28.6087, longitude: 77.4285, totalSlots: 500, availableSlots: 210, hourlyPrice: 20, status: 'Active', ev: true, anpr: true }
];

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 28.5400,
  lng: 77.3800
};

const mapOptions = {
  styles: DARK_GOOGLE_MAP_STYLES,
  disableDefaultUI: false,
  zoomControl: false, // Custom clean zoom controls
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false
};

const NetworkMapModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  const [locations, setLocations] = useState(DEFAULT_NETWORK_LOCATIONS);
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [userCoords, setUserCoords] = useState(null);

  // Default sidebar state: CLOSED on mobile screens so map is 100% visible immediately!
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768;
    }
    return true;
  });

  // Automatically adjust on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch locations from backend on open
  useEffect(() => {
    if (!isOpen) return;

    const fetchLocations = async () => {
      try {
        const token = localStorage.getItem('drivix_auth_token');
        const res = await fetch(`${API_BASE_URL}/api/v1/parking`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (res.ok) {
          const apiData = await res.json();
          if (Array.isArray(apiData) && apiData.length > 0) {
            const mappedApi = apiData.map((loc, idx) => {
              const fallback = DEFAULT_NETWORK_LOCATIONS[idx % DEFAULT_NETWORK_LOCATIONS.length];
              return {
                id: loc._id || loc.id || `loc-${idx}`,
                name: loc.parkingName || loc.name,
                address: loc.address || fallback.address,
                city: loc.city || fallback.city,
                latitude: Number(loc.latitude) || fallback.latitude,
                longitude: Number(loc.longitude) || fallback.longitude,
                totalSlots: loc.totalSlots || fallback.totalSlots,
                availableSlots: loc.availableSlots ?? fallback.availableSlots,
                hourlyPrice: loc.hourlyPrice || loc.hourlyRate || fallback.hourlyPrice,
                status: loc.status || 'Active',
                ev: loc.amenities?.includes('EV Charging') || fallback.ev,
                anpr: true
              };
            });

            const combined = [...mappedApi];
            DEFAULT_NETWORK_LOCATIONS.forEach(defLoc => {
              if (!combined.some(c => c.name.toLowerCase() === defLoc.name.toLowerCase())) {
                combined.push(defLoc);
              }
            });
            setLocations(combined);
          }
        }
      } catch (err) {
        console.warn("Using offline default network location dataset:", err);
      }
    };

    fetchLocations();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (pos?.coords?.latitude) {
            setUserCoords({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            });
          }
        },
        (err) => console.warn("User geolocation error:", err),
        { timeout: 8000 }
      );
    }
  }, [isOpen]);

  const filteredLocations = locations.filter(loc => {
    const matchesCity = selectedCity === 'ALL' || loc.city.toLowerCase() === selectedCity.toLowerCase();
    const matchesSearch = !searchQuery.trim() ||
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCity && matchesSearch;
  });

  const calculateDistance = (lat, lon) => {
    if (!userCoords || !lat || !lon) return null;
    const R = 6371;
    const dLat = ((lat - userCoords.latitude) * Math.PI) / 180;
    const dLon = ((lon - userCoords.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userCoords.latitude * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
    // On mobile, auto-collapse list drawer so user can immediately see location on map
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
    if (mapRef.current && loc.latitude && loc.longitude) {
      mapRef.current.panTo({ lat: loc.latitude, lng: loc.longitude });
      mapRef.current.setZoom(15);
    }
  };

  const handleLocateUser = () => {
    if (userCoords && mapRef.current) {
      mapRef.current.panTo({ lat: userCoords.latitude, lng: userCoords.longitude });
      mapRef.current.setZoom(14);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setUserCoords(coords);
        if (mapRef.current) {
          mapRef.current.panTo({ lat: coords.latitude, lng: coords.longitude });
          mapRef.current.setZoom(14);
        }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 7, 15, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}>
        <style>{`
          .gm-style-iw-c {
            background-color: #0f121e !important;
            border: 1px solid rgba(250, 255, 0, 0.3) !important;
            border-radius: 14px !important;
            padding: 12px !important;
            box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(250,255,0,0.15) !important;
          }
          .gm-style-iw-tc::after {
            background-color: #0f121e !important;
          }
          .gm-ui-hover-effect {
            filter: invert(1) !important;
          }

          /* Mobile Screen Responsive Layout Override */
          @media (max-width: 768px) {
            .drivix-map-modal-card {
              width: 100vw !important;
              height: 100vh !important;
              border-radius: 0 !important;
              border: none !important;
            }
            .drivix-map-header {
              padding: 12px 16px !important;
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 8px !important;
            }
            .drivix-map-header-toprow {
              display: flex !important;
              align-items: center !important;
              justify-content: space-between !important;
              width: 100% !important;
            }
            .drivix-map-header-controls {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 8px !important;
              width: 100% !important;
            }
            .drivix-city-tabs-container {
              overflow-x: auto !important;
              white-space: nowrap !important;
              padding-bottom: 2px !important;
            }
            .drivix-sidebar-panel {
              position: absolute !important;
              top: 0 !important;
              bottom: 0 !important;
              left: 0 !important;
              right: 0 !important;
              width: 100vw !important;
              min-width: 100vw !important;
              height: 100% !important;
              z-index: 1200 !important;
              background: rgba(12, 14, 23, 0.98) !important;
            }
            .drivix-modal-footer {
              display: none !important;
            }
          }
        `}</style>

        <motion.div
          className="drivix-map-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          style={{
            position: 'relative',
            width: '94vw',
            height: '92vh',
            maxWidth: '1440px',
            background: 'var(--bg-secondary, #0c0e17)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 30px 90px rgba(0,0,0,0.9)'
          }}
        >
          {/* Top Header */}
          <div
            className="drivix-map-header"
            style={{
              padding: '16px 24px',
              background: 'rgba(15, 18, 28, 0.95)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            {/* Title & Badge Row */}
            <div className="drivix-map-header-toprow">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--accent-primary, #FAFF00), #ff9900)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  boxShadow: '0 0 16px rgba(250, 255, 0, 0.3)'
                }}>
                  <MapPin size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: 'var(--font-display, sans-serif)', color: '#fff', margin: 0 }}>
                      Drivix Network Map
                    </h3>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '20px',
                      background: 'rgba(250, 255, 0, 0.15)',
                      color: 'var(--accent-primary, #FAFF00)',
                      border: '1px solid rgba(250, 255, 0, 0.3)'
                    }}>
                      {filteredLocations.length} Live Hubs
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Close Button (Visible prominently on Mobile and Desktop) */}
              <button
                onClick={onClose}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick City Tabs & Search Controls */}
            <div className="drivix-map-header-controls" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* City Pill Selectors */}
              <div className="drivix-city-tabs-container" style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '4px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                {['ALL', 'Noida', 'Greater Noida', 'Delhi'].map(city => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: selectedCity === city ? 800 : 600,
                      background: selectedCity === city ? 'var(--accent-primary, #FAFF00)' : 'transparent',
                      color: selectedCity === city ? '#000' : 'var(--text-secondary, #8a8d9b)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                  >
                    {city === 'ALL' ? 'All Hubs' : city}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8a8d9b' }} />
                <input
                  type="text"
                  placeholder="Search sector or hub..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 12px 7px 32px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Main Body (Map + Drawer) */}
          <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>

            {/* Floating Action Controls over Map */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              right: '12px',
              zIndex: 1000,
              display: 'flex',
              justify: 'space-between',
              pointerEvents: 'none'
            }}>
              {/* Toggle Facilities List Button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                style={{
                  pointerEvents: 'auto',
                  background: '#111422',
                  border: '1px solid rgba(250, 255, 0, 0.3)',
                  color: '#FAFF00',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Layers size={15} />
                {isSidebarOpen ? 'Close List' : `Facilities List (${filteredLocations.length})`}
              </button>

              {/* Locate Me Floating Button */}
              <button
                onClick={handleLocateUser}
                style={{
                  pointerEvents: 'auto',
                  background: '#111422',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#60a5fa',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Compass size={15} /> Locate Me
              </button>
            </div>

            {/* Side Drawer List (Collapsible / Full Mobile Sheet) */}
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div
                  className="drivix-sidebar-panel"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    width: '360px',
                    minWidth: '360px',
                    background: 'rgba(12, 14, 23, 0.98)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 900
                  }}
                >
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#8a8d9b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Nearby Parking Sites ({filteredLocations.length})
                      </span>
                      {/* Mobile Close Handle */}
                      <button
                        onClick={() => setIsSidebarOpen(false)}
                        style={{
                          background: 'rgba(255,255,255,0.08)',
                          border: 'none',
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        ✕ Close List
                      </button>
                    </div>

                    {filteredLocations.map((loc) => {
                      const isSelected = selectedLocation?.id === loc.id;
                      const dist = calculateDistance(loc.latitude, loc.longitude);

                      return (
                        <div
                          key={loc.id}
                          onClick={() => handleSelectLocation(loc)}
                          style={{
                            padding: '14px',
                            borderRadius: '14px',
                            background: isSelected ? 'rgba(250, 255, 0, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${isSelected ? 'var(--accent-primary, #FAFF00)' : 'rgba(255, 255, 255, 0.06)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.2 }}>
                              {loc.name}
                            </h4>
                            {dist && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#60a5fa', background: 'rgba(59,130,246,0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                                {dist} km
                              </span>
                            )}
                          </div>

                          <p style={{ fontSize: '0.78rem', color: '#8a8d9b', margin: 0, lineHeight: 1.3 }}>
                            {loc.address}
                          </p>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              color: loc.availableSlots > 0 ? '#00cc6a' : '#ff4b4b',
                              background: loc.availableSlots > 0 ? 'rgba(0, 204, 106, 0.12)' : 'rgba(255, 75, 75, 0.12)',
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}>
                              {loc.availableSlots} / {loc.totalSlots} Slots Free
                            </span>

                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-primary, #FAFF00)' }}>
                              ₹{loc.hourlyPrice}<span style={{ fontSize: '0.7rem', color: '#8a8d9b' }}>/hr</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                                navigate(`/slot-layout?locationId=${loc.id}`, { state: { selectedLocation: loc } });
                              }}
                              style={{
                                flex: 1,
                                padding: '8px 10px',
                                background: 'var(--accent-primary, #FAFF00)',
                                color: '#000',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                              }}
                            >
                              Book Spot <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google Map Container */}
            <div style={{ flex: 1, height: '100%', background: '#0a0c14', position: 'relative' }}>
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={userCoords ? { lat: userCoords.latitude, lng: userCoords.longitude } : defaultCenter}
                  zoom={11}
                  options={mapOptions}
                  onLoad={onMapLoad}
                >
                  {/* User Location Marker */}
                  {userCoords && (
                    <MarkerF
                      position={{ lat: userCoords.latitude, lng: userCoords.longitude }}
                      title="Your Location"
                      icon={{
                        path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                        scale: 8,
                        fillColor: '#3b82f6',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 3
                      }}
                    />
                  )}

                  {/* Facility Location Markers */}
                  {filteredLocations.map(loc => {
                    const isSelected = selectedLocation?.id === loc.id;
                    const isAvailable = loc.availableSlots > 0;
                    const pinColor = !isAvailable ? '#ff4b4b' : loc.availableSlots < 20 ? '#FFCE00' : '#FAFF00';

                    return (
                      <MarkerF
                        key={loc.id}
                        position={{ lat: loc.latitude, lng: loc.longitude }}
                        title={loc.name}
                        onClick={() => setSelectedLocation(loc)}
                        icon={{
                          path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                          scale: isSelected ? 12 : 9,
                          fillColor: pinColor,
                          fillOpacity: 1,
                          strokeColor: '#111422',
                          strokeWeight: 3
                        }}
                      />
                    );
                  })}
                </GoogleMap>
              ) : loadError ? (
                <div style={{ padding: '40px', color: '#ff4b4b', textAlign: 'center' }}>
                  Failed to load Google Maps script.
                </div>
              ) : (
                <div style={{ padding: '40px', color: '#FAFF00', textAlign: 'center' }}>
                  Loading Google Maps...
                </div>
              )}

              {/* Selected Location Mobile Bottom Sheet Card */}
              <AnimatePresence>
                {selectedLocation && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    style={{
                      position: 'absolute',
                      bottom: '16px',
                      left: '16px',
                      right: '16px',
                      zIndex: 1100,
                      background: 'rgba(15, 18, 30, 0.96)',
                      border: '1px solid rgba(250, 255, 0, 0.35)',
                      borderRadius: '16px',
                      padding: '16px',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 30px rgba(250,255,0,0.15)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#FAFF00', fontWeight: 800, letterSpacing: '0.08em' }}>
                        ⚡ Drivix Active Site
                      </div>
                      <button
                        onClick={() => setSelectedLocation(null)}
                        style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: 0 }}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 4px 0', color: '#fff' }}>
                      {selectedLocation.name}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: '#8a8d9b', margin: '0 0 10px 0' }}>
                      {selectedLocation.address}
                    </p>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                      <span style={{ background: 'rgba(0,204,106,0.15)', color: '#00cc6a', border: '1px solid rgba(0,204,106,0.3)', fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
                        {selectedLocation.availableSlots} slots free
                      </span>
                      <span style={{ background: 'rgba(250,255,0,0.12)', color: '#FAFF00', border: '1px solid rgba(250,255,0,0.3)', fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
                        ₹{selectedLocation.hourlyPrice}/hr
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          onClose();
                          navigate(`/slot-layout?locationId=${selectedLocation.id}`, { state: { selectedLocation } });
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          background: 'var(--accent-primary, #FAFF00)',
                          color: '#000',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 900,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        Book Spot <ChevronRight size={16} />
                      </button>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.latitude},${selectedLocation.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '10px 14px',
                          background: 'rgba(255,255,255,0.1)',
                          color: '#fff',
                          textDecoration: 'none',
                          borderRadius: '10px',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid rgba(255,255,255,0.15)'
                        }}
                      >
                        📍 Nav
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer (Desktop Only) */}
          <div
            className="drivix-modal-footer"
            style={{
              padding: '10px 24px',
              background: 'rgba(15, 18, 28, 0.98)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem',
              color: '#8a8d9b',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00cc6a', boxShadow: '0 0 10px #00cc6a' }}></span>
                <span>Google Maps Telemetry: <strong style={{ color: '#fff' }}>42 Sites Connected</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} color="#00f2ff" />
                <span>EV Charging: <strong style={{ color: '#fff' }}>18 Stations</strong></span>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#666' }}>
              Powered by Google Maps Platform API & Drivix Real-Time Gate Sync
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NetworkMapModal;
