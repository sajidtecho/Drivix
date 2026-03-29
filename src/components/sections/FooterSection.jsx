import React from 'react';
import { motion } from 'framer-motion';
import FadeIn from '../common/FadeIn';

const stats = [
  { value: '2.5M+',  label: 'Downloads' },
  { value: '500K+',  label: 'FASTag Recharges' },
  { value: '120K+',  label: 'Challans Resolved' },
];

const footerLinks = ['Terms & Conditions', 'Privacy Policy', 'Site Map'];

const FooterSection = () => {
  return (
    <section style={{ background: '#F2EDFA', color: '#000', paddingTop: '80px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between' }}>

        {/* Left — CTA Text */}
        <FadeIn>
          <div style={{ maxWidth: '550px', marginBottom: '80px', paddingTop: '40px' }}>
            <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '20px', color: '#2C2B2D' }}>
              Download Drivix app
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#777', lineHeight: 1.6, marginBottom: '60px' }}>
              Stay on the top of your car game with Drivix. Sit back and relax while we take care of your car-related needs, all in one place.
            </p>

            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
              {stats.map(({ value, label }) => (
                <div key={label} style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2C2B2D', marginBottom: '8px' }}>{value}</h4>
                  <p style={{ color: '#777', fontWeight: 600, fontSize: '1rem' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Right — Floating Phone Mockups */}
        <FadeIn delay={0.2}>
          <div style={{ position: 'relative', width: '400px', height: '400px' }}>
            {/* Phone 1 — back left */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ position: 'absolute', right: '140px', bottom: '0', width: '160px', height: '320px', background: '#111', borderRadius: '30px 30px 0 0', border: '6px solid #222', borderBottom: 'none', boxShadow: '-10px 10px 30px rgba(0,0,0,0.1)', overflow: 'hidden', padding: '12px' }}
            >
              <div style={{ background: '#222', width: '100%', height: '100%', borderRadius: '16px', padding: '10px' }}>
                <div style={{ width: '40px', height: '12px', background: 'var(--accent-primary)', borderRadius: '4px', marginBottom: '16px' }} />
                <div style={{ width: '100%', height: '60px', background: '#333', borderRadius: '8px', marginBottom: '12px' }} />
                <div style={{ width: '100%', height: '100px', background: '#333', borderRadius: '8px', marginBottom: '12px' }} />
              </div>
            </motion.div>

            {/* Phone 2 — front right */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              style={{ position: 'absolute', right: '20px', bottom: '0', width: '180px', height: '360px', background: '#fff', borderRadius: '35px 35px 0 0', border: '8px solid #111', borderBottom: 'none', boxShadow: '-15px 15px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}
            >
              <div style={{ width: '100%', height: '140px', background: '#311B92' }}>
                <div style={{ padding: '20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff' }} />
                  <div style={{ width: '30px', height: '12px', background: 'var(--accent-primary)', borderRadius: '4px' }} />
                </div>
              </div>
              <div style={{ padding: '12px', marginTop: '-50px' }}>
                <div style={{ width: '100%', height: '160px', background: '#f5f5f5', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', border: '1px solid #ddd' }} />
              </div>
              <div style={{ padding: '0 12px 12px' }}>
                <div style={{ width: '100%', height: '30px', background: '#311B92', borderRadius: '8px' }} />
              </div>
            </motion.div>
          </div>
        </FadeIn>
      </div>

      {/* Bottom bar */}
      <div style={{ background: '#372769', padding: '24px 0', color: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
          <div style={{ opacity: 0.9 }}>© 2026 Drivix. All rights reserved</div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', opacity: 0.9 }}>
            {footerLinks.map((link, i) => (
              <React.Fragment key={link}>
                {i > 0 && <span>|</span>}
                <span style={{ cursor: 'pointer' }}>{link}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FooterSection;
