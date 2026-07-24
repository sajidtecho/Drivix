import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, TrendingUp } from 'lucide-react';
import FadeIn from '../common/FadeIn';

const problems = [
  {
    icon: Clock,
    title: 'Wasted Time & Fuel',
    desc: 'Drivers spend 20-30 minutes searching for parking in crowded markets.',
  },
  {
    icon: ShieldAlert,
    title: 'Security Concerns',
    desc: 'Leaving vehicles on streets increases the risk of theft, damage, and fines.',
  },
  {
    icon: TrendingUp,
    title: 'Traffic Congestion',
    desc: 'Searching for parking causes up to 30% of urban traffic congestion.',
  },
];

const ProblemSection = () => {
  return (
    <section id="problem" style={{ padding: '60px 0', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden' }}>
      {/* City Marquee */}
      <div style={{
        position: 'absolute',
        top: '30px',
        width: '100%',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        opacity: 0.1,
        userSelect: 'none',
        pointerEvents: 'none',
      }}>
        <div className="marquee-content" style={{ display: 'inline-block', fontSize: '4.5rem', fontWeight: 900, fontFamily: 'var(--font-display)', animation: 'marquee 40s linear infinite' }}>
          1,204 SPOTS BOOKED TODAY • SECTOR 18 • 94% SATISFACTION • AVG 3 MIN ENTRY • 1,204 SPOTS BOOKED TODAY • SECTOR 18 • 94% SATISFACTION • AVG 3 MIN ENTRY •
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>

      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 5%', position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'left', marginBottom: '40px', maxWidth: '800px' }}>
          <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 0.95, letterSpacing: '-0.04em', marginBottom: '24px' }}>
            The <span style={{ whiteSpace: 'nowrap' }}>20-minute</span> <span style={{ color: 'var(--accent-warm)' }}>parking tax</span>.
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Every morning in Noida, thousands of drivers lose 20 minutes just circling. It's not just a delay; it's a productivity tax we've all been forced to pay. Until now.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          {problems.map((problem, i) => {
            const Icon = problem.icon;
            return (
              <FadeIn key={i} delay={i * 0.1}>
                <div
                  className="glass-panel"
                  style={{
                    padding: '24px 20px',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '24px',
                    transition: 'all var(--transition-normal)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-warm)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(255, 107, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px'
                  }}>
                    <Icon color="var(--accent-warm)" size={20} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '10px', fontFamily: 'var(--font-display)' }}>{problem.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.4, fontSize: '0.85rem' }}>{problem.desc}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
