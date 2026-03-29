import React from 'react';
import { Key, Tag, Search, Gavel, Car, ShieldCheck, Banknote, Wallet } from 'lucide-react';
import FadeIn from '../common/FadeIn';

const features = [
  { title: 'Valet Services',         icon: Key,       color: '#ff4b4b' },
  { title: 'FASTag',                 icon: Tag,       color: '#bc00ff' },
  { title: 'Vehicle Owner Details',  icon: Search,    color: 'var(--accent-secondary)' },
  { title: 'E-Challan',              icon: Gavel,     color: 'var(--accent-primary)' },
  { title: 'New Cars',               icon: Car,       color: '#00d2ff', badge: '200+ Models' },
  { title: 'Car Insurance',          icon: ShieldCheck, color: '#ffcc00' },
  { title: 'Car Loan',               icon: Banknote,  color: '#bc00ff' },
  { title: 'Personal Loan',          icon: Wallet,    color: '#ff4b4b' },
];

const FeaturesSection = () => {
  return (
    <section id="features" style={{ padding: '120px 0', background: 'var(--bg-secondary)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%' }}>
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>
            Do more with <span className="text-gradient">Drivix</span>
          </h2>
        </div>

        <FadeIn>
          <div
            className="glass-panel hide-scrollbar"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '24px 0',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              background: 'var(--bg-tertiary)',
              borderRadius: '24px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div style={{ display: 'flex', width: '100%' }}>
              {features.map((feature, i, arr) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    minWidth: '150px', flex: 1, position: 'relative',
                    borderRight: i !== arr.length - 1 ? '1px solid var(--glass-border)' : 'none',
                    padding: '0 16px', cursor: 'pointer', transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {feature.badge && (
                    <div style={{
                      position: 'absolute', top: '-15px', background: '#bc00ff', color: 'white',
                      fontSize: '0.7rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px',
                      boxShadow: '0 4px 10px rgba(188, 0, 255, 0.4)', zIndex: 10,
                    }}>
                      {feature.badge}
                    </div>
                  )}

                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '16px', position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{ position: 'absolute', inset: 0, background: feature.color, opacity: 0.1 }} />
                    <feature.icon size={36} color={feature.color} />
                  </div>

                  <h4 style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)', textAlign: 'center', whiteSpace: 'normal', lineHeight: 1.3 }}>
                    {feature.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default FeaturesSection;
