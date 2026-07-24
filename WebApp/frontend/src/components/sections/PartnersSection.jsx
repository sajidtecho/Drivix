import React from 'react';
import FadeIn from '../common/FadeIn';

const PARTNERS = [
  { name: 'Airtel', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Airtel_logo.svg' },
  { name: 'CRED', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/70/Cred_logo.svg/1200px-Cred_logo.svg.png' },
  { name: 'Paytm', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Paytm_Logo.svg' },
  { name: 'HDFC Bank', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/HDFC_Bank_logo.svg' },
  { name: 'BharatPe', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/BharatPe_logo.svg' },
  { name: 'PhonePe', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/PhonePe_Logo.svg' }
];

const PartnersSection = () => {
  return (
    <section style={{ padding: '20px 0', background: 'var(--bg-primary)', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%' }}>
        <p style={{ 
          textAlign: 'center', 
          color: 'var(--text-muted)', 
          fontSize: '0.8rem', 
          fontWeight: 800, 
          textTransform: 'uppercase', 
          letterSpacing: '0.2em',
          marginBottom: '32px'
        }}>
          Integrated with India's leading ecosystems
        </p>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '40px',
          flexWrap: 'wrap',
          opacity: 0.6
        }}>
          {PARTNERS.map((partner, idx) => (
            <div key={idx} style={{ flex: '1 1 120px', display: 'flex', justifyContent: 'center' }}>
               <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-secondary)', filter: 'grayscale(100%) brightness(1.5)' }}>
                 {partner.name}
               </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
