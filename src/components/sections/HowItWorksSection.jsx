import React from 'react';
import { Smartphone, ScanFace, Clock, Zap, Car } from 'lucide-react';
import { motion } from 'framer-motion';
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
          <div style={{ marginBottom: '80px', borderRadius: 'var(--radius-card)', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <GateAnimation />
          </div>
        </FadeIn>

        <div style={{ position: 'relative' }}>
          {/* Sequential Car Animation */}
          <motion.div
            animate={{ 
              x: ['0%', '33%', '66%', '100%'],
              opacity: [0, 1, 1, 0]
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity, 
              ease: "linear",
              times: [0, 0.2, 0.8, 1]
            }}
            style={{ 
              position: 'absolute', 
              top: '-45px', 
              left: '0%', 
              width: '100%',
              zIndex: 10,
              color: 'var(--accent-primary)',
              filter: 'drop-shadow(0 0 10px var(--accent-primary))',
              display: 'flex',
              paddingLeft: '50px'
            }}
            className="desktop-only"
          >
            <Car size={32} />
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' }}>
            {steps.map((s, idx) => {
              const Icon = s.icon;
              return (
              <FadeIn key={idx} delay={idx * 0.1}>
                <div className="glass-panel" style={{ padding: '40px 30px', textAlign: 'center', height: '100%', position: 'relative' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(250, 255, 0, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <Icon size={32} color="var(--accent-secondary)" />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', marginBottom: '16px', fontWeight: 800 }}>{s.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '1rem' }}>{s.desc}</p>
                </div>
              </FadeIn>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
