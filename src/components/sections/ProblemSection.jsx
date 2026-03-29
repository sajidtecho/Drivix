import React from 'react';
import { Clock, ShieldAlert, TrendingUp } from 'lucide-react';
import FadeIn from '../common/FadeIn';

const problems = [
  {
    icon: Clock,
    title: 'Wasted Time & Fuel',
    desc: 'Drivers spend 20-30 minutes searching for parking in crowded areas like CP and crowded markets.',
  },
  {
    icon: ShieldAlert,
    title: 'Security Concerns',
    desc: 'Leaving vehicles on streets increases the risk of theft, accidental damage, and unwanted fines.',
  },
  {
    icon: TrendingUp,
    title: 'Traffic Congestion',
    desc: 'Searching for parking accounts for up to 30% of urban traffic congestion and emissions.',
  },
];

const ProblemSection = () => {
  return (
    <section id="problem" style={{ padding: '160px 0', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden' }}>
      {/* City Marquee */}
      <div style={{
        position: 'absolute',
        top: '40px',
        width: '100%',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        opacity: 0.1,
        userSelect: 'none',
        pointerEvents: 'none',
      }}>
        <div className="marquee-content" style={{ display: 'inline-block', fontSize: '5rem', fontWeight: 900, fontFamily: 'var(--font-display)', animation: 'marquee 40s linear infinite' }}>
          NOIDA SECTOR 18 • CP • GOLF COURSE • SHARDA UNIVERSITY • PARI CHOWK • SECTOR 62 • CYBER CITY • 
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>

      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 5%', position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'left', marginBottom: '80px', maxWidth: '800px' }}>
          <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 0.95, letterSpacing: '-0.04em', marginBottom: '32px' }}>
             The 20-minute <br /><span style={{ color: 'var(--accent-warm)' }}>parking tax</span>.
          </h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
             Every morning in Noida, thousands of drivers lose 20 minutes just circling. It's not just a delay; it's a productivity tax we've all been forced to pay. Until now.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '100px' }}>
          {problems.map((problem, i) => {
            const Icon = problem.icon;
            return (
            <FadeIn key={i} delay={i * 0.1}>
              <div
                className="glass-panel"
                style={{ padding: '48px', border: '1px solid var(--glass-border)', transition: 'all 0.4s var(--transition-normal)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-warm)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(255, 107, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
                   <Icon color="var(--accent-warm)" size={28} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '16px', fontFamily: 'var(--font-display)' }}>{problem.title}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{problem.desc}</p>
              </div>
            </FadeIn>
            );
          })}
        </div>

        {/* Real Testimonial */}
        <FadeIn delay={0.4}>
          <div className="glass-panel" style={{ padding: '60px', display: 'flex', flexWrap: 'wrap', gap: '48px', alignItems: 'center', background: 'var(--bg-tertiary)', borderLeft: '4px solid var(--accent-primary)' }}>
             <div style={{ flex: 1, minWidth: '300px' }}>
                <div style={{ fontSize: '2rem', fontWeight: 600, fontStyle: 'italic', lineHeight: 1.4, marginBottom: '32px', color: 'var(--text-primary)' }}>
                   "I used to leave my house at 8:10 AM just to ensure I could find a spot in Sector 18 before my 9:00 AM standup. With Drivix, I leave at 8:40 AM. That's 30 minutes of my life back, every single day."
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                   <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
                   <div>
                      <div style={{ fontWeight: 800 }}>Sajid Ahmad</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Daily Commuter to Sector 18</div>
                   </div>
                </div>
             </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default ProblemSection;
