import React from 'react';
import { motion } from 'framer-motion';

const AnimatedParkingHero = () => {
  return (
    <div className="glass-panel" style={{
      width: '400px',
      height: '450px',
      margin: '0 auto',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-card)'
    }}>
      {/* Road Base */}
      <div style={{
        position: 'absolute', top: '0', bottom: '0', left: '50%', width: '90px',
        background: '#111111', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ height: '100%', width: '3px', backgroundImage: 'linear-gradient(to bottom, transparent 50%, rgba(255,255,255,0.2) 50%)', backgroundSize: '100% 30px' }} />
      </div>

      {/* Left Parking Spots */}
      <div style={{ position: 'absolute', top: '60px', bottom: '60px', left: '8%', width: '28%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {[0, 1, 2].map(i => (
          <div key={`left-${i}`} style={{ height: '75px', width: '100%', border: '2px solid rgba(255, 0, 0, 0.3)', borderRadius: 'var(--radius-button)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', right: '-25px', transform: 'translateY(-50%)', color: 'rgba(255, 0, 0, 0.5)', fontSize: '0.7rem', fontWeight: 600 }}>P-{i + 1}</div>
            {i === 0 && <div style={{ position: 'absolute', inset: '8px', background: '#e60000', borderRadius: 'var(--radius-button)', opacity: 0.5, boxShadow: '0 0 15px #ff0000' }} />}
            {i === 2 && <div style={{ position: 'absolute', inset: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--radius-button)', opacity: 0.5 }} />}
          </div>
        ))}
      </div>

      {/* Right Parking Spots */}
      <div style={{ position: 'absolute', top: '60px', bottom: '60px', right: '8%', width: '28%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {[3, 4, 5].map(i => (
          <div key={`right-${i}`} style={{ height: '75px', width: '100%', border: '2px solid rgba(255, 0, 0, 0.3)', borderRadius: 'var(--radius-button)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: '-25px', transform: 'translateY(-50%)', color: 'rgba(255, 0, 0, 0.5)', fontSize: '0.7rem', fontWeight: 600 }}>P-{i + 1}</div>
            {i === 3 && <div style={{ position: 'absolute', inset: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--radius-button)', opacity: 0.5 }} />}
          </div>
        ))}
      </div>

      {/* Moving Car 1 — parks in left-middle */}
      <motion.div
        animate={{ y: [450, 195, 195], x: [0, 0, -85], rotate: [0, 0, -90] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: 0, left: 'calc(50% + 12px)', width: '30px', height: '60px',
          background: 'linear-gradient(180deg, #ff4b4b, #990000)',
          borderRadius: 'var(--radius-button)', boxShadow: '0 0 15px #ff0000', zIndex: 10
        }}
      />

      {/* Moving Car 2 — drives straight through */}
      <motion.div
        animate={{ y: [-80, 530] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1, ease: 'linear' }}
        style={{
          position: 'absolute', top: 0, left: 'calc(50% - 42px)', width: '30px', height: '60px',
          background: '#cc0000',
          borderRadius: 'var(--radius-button)', boxShadow: '0 0 15px #cc0000', zIndex: 10, opacity: 0.8
        }}
      />

      {/* Entrance Gate */}
      <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', width: '135px', height: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: '15px', height: '15px', background: '#ff0000', borderRadius: '50%', boxShadow: '0 0 8px #ff0000' }} />
        <div style={{ flex: 1, height: '3px', background: '#ff0000', position: 'relative' }}>
          <motion.div
            animate={{ width: ['100%', '20%', '100%'], x: ['0%', '-50%', '0%'] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
            style={{ width: '100%', height: '100%', background: 'var(--bg-primary)', position: 'absolute', top: 0, right: 0, transformOrigin: 'right' }}
          />
        </div>
        <div style={{ width: '15px', height: '15px', background: '#ff0000', borderRadius: '50%', boxShadow: '0 0 8px #ff0000' }} />
      </div>
    </div>
  );
};

export default AnimatedParkingHero;
