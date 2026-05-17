import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Map, ArrowRight, Search } from 'lucide-react';
import FadeIn from '../common/FadeIn';
import AnimatedParkingHero from '../animations/AnimatedParkingHero';
import heroVideo from '../../assets/Parking-Hero section.mp4';
import heroImage from '../../assets/HeroSection.png';
import { useUser } from '../../hooks/useUser';



const HeroSection = () => {
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('parking'); // 'parking' | 'challan' | 'fastag'
  const [vehicleNumber, setVehicleNumber] = React.useState('');

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
            @media (min-width: 992px) {
              .hero-grid-updated {
                grid-template-columns: 1.1fr 0.9fr !important;
                gap: 80px !important;
              }
            }
            @media (max-width: 768px) {
              .hero-grid-updated {
                text-align: center !important;
                gap: 48px !important;
              }
              .hero-content {
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              .hero-content p {
                margin-left: auto;
                margin-right: auto;
              }
              .hero-stat-container {
                justify-content: center !important;
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
            <div className="glass-panel" style={{ 
              padding: '8px', 
              borderRadius: '24px', 
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)',
              width: '100%',
              maxWidth: '540px',
              marginBottom: '48px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              marginInline: 'auto'
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
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)' }}>1M+</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>Happy Users</div>
              </div>
              <div style={{ width: '1px', background: 'var(--glass-border)', height: '32px', alignSelf: 'center' }} />
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)' }}>500+</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>Facilities</div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2} style={{ display: 'flex', justifyContent: 'center' }} className="hero-animation-container">
            <div style={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: '700px', 
              display: 'flex', 
              justifyContent: 'center', 
              borderRadius: '24px', 
              overflow: 'hidden', 
              boxShadow: '0 30px 80px rgba(0,0,0,0.5)', 
              border: '1px solid var(--glass-border)',
              background: 'rgba(255,255,255,0.02)',
              aspectRatio: 'window.innerWidth < 768 ? "4 / 3" : "16 / 10"'
            }} className="hero-image-wrapper">
              <style>{`
                .hero-image-wrapper {
                  aspect-ratio: 16 / 10;
                }
                @media (max-width: 768px) {
                  .hero-image-wrapper {
                    aspect-ratio: 4 / 3 !important;
                    max-width: 100% !important;
                  }
                }
              `}</style>

              <div style={{ position: 'absolute', right: '-10%', top: '0', width: '120%', height: '120%', background: 'radial-gradient(circle at center, var(--accent-primary) 0%, transparent 60%)', opacity: 0.1, filter: 'blur(100px)', zIndex: 0 }} />
              
              <img 
                src={heroImage} 
                alt="Smart Parking Facility" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover', 
                  position: 'relative', 
                  zIndex: 1,
                  display: 'block'
                }} 
              />
            </div>
          </FadeIn>

              <div style={{ position: 'absolute', right: '-10%', top: '0', width: '160%', height: '160%', background: 'radial-gradient(circle at center, var(--accent-primary) 0%, transparent 60%)', opacity: 0.15, filter: 'blur(120px)', zIndex: 0 }} />
              
              <img 
                src={heroImage} 
                alt="Smart Parking Facility" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'relative', zIndex: 1 }}
              />

              {/* Keep existing media for easy fallback: 
              <video 
                src={heroVideo} 
                autoPlay 
                loop 
                muted 
                playsInline 
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'relative', zIndex: 1 }}
              />
              <AnimatedParkingHero /> 
              */}
            </div>
          </FadeIn>


          <style>{`
            @media (min-width: 769px) {
              .hero-animation-container {
                justify-content: flex-end !important;
                padding-right: 40px !important;
              }
              .hero-animation-container > div {
                justify-content: flex-end !important;
              }
            }
          `}</style>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
