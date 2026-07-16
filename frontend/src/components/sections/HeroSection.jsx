import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, ArrowRight, Search, X, Check, CreditCard, AlertTriangle, DollarSign } from 'lucide-react';
import FadeIn from '../common/FadeIn';
import { useUser } from '../../hooks/useUser';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';

const HeroSection = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useUser();
  const [activeTab, setActiveTab] = React.useState('parking'); // 'parking' | 'challan' | 'fastag'
  const [vehicleNumber, setVehicleNumber] = React.useState('');
  const [stats, setStats] = React.useState({ users: 0, facilities: 0 });

  // Mock search states
  const [searchResult, setSearchResult] = React.useState(null);
  const [rechargeAmount, setRechargeAmount] = React.useState('');
  const [isProcessingAction, setIsProcessingAction] = React.useState(false);

  // New UI / animation states
  const [isSearching, setIsSearching] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [ripples, setRipples] = React.useState([]);

  // Auto-populate vehicle number from user profile
  React.useEffect(() => {
    if (user && user.vehicles && user.vehicles.length > 0) {
      const primary = user.vehicles.find(v => v.isPrimary) || user.vehicles[0];
      if (primary && primary.plate) {
        setVehicleNumber(primary.plate.toUpperCase());
      }
    }
  }, [user]);

  // Card hover tilt states
  const cardRef = React.useRef(null);
  const [coords, setCoords] = React.useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState(false);
  const [rotateX, setRotateX] = React.useState(0);
  const [rotateY, setRotateY] = React.useState(0);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/public-stats`);
        if (res.ok) {
          const data = await res.json();
          setStats({
            users: data.users || 0,
            facilities: data.facilities || 0
          });
        }
      } catch (err) {
        console.error("Failed to fetch public stats:", err);
      }
    };
    fetchStats();
  }, []);

  const TABS = [
    { id: 'parking', label: 'Book Slot', placeholder: 'Search parking locations...' },
    { id: 'challan', label: 'E-Challan', placeholder: 'Enter Vehicle Number' },
    { id: 'fastag', label: 'FASTag', placeholder: 'Enter FASTag Number' }
  ];

  const handleSearch = async () => {
    const query = vehicleNumber.trim();
    if (!query) return;

    if (activeTab === 'challan' || activeTab === 'fastag') {
      if (!/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/i.test(query.replace(/\s/g, ''))) {
        showToast("Please enter a valid vehicle number (e.g. UP32AB1234)", "error");
        return;
      }
    }

    setIsSearching(true);
    // Simulate high-tech database lookup
    await new Promise(resolve => setTimeout(resolve, 1200));
    setIsSearching(false);

    if (activeTab === 'parking') {
      navigate('/find');
    } else if (activeTab === 'challan') {
      setSearchResult({
        type: 'challan',
        vehicle: query.toUpperCase().replace(/\s/g, ''),
        owner: 'Sajid Ahmad',
        challans: [
          { id: 'CH-9827', offense: 'Over-speeding on Noida Expressway', amount: 1000, status: 'unpaid', date: '2026-07-12' },
          { id: 'CH-6184', offense: 'Parking in No-Parking Zone near Sector 18', amount: 500, status: 'paid', date: '2026-06-25' }
        ]
      });
    } else if (activeTab === 'fastag') {
      setSearchResult({
        type: 'fastag',
        vehicle: query.toUpperCase().replace(/\s/g, ''),
        provider: 'HDFC Bank FASTag',
        balance: 450,
        status: 'Active',
        transactions: [
          { id: 'TXN-1029', location: 'Jewar Toll Plaza (Yamuna Expressway)', amount: 150, date: 'Today, 14:22' },
          { id: 'TXN-0938', location: 'DND Flyway (Noida-Delhi)', amount: 30, date: 'Yesterday, 09:15' }
        ]
      });
    }
  };

  const handleButtonClick = (e) => {
    if (isSearching) return;
    
    // Ripple calculation
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = {
      id: Date.now(),
      x,
      y
    };
    
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);

    handleSearch();
  };

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const normalizedX = (x / rect.width) - 0.5;
    const normalizedY = (y / rect.height) - 0.5;
    
    setRotateX(-normalizedY * 8); // Max tilt of 8 degrees
    setRotateY(normalizedX * 8);
    setCoords({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <section id="hero" style={{
      display: 'flex',
      alignItems: 'center',
      paddingTop: 'clamp(120px, 15vh, 180px)',
      paddingBottom: '80px',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--bg-primary)'
    }}>
      {/* Animated Background Gradients & Particles */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0 }}>
        {/* Floating Circle 1 */}
        <motion.div
          animate={{
            y: [0, -25, 0],
            scale: [1, 1.15, 1],
            opacity: [0.12, 0.22, 0.12]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            top: '10%',
            right: '15%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 206, 0, 0.15) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        {/* Floating Circle 2 */}
        <motion.div
          animate={{
            y: [0, 35, 0],
            scale: [1, 1.12, 1],
            opacity: [0.08, 0.15, 0.08]
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            bottom: '5%',
            left: '5%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 174, 14, 0.12) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
        {/* Floating Particle 1 */}
        <motion.div
          animate={{
            y: [0, -50, 0],
            x: [0, 25, 0],
            opacity: [0.2, 0.6, 0.2]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            top: '30%',
            left: '35%',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-primary)',
            boxShadow: '0 0 12px var(--accent-primary)',
          }}
        />
        {/* Floating Particle 2 */}
        <motion.div
          animate={{
            y: [0, 40, 0],
            x: [0, -35, 0],
            opacity: [0.15, 0.5, 0.15]
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            bottom: '25%',
            right: '35%',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-secondary)',
            boxShadow: '0 0 8px var(--accent-secondary)',
          }}
        />
        {/* Floating Particle 3 */}
        <motion.div
          animate={{
            y: [0, -35, 0],
            x: [0, -15, 0],
            opacity: [0.2, 0.7, 0.2]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            top: '15%',
            right: '25%',
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-primary)',
            boxShadow: '0 0 10px var(--accent-primary)',
          }}
        />
      </div>

      <div className="container" style={{ width: '100%', maxWidth: '1440px', zIndex: 1, position: 'relative' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '40px',
          alignItems: 'center',
          textAlign: 'left'
        }} className="hero-grid-updated">
          <style>{`
            .hero-card-container {
              margin-left: 0;
              margin-right: auto;
              transition: all 0.3s ease;
            }
            .hero-grid-updated {
              transition: all 0.3s ease;
            }
            
            /* Mobile Viewports (< 768px) */
            @media (max-width: 767.98px) {
              #hero {
                padding-top: 100px !important;
                padding-bottom: 40px !important;
              }
              .hero-grid-updated {
                grid-template-columns: 1fr !important;
                text-align: center !important;
                gap: 32px !important;
              }
              .hero-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 100%;
              }
              .hero-content p {
                margin-left: auto;
                margin-right: auto;
                margin-bottom: 32px !important;
              }
              .hero-card-container {
                margin-left: auto !important;
                margin-right: auto !important;
                width: 100% !important;
              }
              .hero-stat-container {
                justify-content: center !important;
                gap: 24px !important;
              }
            }

            /* Tablet Viewports (768px to 1023px) */
            @media (min-width: 768px) and (max-width: 1023.98px) {
              #hero {
                padding-top: 120px !important;
                padding-bottom: 50px !important;
              }
              .hero-grid-updated {
                grid-template-columns: 1fr !important;
                text-align: left !important;
                gap: 40px !important;
              }
              .hero-content {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                width: 100%;
              }
              .hero-card-container {
                margin-left: 0 !important;
                margin-right: auto !important;
                width: 100% !important;
                max-width: 520px !important;
              }
              .hero-stat-container {
                justify-content: flex-start !important;
                gap: 32px !important;
              }
            }

            /* Desktop Viewports (>= 1024px) */
            @media (min-width: 1024px) {
              .hero-grid-updated {
                grid-template-columns: 1.1fr 0.9fr !important;
                gap: 80px !important;
              }
              .hero-card-container {
                margin-left: auto !important;
                margin-right: 0 !important;
              }
            }

            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }

            @keyframes ripple-effect {
              to {
                transform: translate(-50%, -50%) scale(60);
                opacity: 0;
              }
            }
          `}</style>

          <FadeIn className="hero-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 10px var(--accent-primary)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent-primary)' }}>
                India's First Integrated Car Dashboard
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.2rem, 8vw, 4rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '20px',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.04em',
            }}>
              Don't just <span style={{ color: 'var(--accent-primary)' }}>drive</span>.<br/>Own your journey.
            </h1>

            <p style={{
              fontSize: 'clamp(1rem, 4vw, 1.15rem)',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginBottom: '40px',
              maxWidth: '520px',
              fontWeight: 500
            }}>
              Join 1M+ drivers saving time with real-time parking, automatic FASTag, and instant challan alerts.
            </p>

            {/* Credibility Stat */}
            <div style={{ display: 'flex', gap: '40px', marginTop: '10px' }} className="hero-stat-container">
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {stats.users > 0 ? `${stats.users}` : '19'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>Happy Users</div>
              </div>
              <div style={{ width: '1px', background: 'var(--glass-border)', height: '32px', alignSelf: 'center' }} />
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {stats.facilities > 0 ? `${stats.facilities}` : '2'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>Facilities</div>
              </div>
            </div>
          </FadeIn>

          {/* Premium Vertical Search Panel Card on Right Column */}
          <div className="hero-card-container" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <motion.div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={handleMouseLeave}
              initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '480px',
                borderRadius: '24px',
                padding: '32px',
                background: isHovered 
                  ? `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, rgba(255, 206, 0, 0.08), rgba(255, 255, 255, 0.03))`
                  : 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: isHovered
                  ? '1px solid rgba(255, 206, 0, 0.25)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isHovered
                  ? '0 30px 60px rgba(0,0,0,0.5), 0 0 30px rgba(255, 206, 0, 0.15)'
                  : '0 20px 40px rgba(0,0,0,0.3)',
                transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${isHovered ? -6 : 0}px)`,
                transition: 'transform 0.1s ease, border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease',
                zIndex: 1
              }}
            >
              {/* Card Glow Highlight */}
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: '24px',
                  pointerEvents: 'none',
                  border: '1px solid transparent',
                  background: `radial-gradient(250px circle at ${coords.x}px ${coords.y}px, rgba(255, 206, 0, 0.15), transparent)`,
                  mixBlendMode: 'screen',
                  zIndex: 0
                }} />
              )}
              {/* Top Glow Light Accent */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '25%',
                right: '25%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(255, 206, 0, 0.4), transparent)',
                boxShadow: '0 2px 12px 1px rgba(255, 206, 0, 0.4)',
                zIndex: 1,
                pointerEvents: 'none'
              }} />

              {/* Bottom Glow Light Accent */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: '20%',
                right: '20%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)',
                boxShadow: '0 -2px 18px 4px rgba(255, 206, 0, 0.7)',
                zIndex: 1,
                pointerEvents: 'none'
              }} />

              {/* Service Tabs */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '28px',
                zIndex: 2,
                position: 'relative'
              }}>
                {TABS.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setVehicleNumber('');
                      }}
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      style={{
                        flex: 1,
                        height: '100px',
                        background: isActive ? 'rgba(255, 206, 0, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                        border: isActive ? '1px solid rgba(255, 206, 0, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        boxShadow: isActive ? '0 0 15px rgba(255, 206, 0, 0.08)' : 'none'
                      }}
                    >
                      {/* Render Custom Icon */}
                      {tab.id === 'parking' && (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.08)',
                          color: isActive ? '#000000' : 'rgba(255, 255, 255, 0.6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.15rem',
                          fontWeight: 900,
                          transition: 'all 0.3s ease'
                        }}>
                          P
                        </div>
                      )}
                      
                      {tab.id === 'challan' && (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: isActive ? '1px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '3px',
                          padding: '4px',
                          transition: 'all 0.3s ease'
                        }}>
                          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ff4b4b', opacity: isActive ? 1 : 0.6, boxShadow: isActive ? '0 0 6px #ff4b4b' : 'none' }} />
                          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ffae0e', opacity: isActive ? 1 : 0.6, boxShadow: isActive ? '0 0 6px #ffae0e' : 'none' }} />
                          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00cc6a', opacity: isActive ? 1 : 0.6, boxShadow: isActive ? '0 0 6px #00cc6a' : 'none' }} />
                        </div>
                      )}

                      {tab.id === 'fastag' && (
                        <div style={{
                          width: '44px',
                          height: '24px',
                          borderRadius: '6px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: isActive ? '1px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '2px 4px',
                          transition: 'all 0.3s ease',
                          overflow: 'hidden'
                        }}>
                          <span style={{
                            fontSize: '0.5rem',
                            fontWeight: 900,
                            fontStyle: 'italic',
                            color: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.6)',
                            letterSpacing: '-0.02em',
                            textTransform: 'uppercase'
                          }}>
                            FASTag
                          </span>
                        </div>
                      )}

                      <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}>
                        {tab.label}
                      </span>

                      {/* Sliding underline/active bar */}
                      {isActive && (
                        <motion.div
                          layoutId="active-tab-bar"
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            width: '20px',
                            height: '3px',
                            background: 'var(--accent-primary)',
                            borderRadius: '2px'
                          }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Search Input Container */}
              <div style={{ position: 'relative', width: '100%', marginBottom: '24px', zIndex: 2 }}>
                {/* Search Icon */}
                <div style={{
                  position: 'absolute',
                  left: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  color: isFocused ? 'var(--accent-primary)' : 'var(--text-muted)',
                  transition: 'color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Search size={20} />
                </div>

                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  disabled={isSearching}
                  style={{
                    width: '100%',
                    padding: '18px 24px 18px 52px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: isFocused ? '1.5px solid var(--accent-primary)' : '1.5px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: 500,
                    outline: 'none',
                    boxShadow: isFocused ? '0 0 15px rgba(255, 206, 0, 0.15)' : 'none',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease',
                    cursor: isSearching ? 'not-allowed' : 'text',
                    textTransform: 'uppercase'
                  }}
                />

                {/* Custom Animated Placeholder */}
                {!vehicleNumber && (
                  <div style={{
                    position: 'absolute',
                    left: '52px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    fontSize: '0.95rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    zIndex: 2
                  }}>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={activeTab}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        {TABS.find(t => t.id === activeTab).placeholder}
                      </motion.span>
                    </AnimatePresence>
                    
                    {/* Blinking Cursor */}
                    {isFocused && (
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        style={{
                          width: '2px',
                          height: '1.2em',
                          backgroundColor: 'var(--accent-primary)',
                          display: 'inline-block'
                        }}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <motion.button
                  onClick={handleButtonClick}
                  disabled={isSearching}
                  whileHover={{ scale: isSearching ? 1 : 1.02, y: isSearching ? 0 : -2 }}
                  whileTap={{ scale: isSearching ? 1 : 0.98 }}
                  style={{
                    width: '100%',
                    padding: '18px 24px',
                    background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '100px', // Highly rounded capsule button matching reference
                    fontSize: '1rem',
                    fontWeight: 800,
                    cursor: isSearching ? 'wait' : 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: isHovered 
                      ? '0 12px 30px rgba(255, 206, 0, 0.4)'
                      : '0 8px 25px rgba(255, 206, 0, 0.25)',
                    transition: 'box-shadow 0.3s ease',
                  }}
                >
                  {/* Ripples */}
                  {ripples.map(ripple => (
                    <span
                      key={ripple.id}
                      style={{
                        position: 'absolute',
                        top: ripple.y,
                        left: ripple.x,
                        width: '10px',
                        height: '10px',
                        background: 'rgba(255, 255, 255, 0.5)',
                        borderRadius: '50%',
                        transform: 'translate(-50%, -50%)',
                        animation: 'ripple-effect 0.6s ease-out',
                        pointerEvents: 'none',
                        zIndex: 0
                      }}
                    />
                  ))}

                  {/* Button Contents */}
                  {isSearching ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1 }}>
                      <svg 
                        className="animate-spin" 
                        style={{ 
                          animation: 'spin 1s linear infinite', 
                          width: '18px', 
                          height: '18px', 
                          color: '#000000' 
                        }} 
                        fill="none" 
                        viewBox="0 0 24 24"
                      >
                        <circle 
                          style={{ opacity: 0.25 }} 
                          cx="12" 
                          cy="12" 
                          r="10" 
                          stroke="currentColor" 
                          strokeWidth="4"
                        />
                        <path 
                          style={{ opacity: 0.75 }} 
                          fill="currentColor" 
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>
                        {activeTab === 'parking' 
                          ? 'Finding Parking Slots...' 
                          : activeTab === 'challan' 
                          ? 'Scanning Challans...' 
                          : 'Connecting FASTag...'}
                      </span>
                    </div>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
                      {activeTab === 'parking' 
                        ? 'Search Parking' 
                        : activeTab === 'challan' 
                        ? 'Check Challans' 
                        : 'Manage FASTag'}
                      <ArrowRight size={18} />
                    </span>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>


      {/* Search Result Modal Dialog */}
      <AnimatePresence>
        {searchResult && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="glass-panel"
              style={{
                width: '100%',
                maxWidth: '500px',
                background: 'var(--bg-tertiary)',
                border: '1.5px solid var(--glass-border)',
                borderRadius: 'var(--radius-card)',
                padding: '30px',
                position: 'relative',
                boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
                textAlign: 'left'
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setSearchResult(null)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 2
                }}
              >
                <X size={16} />
              </button>

              {/* MODAL HEADER */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: searchResult.type === 'challan' ? 'rgba(255, 75, 75, 0.15)' : 'rgba(250, 255, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: searchResult.type === 'challan' ? '#ff4b4b' : 'var(--accent-primary)',
                }}>
                  {searchResult.type === 'challan' ? <AlertTriangle size={24} /> : <CreditCard size={24} />}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>
                    {searchResult.type === 'challan' ? 'E-Challan Status' : 'FASTag Details'}
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    VEHICLE: {searchResult.vehicle}
                  </p>
                </div>
              </div>

              {/* CHALLAN VIEW */}
              {searchResult.type === 'challan' && (
                <div>
                  <p style={{ fontSize: '0.9rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                    Registered Owner: <strong style={{ color: 'var(--text-primary)' }}>{searchResult.owner}</strong>
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    {searchResult.challans.map(ch => (
                      <div 
                        key={ch.id} 
                        style={{
                          padding: '14px 16px',
                          borderRadius: 'var(--radius-button)',
                          background: 'var(--bg-primary)',
                          border: '1.5px solid var(--glass-border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>{ch.id} · {ch.date}</span>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{ch.offense}</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '1rem', fontWeight: 900, color: ch.status === 'unpaid' ? '#ff4b4b' : '#00cc6a' }}>
                            ₹{ch.amount}
                          </div>
                          {ch.status === 'unpaid' ? (
                            <button
                              disabled={isProcessingAction}
                              onClick={() => handlePayChallan(ch.id)}
                              className="btn btn-primary"
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.75rem',
                                marginTop: '6px',
                                background: '#ff4b4b',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                border: 'none'
                              }}
                            >
                              {isProcessingAction ? 'Paying...' : 'Pay Now'}
                            </button>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.7rem',
                              color: '#00cc6a',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              marginTop: '6px'
                            }}>
                              <Check size={12} /> Paid
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Outstanding Balance</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: searchResult.challans.some(c => c.status === 'unpaid') ? '#ff4b4b' : '#00cc6a' }}>
                      ₹{searchResult.challans.reduce((sum, c) => c.status === 'unpaid' ? sum + c.amount : sum, 0)}
                    </span>
                  </div>
                </div>
              )}

              {/* FASTAG VIEW */}
              {searchResult.type === 'fastag' && (
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--bg-primary)',
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-button)',
                    border: '1.5px solid var(--glass-border)',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Active Balance</span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-primary)', marginTop: '2px' }}>
                        ₹{searchResult.balance.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>STATUS</span>
                      <div style={{
                        marginTop: '4px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: 'rgba(0, 204, 106, 0.12)',
                        color: '#00cc6a',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase'
                      }}>
                        {searchResult.status}
                      </div>
                    </div>
                  </div>

                  {/* Quick Recharge */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                      Quick Recharge Wallet
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-button)',
                        padding: '10px 14px'
                      }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>₹</span>
                        <input
                          type="number"
                          placeholder="Enter Amount"
                          value={rechargeAmount}
                          onChange={(e) => setRechargeAmount(e.target.value)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            width: '100%'
                          }}
                        />
                      </div>
                      <button
                        disabled={isProcessingAction}
                        onClick={handleRechargeFASTag}
                        className="btn btn-primary"
                        style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                      >
                        {isProcessingAction ? 'Processing...' : 'Recharge'}
                      </button>
                    </div>
                  </div>

                  {/* Recent Toll Transactions */}
                  <div>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '10px' }}>
                      Recent Crossings
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {searchResult.transactions.map(txn => (
                        <div 
                          key={txn.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 12px',
                            background: 'rgba(255,255,255,0.01)',
                            borderBottom: '1.5px solid var(--glass-border-light)',
                            fontSize: '0.8rem'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{txn.location}</div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{txn.date} · {txn.id}</span>
                          </div>
                          <span style={{ 
                            fontWeight: 900, 
                            color: txn.amount > 0 ? '#00cc6a' : '#ff4b4b' 
                          }}>
                            {txn.amount > 0 ? `+₹${txn.amount}` : `-₹${Math.abs(txn.amount)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default HeroSection;
