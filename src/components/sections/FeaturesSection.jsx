import React from 'react';
import { Key, Tag, Search, Gavel, Car, ShieldCheck, Banknote, Wallet } from 'lucide-react';
import FadeIn from '../common/FadeIn';

// Unused variables removed

const FeaturesSection = () => {
  return (
    <section id="features" style={{ padding: '160px 0', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 5%' }}>
        <div style={{ marginBottom: '64px', maxWidth: '600px' }}>
          <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1, letterSpacing: '-0.04em', marginBottom: '24px' }}>
            Built for <span style={{ color: 'var(--accent-primary)' }}>human drivers</span>, not just sensors.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
            A parking ecosystem that removes the friction from every touchpoint, from the mall entrance to your office elevator.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridAutoRows: 'minmax(200px, auto)',
          gap: '24px',
        }} className="bento-grid">
          <style>{`
            @media (max-width: 1024px) {
              .bento-grid { grid-template-columns: repeat(2, 1fr) !important; }
            }
            @media (max-width: 640px) {
              .bento-grid { grid-template-columns: 1fr !important; }
              .bento-card-large { grid-column: span 1 !important; }
              .bento-card-wide { grid-column: span 1 !important; }
            }
            .bento-card {
               transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
               cursor: pointer;
            }
            .bento-card:hover {
               transform: translateY(-8px) rotate(1deg);
               border-color: var(--accent-primary);
               box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            }
          `}</style>
          
          {/* Main Large Card */}
          <div className="glass-panel bento-card bento-card-large" style={{ gridColumn: 'span 2', gridRow: 'span 2', padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(135deg, var(--bg-secondary), #1a1a24)' }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Network Growth</div>
              <h3 style={{ fontSize: '3.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 0.9, marginBottom: '24px' }}>
                42<span style={{ fontSize: '2rem' }}> sites</span> <br />and counting.
              </h3>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                From Sector 18 to Knowledge Park II. If it's a major hub in Noida, we're already there.
              </p>
            </div>
            <div style={{ marginTop: '40px' }}>
               <button className="btn" style={{ padding: '0', background: 'none', color: 'var(--accent-primary)', fontWeight: 800, borderBottom: '2px solid' }}>See Network →</button>
            </div>
          </div>

          {/* Wide Card */}
          <div className="glass-panel bento-card bento-card-wide" style={{ gridColumn: 'span 2', padding: '32px', display: 'flex', alignItems: 'center', gap: '32px' }}>
             <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(250, 255, 0, 0.1)', color: 'var(--accent-primary)' }}>
                <Wallet size={48} />
             </div>
             <div>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>Zero-Friction Payments</h4>
                <p style={{ color: 'var(--text-secondary)' }}>Forget standard gateways. One-tap FASTag integration means no stopping at the gate.</p>
             </div>
          </div>

          <div className="glass-panel bento-card" style={{ padding: '32px' }}>
             <ShieldCheck size={32} color="var(--accent-primary)" style={{ marginBottom: '20px' }} />
             <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>ANPR Secure</h4>
             <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>High-speed camera entry. No more reaching for QR codes.</p>
          </div>

          <div className="glass-panel bento-card" style={{ padding: '32px', background: 'var(--bg-tertiary)' }}>
             <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-warm)', marginBottom: '12px' }}>3 min</div>
             <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Average time saved per session vs. traditional parking.</p>
          </div>

          {/* Bottom Card Wide */}
          <div className="glass-panel bento-card bento-card-wide" style={{ gridColumn: 'span 2', padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Need help with insurance?</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>We've partnered with top carriers for direct-to-app quotes.</p>
             </div>
             <button className="btn btn-secondary" style={{ padding: '12px 24px' }}>Explore</button>
          </div>

          <div className="glass-panel bento-card" style={{ gridColumn: 'span 2', padding: '32px', border: '1px solid var(--accent-primary)' }}>
             <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px' }}>Available 24/7</h4>
             <div style={{ display: 'flex', gap: '8px' }}>
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} style={{ flex: 1, height: '40px', background: i < 5 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
                ))}
             </div>
             <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Real-time availability monitoring across all zones.</p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
