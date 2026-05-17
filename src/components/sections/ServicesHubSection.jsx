import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import challanIcon from '../../assets/icon_challan_new.png';
import fastagIcon from '../../assets/icon_fastag_new.png';
import documentIcon from '../../assets/icon_docs_new.png';
import pollutionIcon from '../../assets/icon_pollution_new.png';
import ownershipIcon from '../../assets/icon_sale_new.png';
import parkingIcon from '../../assets/icon_parking_new.png';

const SERVICES = [
  { id: 'parking', title: 'Parking', desc: 'Secure spots nearby', icon: parkingIcon, color: 'var(--accent-primary)', path: '/find' },
  { id: 'challan', title: 'Challan', desc: 'Check & Pay Alerts', icon: challanIcon, color: '#ff4b4b', path: '/admin/complaints' },
  { id: 'fastag', title: 'FASTag', desc: 'Recharge instantly', icon: fastagIcon, color: '#FAFF00', path: '/services' },
  { id: 'docs', title: 'Documents', desc: 'Secure Vault', icon: documentIcon, color: '#00D2FF', path: '/profile' },
  { id: 'pollution', title: 'Pollution', desc: 'Expiries & Renewals', icon: pollutionIcon, color: '#00cc6a', path: '/services' },
  { id: 'transfer', title: 'Car Sale', desc: 'Ownership Transfer', icon: ownershipIcon, color: '#FF7A00', path: '/services' },
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

              <div style={{ 
                width: '120px', 
                height: '120px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '8px',
                position: 'relative',
                zIndex: 1 
              }}>
                <motion.img 
                  whileHover={{ scale: 1.15, rotate: 2 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                  src={service.icon} 
                  alt={service.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.6))' }} 
                />
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>{service.title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{service.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesHubSection;
