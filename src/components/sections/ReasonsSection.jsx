import React from 'react';
import { CreditCard, ShieldCheck, Building2 } from 'lucide-react';
import FadeIn from '../common/FadeIn';

// Unused variables removed

const ReasonsSection = () => {
  return (
    <section style={{ padding: '160px 0', background: 'var(--bg-secondary)', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 5%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }} className="asymmetric-reasons">
          <style>{`
            @media (max-width: 1024px) {
              .asymmetric-reasons { grid-template-columns: 1fr !important; gap: 40px !important; }
            }
          `}</style>
          
          <FadeIn>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 0.9, letterSpacing: '-0.04em' }}>
              Why people are <br />trading their old <br />habits for <span style={{ color: 'var(--accent-primary)' }}>Drivix.</span>
            </h2>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
              <div style={{ borderLeft: '2px solid var(--accent-primary)', paddingLeft: '32px' }}>
                <div style={{ fontSize: '3.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1, marginBottom: '8px' }}>96%</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', fontWeight: 500 }}>Of users say they feel less 'driving stress' after making their first pre-booked entry.</p>
              </div>
              <div style={{ borderLeft: '2px solid var(--accent-warm)', paddingLeft: '32px' }}>
                <div style={{ fontSize: '3.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1, marginBottom: '8px' }}>1-Tap</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', fontWeight: 500 }}>Is all it takes to renew insurance, PUCC, and recharge FASTag. No more multiple apps.</p>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Thin Horizontal Rule Stat */}
        <div style={{ marginTop: '120px', padding: '40px 0', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'center', opacity: 0.8 }}>
           <div style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'center' }}>
              "The most intentional parking experience in India." <span style={{ color: 'var(--accent-primary)' }}>— TechNoida</span>
           </div>
        </div>
      </div>
    </section>
  );
};

export default ReasonsSection;
