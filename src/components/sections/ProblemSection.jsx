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
    <section id="problem" style={{ padding: '120px 0', background: 'var(--bg-secondary)', position: 'relative' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%', position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '20px' }}>
            The <span style={{ color: '#ff4b4b' }}>Parking Crisis</span>
          </h2>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '800px', margin: '0 auto' }}>
            With India's vehicle population reaching 350-400 million and growing by 25 million yearly, conventional parking infrastructure has failed.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          {problems.map((problem, i) => {
            const Icon = problem.icon;
            return (
            <FadeIn key={i} delay={i * 0.1}>
              <div
                className="glass-panel"
                style={{ padding: '40px', textAlign: 'center', transition: 'transform 0.3s ease', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Icon color="#ff4b4b" size={48} style={{ margin: '0 auto 24px' }} />
                <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>{problem.title}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>{problem.desc}</p>
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
