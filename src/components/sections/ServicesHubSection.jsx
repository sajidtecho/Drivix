import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import challanIcon from '../../assets/icon_challan.png';
import fastagIcon from '../../assets/icon_fastag.png';
import documentIcon from '../../assets/icon_docs.png';
import pollutionIcon from '../../assets/icon_pollution.png';
import ownershipIcon from '../../assets/icon_sale.png';
import parkingIcon from '../../assets/icon_parking.png';

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
    <section id="services-hub" style={{ padding: '40px 0', background: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Our <span className="text-gradient">Services</span></h2>
            <p style={{ color: 'var(--text-secondary)' }}>All your car needs in one dashboard</p>
          </div>
          <button onClick={() => navigate('/services')} className="btn" style={{ background: 'none', color: 'var(--accent-primary)', fontWeight: 800 }}>View All →</button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '20px' 
        }}>
          {SERVICES.map((service, idx) => (
            <motion.div
              key={service.id}
              whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
              onClick={() => navigate(service.path)}
              className="glass-panel"
              style={{
                padding: '24px',
                borderRadius: '24px',
                cursor: 'pointer',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                border: '1px solid var(--glass-border-light)'
              }}
            >
              <div style={{ width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                {typeof service.icon === 'string' && service.icon.length < 5 ? (
                  <span style={{ fontSize: '4rem' }}>{service.icon}</span>
                ) : (
                  <img src={service.icon} alt={service.title} style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
                )}
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '4px' }}>{service.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{service.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesHubSection;
