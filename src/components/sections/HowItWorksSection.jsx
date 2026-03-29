import React from 'react';
import { Smartphone, ScanFace, Clock, Zap } from 'lucide-react';
import FadeIn from '../common/FadeIn';
import GateAnimation from '../animations/GateAnimation';

const steps = [
  {
    step: '01',
    title: 'Advance App Booking',
    desc: 'Secure your spot from home before you leave. Compare prices and check live availability.',
    icon: Smartphone,
  },
  {
    step: '02',
    title: 'Smart Entry (ANPR)',
    desc: 'As seen above, HD cameras scan your plate, verify instantaneously, and open the gate.',
    icon: ScanFace,
  },
  {
    step: '03',
    title: 'Live Timer & Parking',
    desc: 'Once inside, a digital timer starts tracking down to the minute. Complete transparency.',
    icon: Clock,
  },
  {
    step: '04',
    title: 'Automated Checkout',
    desc: 'Exit seamlessly. The amount is automatically deducted via your preferred payment or FASTag wallet.',
    icon: Zap,
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" style={{ padding: '120px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '20px' }}>
            How <span className="text-gradient">Drivix</span> Works
          </h2>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
            Experience our seamless Smart Entry system powered by ANPR cameras.
          </p>
        </div>

        <FadeIn>
          <div style={{ marginBottom: '80px', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <GateAnimation />
          </div>
        </FadeIn>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
            <FadeIn key={idx} delay={idx * 0.1}>
              <div className="glass-panel" style={{ padding: '30px 16px', textAlign: 'center', height: '100%', position: 'relative', marginTop: '20px' }}>
                <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', width: '50px', height: '50px', background: 'var(--bg-tertiary)', border: '2px solid var(--accent-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)', boxShadow: '0 10px 20px rgba(255, 206, 0, 0.2)' }}>
                  {s.step}
                </div>
                <Icon size={40} color="var(--accent-secondary)" style={{ margin: '16px auto', opacity: 0.8 }} />
                <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>{s.title}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: '0.95rem' }}>{s.desc}</p>
              </div>
            </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
