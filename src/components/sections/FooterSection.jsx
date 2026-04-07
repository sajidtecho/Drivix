import React from 'react';
import FadeIn from '../common/FadeIn';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import logoImg from '../../assets/Logo.jpeg';


// Unused variables removed

const FooterSection = () => {
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
            <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.03em' }}>Drivix.</span>
          </div>


          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {['Safety', 'Privacy', 'Network', 'Support', 'Careers'].map(link => (
              <span
                key={link}
                onClick={() => link === 'Safety' && navigate('/safety')}
                style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
              >
                {link}
              </span>
            ))}
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Built in India ❤️ By Sajid Ahmad• © 2026
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
