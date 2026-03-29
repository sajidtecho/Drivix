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
      paddingTop: '120px',
      position: 'relative'
    }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: '60px', alignItems: 'center', width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '0 5%' }}>
        <FadeIn>
          <div style={{ display: 'inline-block', padding: '8px 16px', borderRadius: '100px', background: 'var(--glass-bg)', border: '1px solid var(--accent-primary)', marginBottom: '24px', color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
            The Future of Urban Mobility
          </div>

          <h1 style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px' }}>
            Smart Parking, <br />
            Zero <span className="text-gradient">Headache.</span>
          </h1>

          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '40px', maxWidth: '500px' }}>
            Drivix is an AI-powered smart parking platform. Book slots in advance, navigate seamlessly, and let our ANPR cameras handle your secure entry.
          </p>

          <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
            <button
               onClick={() => window.location.href = '/slot-layout'}
               className="btn btn-primary"
               style={{ padding: '18px 36px', fontSize: '1.1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              Book Slot Now <ArrowRight size={22} />
            </button>
            <button
              onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
              className="btn btn-secondary"
              style={{ padding: '18px 36px', fontSize: '1.1rem', borderRadius: '16px' }}
            >
              See Features
            </button>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <AnimatedParkingHero />
        </FadeIn>
      </div>
    </section>
  );
};

export default HeroSection;
