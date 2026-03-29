import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, ArrowRight, Search } from 'lucide-react';
import FadeIn from '../common/FadeIn';
import AnimatedParkingHero from '../animations/AnimatedParkingHero';

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section id="hero" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      paddingTop: '112px',
      paddingBottom: '40px',
      position: 'relative',
      overflow: 'hidden',
      background: 'radial-gradient(circle at 15% 50%, rgba(250, 255, 0, 0.03) 0%, transparent 50%)'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '60px',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto',
          textAlign: 'left'
        }} className="hero-grid-updated">
          <style>{`
            @media (min-width: 769px) {
              .hero-grid-updated {
                grid-template-columns: 1.4fr 1fr !important;
                gap: 60px !important;
              }
            }
            @media (min-width: 1200px) {
              .hero-grid-updated {
                gap: 100px !important;
              }
            }
          `}</style>

          <FadeIn className="hero-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 10px var(--accent-primary)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent-primary)' }}>
                India, Noida— Sharda University
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.5rem, 8vw, 4.8rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '20px',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.04em',
              maxWidth: '900px'
            }}>
              Find a <span style={{ color: 'var(--accent-primary)' }}>spot</span> before you even leave.
            </h1>

            <p style={{
              fontSize: '1.25rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginBottom: '32px',
              maxWidth: '520px',
              fontWeight: 500
            }}>
              Stop circling. Secure your spot in Sector 18 and Knowledge Parks with real-time AI before you even hit the road.
            </p>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '40px', flexWrap: 'wrap' }} className="hero-buttons">
              <button
                onClick={() => navigate('/find')}
                className="btn btn-primary"
                style={{ padding: '20px 40px', fontSize: '1.1rem', background: 'var(--accent-primary)' }}
              >
                Secure Your Slot
              </button>
              <button
                onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-primary)',
                  fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                  fontSize: '1rem', borderBottom: '2px solid var(--accent-primary)', paddingBottom: '4px'
                }}
              >
                See how it works →
              </button>
            </div>

            {/* Credibility Stat */}
            <div style={{ display: 'flex', gap: '40px', borderTop: '1px solid var(--glass-border)', paddingTop: '32px' }}>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>3.2m</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Minutes Saved</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>42+</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>MLP Facilities</div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2} className="desktop-only" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', width: '100%', marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ position: 'absolute', right: '-10%', top: '0', width: '120%', height: '120%', background: 'radial-gradient(circle at center, var(--accent-primary) 0%, transparent 60%)', opacity: 0.05, filter: 'blur(100px)' }} />
              <AnimatedParkingHero />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
