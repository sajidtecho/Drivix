import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
const SERVICES = [
  { id: 'parking', title: 'Parking', desc: 'Secure spots nearby', color: 'var(--accent-primary)', path: '/find' },
  { id: 'challan', title: 'Challan', desc: 'Check & Pay Alerts', color: '#ff4b4b', path: '/admin/complaints' },
  { id: 'fastag', title: 'FASTag', desc: 'Recharge instantly', color: '#FAFF00', path: '/services' },
  { id: 'docs', title: 'Documents', desc: 'Secure Vault', color: '#00D2FF', path: '/profile' },
  { id: 'pollution', title: 'Pollution', desc: 'Expiries & Renewals', color: '#00cc6a', path: '/services' },
  { id: 'transfer', title: 'Car Sale', desc: 'Ownership Transfer', color: '#FF7A00', path: '/services' },
];

const ServicesHubSection = () => {
  const navigate = useNavigate();

  return (
    <section id="services-hub" style={{ padding: '60px 0', background: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900 }}>Our <span className="text-gradient">Services</span></h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '8px' }}>All your car needs in one dashboard</p>
          </div>
          <button onClick={() => navigate('/services')} className="btn" style={{ background: 'none', color: 'var(--accent-primary)', fontWeight: 800, fontSize: '1rem' }}>View All →</button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '24px' 
        }}>
          {SERVICES.map((service, idx) => (
            <motion.div
              key={service.id}
              whileHover={{ 
                y: -8, 
                scale: 1.03,
                borderColor: service.color,
                boxShadow: `0 20px 40px -15px ${service.color}50`
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={() => navigate(service.path)}
              className="glass-panel"
              style={{
                padding: '32px 24px',
                borderRadius: '24px',
                cursor: 'pointer',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                border: '1px solid var(--glass-border-light)',
                background: 'rgba(255, 255, 255, 0.02)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Subtle background glow effect based on service color */}
              <div style={{
                position: 'absolute',
                top: '-20%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '120px',
                height: '120px',
                background: service.color,
                filter: 'blur(50px)',
                opacity: 0.15,
                zIndex: 0
              }} />

              <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>{service.title}</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', flex: 1 }}>{service.desc}</p>
                <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                  <span style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 800, 
                    color: service.color, 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Explore <span style={{ fontSize: '1.1rem' }}>→</span>
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesHubSection;
