import { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Tag, Search, Gavel, Car, ShieldCheck, Banknote, Wallet, MapPin, Zap, ArrowRight, Activity, Clock, Shield } from 'lucide-react';
import fastagIcon from '../../assets/fastag.png';
import FadeIn from '../common/FadeIn';
import NetworkMapModal from '../common/NetworkMapModal';

const FeaturesSection = () => {
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  return (
    <section id="features" style={{ padding: '90px 0', background: 'var(--bg-primary, #05070f)', position: 'relative', overflow: 'hidden' }}>
      {/* Background ambient lighting */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '5%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(250, 255, 0, 0.04) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 5%', position: 'relative', zIndex: 1 }}>
        
        {/* Section Header */}
        <div style={{ marginBottom: '52px', maxWidth: '680px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '30px',
            background: 'rgba(250, 255, 0, 0.08)',
            border: '1px solid rgba(250, 255, 0, 0.2)',
            color: 'var(--accent-primary, #FAFF00)',
            fontSize: '0.8rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '18px'
          }}>
            <Zap size={14} /> Smart Infrastructure
          </div>

          <h2 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
            fontWeight: 900,
            fontFamily: 'var(--font-display)',
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            marginBottom: '18px',
            color: '#fff'
          }}>
            Built for <span style={{
              background: 'linear-gradient(135deg, var(--accent-primary, #FAFF00), #ffaa00)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>human drivers</span>,<br />not just sensors.
          </h2>
          <p style={{ color: 'var(--text-secondary, #8a8d9b)', fontSize: '1.1rem', lineHeight: 1.6 }}>
            A parking ecosystem engineered to eliminate delays at every step — from smart mall gates to your corporate office tower.
          </p>
        </div>

        {/* Bento Grid Container */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gridTemplateAreas: `
            "network network secure time"
            "network network payment payment"
            "help help avail avail"
          `,
          gridAutoRows: 'minmax(140px, auto)',
          gap: '16px',
        }} className="bento-grid">
          
          <style>{`
            @media (max-width: 1024px) {
              .bento-grid { 
                grid-template-columns: repeat(2, 1fr) !important; 
                grid-template-areas: 
                  "network network"
                  "network network"
                  "secure time"
                  "payment payment"
                  "help help"
                  "avail avail"
                !important;
              }
            }
            @media (max-width: 640px) {
              .bento-grid { 
                grid-template-columns: 1fr !important;
                grid-template-areas: 
                  "network"
                  "secure"
                  "time"
                  "payment"
                  "help"
                  "avail"
                !important;
              }
            }
            .bento-card-premium {
              transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
              cursor: pointer;
              position: relative;
              overflow: hidden;
              background: rgba(14, 17, 28, 0.85);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 20px;
              backdrop-filter: blur(12px);
            }
            .bento-card-premium:hover {
              transform: translateY(-6px);
              border-color: rgba(250, 255, 0, 0.4);
              box-shadow: 0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(250,255,0,0.1);
            }
            .network-hero-card {
              background: linear-gradient(145deg, rgba(20, 25, 42, 0.95), rgba(10, 12, 22, 0.98)) !important;
              border: 1px solid rgba(250, 255, 0, 0.25) !important;
            }
            .network-hero-card:hover {
              border-color: rgba(250, 255, 0, 0.6) !important;
              box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(250,255,0,0.2) !important;
            }
            .radar-pulse {
              animation: radarPulse 3s infinite ease-out;
            }
            @keyframes radarPulse {
              0% { transform: scale(0.8); opacity: 0.8; }
              100% { transform: scale(2.2); opacity: 0; }
            }
          `}</style>

          {/* MAIN FEATURE HERO CARD: NETWORK GROWTH */}
          <div
            onClick={() => setIsMapModalOpen(true)}
            className="bento-card-premium network-hero-card"
            style={{
              gridArea: 'network',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              minHeight: '340px'
            }}
          >
            {/* Background Animated Cyber Grid & Radar Nodes */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '55%',
              opacity: 0.25,
              pointerEvents: 'none',
              overflow: 'hidden'
            }}>
              <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none">
                <circle cx="140" cy="80" r="60" stroke="#FAFF00" strokeWidth="0.8" strokeDasharray="3 3" />
                <circle cx="140" cy="80" r="40" stroke="#FAFF00" strokeWidth="0.8" />
                <circle cx="140" cy="80" r="20" stroke="#FAFF00" strokeWidth="0.8" />
                {/* Node Markers */}
                <circle cx="140" cy="80" r="5" fill="#FAFF00" />
                <circle cx="120" cy="60" r="4" fill="#00cc6a" />
                <circle cx="160" cy="95" r="4" fill="#00f2ff" />
                <circle cx="150" cy="50" r="3.5" fill="#FAFF00" />
              </svg>
            </div>

            {/* Top Badge & Live Indicator */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: 'var(--accent-primary, #FAFF00)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#00cc6a',
                    boxShadow: '0 0 10px #00cc6a'
                  }}></span>
                  Network Growth
                </div>

                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '20px',
                  background: 'rgba(0, 204, 106, 0.12)',
                  color: '#00cc6a',
                  border: '1px solid rgba(0, 204, 106, 0.25)'
                }}>
                  Live Map Telemetry
                </span>
              </div>

              {/* Stat Headline */}
              <h3 style={{
                fontSize: 'clamp(2.4rem, 4vw, 3.6rem)',
                fontWeight: 900,
                fontFamily: 'var(--font-display)',
                lineHeight: 0.95,
                marginBottom: '12px',
                color: '#fff'
              }}>
                42<span style={{ fontSize: '1.8rem', color: 'var(--accent-primary, #FAFF00)' }}>+</span>
                <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-secondary, #8a8d9b)', marginTop: '4px' }}>
                  Smart Hubs & Counting
                </span>
              </h3>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary, #8a8d9b)', maxWidth: '280px', lineHeight: 1.4, marginBottom: '20px' }}>
                From Sector 18 & Knowledge Park II to Connaught Place — active coverage across major commercial hubs.
              </p>

              {/* Tag Cloud of Key Locations */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {['Sector 18', 'Knowledge Park II', 'Connaught Place', 'Sector 62'].map((tag) => (
                  <span key={tag} style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#c5c8d4',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    📍 {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* High-Impact CTA Button */}
            <div style={{ marginTop: '12px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMapModalOpen(true);
                }}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  background: 'var(--accent-primary, #FAFF00)',
                  color: '#000',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 25px rgba(250, 255, 0, 0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                <MapPin size={18} strokeWidth={2.5} /> See Live Network Map <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* ANPR SECURE CARD */}
          <div className="bento-card-premium" style={{
            gridArea: 'secure',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(0, 242, 255, 0.12)',
                  border: '1px solid rgba(0, 242, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00f2ff'
                }}>
                  <ShieldCheck size={22} />
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#00f2ff', background: 'rgba(0, 242, 255, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(0, 242, 255, 0.2)' }}>
                  Live ANPR
                </span>
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>ANPR Gate Secure</h4>
              <p style={{ color: 'var(--text-secondary, #8a8d9b)', fontSize: '0.84rem', lineHeight: 1.4, margin: 0 }}>
                High-speed camera entry. Automatic license plate matching — zero physical tickets.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.72rem', fontWeight: 800, color: '#00f2ff' }}>
              <span>📹 4K AI Camera Entry</span>
            </div>
          </div>

          {/* TIME SAVED CARD */}
          <div className="bento-card-premium" style={{
            gridArea: 'time',
            padding: '22px',
            background: 'rgba(255, 170, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <Clock size={20} color="#ffaa00" />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ffaa00', background: 'rgba(255, 170, 0, 0.12)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(255, 170, 0, 0.25)' }}>
                  Speed Metric
                </span>
              </div>
              <div style={{
                fontSize: '2.4rem',
                fontWeight: 900,
                fontFamily: 'var(--font-display)',
                color: '#ffaa00',
                lineHeight: 1,
                marginBottom: '6px'
              }}>
                3 min
              </div>
              <p style={{ color: 'var(--text-secondary, #8a8d9b)', fontSize: '0.84rem', fontWeight: 600, lineHeight: 1.3, margin: 0 }}>
                Avg. search time saved per session vs. standard parking.
              </p>
            </div>

            {/* Bottom Progress Bar to eliminate empty space */}
            <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,170,0,0.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ffaa00' }}>Efficiency Boost</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#fff' }}>85% Faster</span>
              </div>
              <div style={{ width: '100%', height: '5px', background: 'rgba(255,170,0,0.15)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '85%', height: '100%', background: '#ffaa00', boxShadow: '0 0 10px #ffaa00', borderRadius: '3px' }}></div>
              </div>
            </div>
          </div>

          {/* ZERO-FRICTION PAYMENTS CARD */}
          <div className="bento-card-premium" style={{ gridArea: 'payment', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{
              padding: '12px',
              borderRadius: '16px',
              background: 'rgba(250, 255, 0, 0.1)',
              border: '1px solid rgba(250, 255, 0, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px'
            }}>
              <img src={fastagIcon} alt="FASTag" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-primary, #FAFF00)', textTransform: 'uppercase', marginBottom: '2px' }}>
                Instant Toll & Barrier
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>Zero-Friction FASTag</h4>
              <p style={{ color: 'var(--text-secondary, #8a8d9b)', fontSize: '0.88rem', lineHeight: 1.4 }}>
                One-tap FASTag sync means seamless boom barrier exit without manual payments.
              </p>
            </div>
          </div>

          {/* NEED INSURANCE HELP CARD */}
          <div className="bento-card-premium" style={{ gridArea: 'help', padding: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>Need Insurance Cover?</h4>
              <p style={{ color: 'var(--text-secondary, #8a8d9b)', fontSize: '0.84rem' }}>Partnered quotes for instant vehicle protection.</p>
            </div>
            <button style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}>
              Explore
            </button>
          </div>

          {/* AVAILABLE 24/7 CARD */}
          <div className="bento-card-premium" style={{ gridArea: 'avail', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>Available 24/7</h4>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#00cc6a', background: 'rgba(0,204,106,0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                100% Live
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{
                  flex: 1, height: '36px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {i < 5 && (
                    <motion.div
                      initial={{ width: '0%' }}
                      whileInView={{ width: '100%' }}
                      transition={{
                        delay: i * 0.12,
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1]
                      }}
                      viewport={{ once: false }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        background: 'var(--accent-primary, #FAFF00)',
                        boxShadow: '0 0 12px var(--accent-glow)'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            <p style={{ marginTop: '10px', color: 'var(--text-secondary, #8a8d9b)', fontSize: '0.8rem' }}>
              Real-time slot availability monitoring across all active zones.
            </p>
          </div>

        </div>
      </div>

      {/* Interactive Parking Network Map Modal */}
      <NetworkMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
      />
    </section>
  );
};

export default FeaturesSection;
