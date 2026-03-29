import React from 'react';
import { Map, ArrowRight, Search } from 'lucide-react';
import FadeIn from '../common/FadeIn';
import AnimatedParkingHero from '../animations/AnimatedParkingHero';

const HeroSection = () => {
  return (
    <section id="hero" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: '100px',
      paddingBottom: '40px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="container">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr',
          gap: '40px', 
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }} className="hero-grid-responsive">
          <style>{`
            @media (min-width: 1025px) {
              .hero-grid-responsive {
                grid-template-columns: 1fr 1fr !important;
                gap: 80px !important;
              }
            }
            @media (max-width: 768px) {
              .hero-content {
                text-align: center;
              }
              .hero-buttons {
                justify-content: center;
                flex-direction: column;
              }
            }
          `}</style>

          <FadeIn className="hero-content">
            <div style={{ display: 'inline-block', padding: '8px 16px', borderRadius: '100px', background: 'var(--glass-bg)', border: '1px solid var(--accent-primary)', marginBottom: '24px', color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.8rem' }}>
              The Future of Urban Mobility
            </div>

            <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px' }}>
              Smart Parking, <br />
              Zero <span className="text-gradient">Headache.</span>
            </h1>

            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '40px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }} className="hero-desc">
              Drivix is an AI-powered smart parking platform. Book slots in advance and let our ANPR cameras handle your secure entry.
            </p>
            <style>{`
              @media (min-width: 1025px) {
                .hero-desc { margin-left: 0 !important; margin-right: 0 !important; }
              }
            `}</style>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }} className="hero-buttons">
              <button
                 onClick={() => window.location.href = '/slot-layout'}
                 className="btn btn-primary"
                 style={{ width: '100%', maxWidth: '240px' }}
              >
                Book Now <ArrowRight size={20} />
              </button>
              <button
                onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                className="btn btn-secondary"
                style={{ width: '100%', maxWidth: '240px' }}
              >
                See Features
              </button>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
              <AnimatedParkingHero />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
