import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Map, ArrowRight, Search } from 'lucide-react';
import FadeIn from '../common/FadeIn';
import heroImage from '../../assets/HeroSection.png';
import { useUser } from '../../hooks/useUser';
import { API_BASE_URL } from '../../config';



const HeroSection = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('parking'); // 'parking' | 'challan' | 'fastag'
  const [vehicleNumber, setVehicleNumber] = React.useState('');
  const [stats, setStats] = React.useState({ users: 0, facilities: 0 });

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
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, []);

  const TABS = [
    { id: 'parking', label: 'Parking', placeholder: 'Enter City, Mall or Building' },
    { id: 'challan', label: 'Challan', placeholder: 'Enter Vehicle Number' },
    { id: 'fastag', label: 'FASTag', placeholder: 'Enter Vehicle Number' }
  ];

  const handleSearch = () => {
    if (!vehicleNumber.trim()) return;
    if (activeTab === 'parking') navigate('/find');
    else if (activeTab === 'challan') navigate('/admin/complaints'); // Example redirect
    else if (activeTab === 'fastag') navigate('/services');
  };

  return (
    <section id="hero" style={{
      display: 'flex',
      alignItems: 'center',
      paddingTop: 'clamp(120px, 15vh, 180px)',
      paddingBottom: '60px',
      position: 'relative',
      overflow: 'hidden',
      background: 'radial-gradient(circle at 15% 50%, rgba(250, 255, 0, 0.03) 0%, transparent 50%)'
    }}>
      <div className="container" style={{ width: '100%', maxWidth: '1440px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '40px',
          alignItems: 'center',
          textAlign: 'left'
        }} className="hero-grid-updated">
          <style>{`
            .hero-search-container {
              margin-left: 0;
              margin-right: auto;
              transition: all 0.3s ease;
            }
            .hero-grid-updated {
              transition: all 0.3s ease;
            }
            .hero-image-container {
              transition: all 0.3s ease;
            }
            
            /* Mobile Viewports (< 768px) */
            @media (max-width: 767.98px) {
              #hero {
                padding-top: 100px !important;
                padding-bottom: 24px !important;
              }
              .hero-grid-updated {
                grid-template-columns: 1fr !important;
                text-align: center !important;
                gap: 16px !important;
              }
              .hero-image-container {
                display: none !important;
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
                margin-bottom: 24px !important;
              }
              .hero-search-container {
                margin-left: auto !important;
                margin-right: auto !important;
                margin-bottom: 24px !important;
              }
              .hero-stat-container {
                justify-content: center !important;
                gap: 24px !important;
              }
            }

            /* Tablet Viewports (>= 768px) */
            @media (min-width: 768px) {
              .hero-grid-updated {
                grid-template-columns: 1.1fr 0.9fr !important;
                gap: 40px !important;
              }
              .hero-image-container {
                display: flex !important;
              }
            }

            /* Desktop Viewports (>= 1024px) */
            @media (min-width: 1024px) {
              .hero-grid-updated {
                grid-template-columns: 1.1fr 0.9fr !important;
                gap: 80px !important;
              }
            }

            .hero-tab-active {
              color: var(--accent-primary) !important;
              background: rgba(250, 255, 0, 0.1) !important;
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

            {/* Functional Search Center */}
            <div className="glass-panel hero-search-container" style={{ 
              padding: '8px', 
              borderRadius: '24px', 
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)',
              width: '100%',
              maxWidth: '540px',
              marginBottom: '48px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1,
                      padding: '12px 10px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '16px',
                      color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {tab.label}
                    {activeTab === tab.id && <motion.div layoutId="tab-underline" style={{ width: '12px', height: '3px', background: 'var(--accent-primary)', borderRadius: '2px' }} />}
                  </button>
                ))}
              </div>
              
              {/* SearchBar */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '8px 8px 8px 20px', 
                background: 'var(--bg-primary)', 
                borderRadius: '18px',
                border: '1px solid var(--glass-border-light)'
              }}>
                <Search size={18} color="var(--text-muted)" />
                <input 
                  type="text" 
                  placeholder={TABS.find(t => t.id === activeTab).placeholder}
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    minWidth: 0
                  }}
                />
                <button 
                  onClick={handleSearch}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', borderRadius: '14px', fontSize: '0.85rem' }}
                >
                  Go
                </button>
              </div>
            </div>

            {/* Credibility Stat */}
            <div style={{ display: 'flex', gap: '40px' }} className="hero-stat-container">
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {stats.users > 0 ? `${stats.users}` : '0'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>Happy Users</div>
              </div>
              <div style={{ width: '1px', background: 'var(--glass-border)', height: '32px', alignSelf: 'center' }} />
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {stats.facilities > 0 ? `${stats.facilities}` : '0'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>Facilities</div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2} className="hero-image-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <div style={{ 
              position: 'relative', 
              width: '100%', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              transform: 'scale(1.15)', // Make it bigger
            }}>
              <div style={{ position: 'absolute', right: '-10%', top: '0', width: '120%', height: '120%', background: 'radial-gradient(circle at center, var(--accent-primary) 0%, transparent 60%)', opacity: 0.1, filter: 'blur(100px)', zIndex: 0 }} />
              
              <img 
                src={heroImage} 
                alt="Smart Parking Facility" 
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  objectFit: 'contain', 
                  position: 'relative', 
                  zIndex: 1,
                  display: 'block'
                }} 
              />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
