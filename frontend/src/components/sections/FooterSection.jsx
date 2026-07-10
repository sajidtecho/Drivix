import React, { useState, useEffect } from 'react';

import FadeIn from '../common/FadeIn';
import SupportModal from '../common/SupportModal';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import logoImg from '../../assets/Logo.png';




const testimonials = [
  {
    name: "Sajid Ahmad",
    role: "Daily Commuter",
    text: "Drivix saved me 40 minutes of circling every morning. I book my spot while having coffee, and it's there when I arrive."
  },
  {
    name: "Irfan Khan",
    role: "Business Owner",
    text: "Finally, a parking solution that actually works in Noida. The pre-booking feature is a game-changer for my team."
  },
  {
    name: "Md.Bilal",
    role: "App User",
    text: "The security features and real-time updates give me peace of mind when leaving my car in crowded areas."
  }
];

const FooterSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const navigate = useNavigate();
  const { isAuthenticated } = useUser();
  return (
    <footer style={{
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      paddingTop: '80px',
      paddingBottom: '60px',
      position: 'relative',
      overflow: 'hidden',
      borderTop: '1px solid var(--glass-border)'
    }}>
      {/* Massive Typographic Background */}
      <div style={{
        position: 'absolute',
        top: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 'clamp(6rem, 18vw, 15rem)',
        fontWeight: 100,
        fontFamily: 'var(--font-display)',
        color: 'var(--text-primary)',
        opacity: 0.03,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        letterSpacing: '-0.05em',
        lineHeight: 1,
        zIndex: 0
      }}>
        PARK SMARTER.
      </div>

      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 5%', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '100px' }}>
          <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1, marginBottom: '24px', marginTop: '0' }}>
            Ready to stop <br /><span style={{ color: 'var(--accent-primary)' }}>circling the block?</span>
          </h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '500px', marginBottom: '48px' }}>
            Join the movement of drivers who find their spot before they even turn the ignition.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button className="btn btn-primary" style={{ padding: '20px 40px', fontSize: '1.1rem' }}>Get the App</button>
            <button
              className="btn btn-primary"
              onClick={() => navigate(isAuthenticated ? '/find' : '/login')}
              style={{ padding: '20px 40px', fontSize: '1.1rem' }}
            >
              Book Now
            </button>
          </div>
        </div>

        {/* Testimonial Carousel */}
        <FadeIn delay={0.4}>
          <div className="glass-panel" style={{
            padding: 'clamp(28px, 6vw, 60px)',
            marginBottom: '80px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(20px, 4vw, 40px)',
            alignItems: 'center',
            background: 'var(--bg-tertiary)',
            borderLeft: '4px solid var(--accent-primary)',
            width: '100%',
            boxSizing: 'border-box',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ flex: 1, minWidth: 'unset', width: '100%', position: 'relative', minHeight: '180px' }}>
              {testimonials.map((test, index) => (
                <div
                  key={index}
                  style={{
                    position: index === currentSlide ? 'relative' : 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    opacity: index === currentSlide ? 1 : 0,
                    transform: `translateY(${index === currentSlide ? 0 : (index < currentSlide ? '-20px' : '20px')})`,
                    transition: 'all 0.5s ease-in-out',
                    pointerEvents: index === currentSlide ? 'auto' : 'none'
                  }}
                >
                  <div style={{
                    fontSize: 'clamp(1.15rem, 4.5vw, 1.85rem)',
                    fontWeight: 300,
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                    marginBottom: '20px',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em'
                  }}>
                    "{test.text}"
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--accent-primary), var(--accent-warm))' }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600 }}>{test.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{test.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dots */}
            <div style={{ display: 'flex', gap: '8px', position: 'absolute', bottom: 'clamp(15px, 4vw, 30px)', right: 'clamp(15px, 4vw, 40px)' }}>
              {testimonials.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  style={{
                    width: '8px', height: '8px', borderRadius: '50%', cursor: 'pointer',
                    background: currentSlide === idx ? 'var(--accent-primary)' : 'var(--glass-border)',
                    transition: 'all 0.3s'
                  }}
                />
              ))}
            </div>
          </div>
        </FadeIn>


        {/* Dense row of links */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '60px',
          borderTop: '1px solid var(--glass-border)',
          flexWrap: 'wrap',
          gap: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-button)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <img src={logoImg} alt="Drivix Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.03em' }}>Drivix</span>
          </div>


          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {['Safety', 'Privacy', 'Network', 'Support', 'Careers'].map(link => (
              <span
                key={link}
                onClick={() => {
                  if (link === 'Safety') navigate('/safety');
                  if (link === 'Support') setIsSupportOpen(true);
                }}
                style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
              >
                {link}
              </span>
            ))}
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            Built in India With ❤️ By Sajid Ahmad • © 2026
          </div>
        </div>
      </div>
      {isSupportOpen && <SupportModal onClose={() => setIsSupportOpen(false)} />}
    </footer>
  );
};

export default FooterSection;
