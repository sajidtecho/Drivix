import React from 'react';
import { CreditCard, ShieldCheck, Building2 } from 'lucide-react';
import FadeIn from '../common/FadeIn';

const ParkingIcon = ({ size }) => (
  <div style={{ fontSize: size * 0.8, fontWeight: 800, fontFamily: 'Arial, sans-serif', lineHeight: 1 }}>P</div>
);

const reasons = [
  {
    text: 'One fastag for all your needs - Parking, Tolls, Malls, Fuel payment',
    icon: CreditCard,
    color: 'var(--accent-primary)',
  },
  {
    text: 'Save time, fuel and effort with smart parking',
    icon: ParkingIcon,
    color: '#bc00ff',
  },
  {
    text: 'Reminders to never miss out on your insurance and PUCC renewal',
    icon: ShieldCheck,
    color: '#00d2ff',
  },
  {
    text: 'Easy to find information regarding RTO services, traffic rules etc',
    icon: Building2,
    color: 'var(--accent-secondary)',
  },
];

const ReasonsSection = () => {
  return (
    <section style={{ padding: '120px 0', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 800 }}>
            More reasons than one to love <span className="text-gradient">Drivix</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px' }}>
          {reasons.map((reason, i) => {
            const Icon = reason.icon;
            return (
            <FadeIn key={i} delay={i * 0.1}>
              <div
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 20px', transition: 'transform 0.3s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{
                  width: '120px', height: '120px', borderRadius: '30px',
                  background: 'var(--bg-tertiary)', border: `2px solid ${reason.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '28px', position: 'relative', overflow: 'hidden',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                  color: reason.color,
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: reason.color, opacity: 0.1 }} />
                  <Icon size={50} />
                </div>
                <p style={{ color: 'var(--text-primary)', fontSize: '1.05rem', lineHeight: 1.6, fontWeight: 500 }}>
                  {reason.text}
                </p>
              </div>
            </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ReasonsSection;
