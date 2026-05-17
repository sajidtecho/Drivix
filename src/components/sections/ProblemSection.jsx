import React, { useState, useEffect } from 'react';
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
  // Testimonial logic moved to FooterSection


  return (
    <section id="problem" style={{ padding: '80px 0', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden' }}>
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
        <div style={{ textAlign: 'left', marginBottom: '80px', maxWidth: '800px' }}>
          <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 0.95, letterSpacing: '-0.04em', marginBottom: '32px' }}>
            The <span style={{ whiteSpace: 'nowrap' }}>20-minute</span> <span style={{ color: 'var(--accent-warm)' }}>parking tax</span>.
          </h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Every morning in Noida, thousands of drivers lose 20 minutes just circling. It's not just a delay; it's a productivity tax we've all been forced to pay. Until now.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '20px',
          marginBottom: '80px'
        }}>
          {problems.map((problem, i) => {
            const Icon = problem.icon;
            return (
              <FadeIn key={i} delay={i * 0.1}>
                <div
                  className="glass-panel"
                  style={{
                    padding: 'clamp(24px, 5vw, 48px)',
                    border: '1px solid var(--glass-border)',
                    transition: 'all var(--transition-normal)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-warm)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-input)',
                    background: 'rgba(255, 107, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '28px'
                  }}>
                    <Icon color="var(--accent-warm)" size={24} />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px', fontFamily: 'var(--font-display)' }}>{problem.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: '1rem' }}>{problem.desc}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>

        {/* Testimonials moved to FooterSection */}

      </div>
    </section>
  );
};

export default ProblemSection;
