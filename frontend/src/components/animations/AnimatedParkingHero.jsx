import React from 'react';
import { motion } from 'framer-motion';

const AnimatedParkingHero = () => {
  return (
    <div className="glass-panel" style={{
      width: '100%',
      maxWidth: '340px',
      height: '400px',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-card)',
      boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
      margin: '0 auto'
    }}>
      {/* Road Base */}
      <div style={{
        position: 'absolute', top: '0', bottom: '0', left: '50%', width: '80px',
        background: '#050508', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ height: '100%', width: '2.7px', backgroundImage: 'linear-gradient(to bottom, transparent 50%, rgba(255,206,0,0.1) 50%)', backgroundSize: '100% 30px' }} />
      </div>

      {/* Left Parking Spots */}
      <div style={{ position: 'absolute', top: '60px', bottom: '60px', left: '8%', width: '24%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {[0, 1, 2].map(i => (
          <div key={`left-${i}`} style={{ height: '55px', width: '100%', border: '2px solid var(--glass-border)', borderRadius: 'var(--radius-button)', position: 'relative', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ position: 'absolute', top: '50%', right: '-25px', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700 }}>P-{i + 1}</div>
            {i === 0 && <div style={{ position: 'absolute', inset: '6px', background: 'var(--accent-primary)', borderRadius: 'var(--radius-button)', opacity: 0.6, boxShadow: '0 0 20px var(--accent-glow)' }} />}
          </div>
        ))}
      </div>

      {/* Right Parking Spots */}
      <div style={{ position: 'absolute', top: '60px', bottom: '60px', right: '8%', width: '24%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {[3, 4, 5].map(i => (
          <div key={`right-${i}`} style={{ height: '55px', width: '100%', border: '2px solid var(--glass-border)', borderRadius: 'var(--radius-button)', position: 'relative', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ position: 'absolute', top: '50%', left: '-25px', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700 }}>P-{i + 1}</div>
          </div>
        ))}
      </div>

      {/* Moving Car 1 — parks in left-middle */}
      <motion.div
        animate={{ y: [400, 178, 178], x: [0, 0, -124], rotate: [0, 0, -90] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: 0, left: 'calc(50% + 8px)', width: '22px', height: '44px',
          background: 'linear-gradient(180deg, var(--accent-primary), var(--accent-secondary))',
          borderRadius: '5px', boxShadow: '0 0 15px var(--accent-glow)', zIndex: 10
        }}
      />

      {/* Moving Car 2 — drives straight through */}
      <motion.div
        animate={{ y: [-80, 480] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1, ease: 'linear' }}
        style={{
          position: 'absolute', top: 0, left: 'calc(50% - 30px)', width: '22px', height: '44px',
          background: 'var(--text-secondary)',
          borderRadius: '5px', zIndex: 10, opacity: 0.4
        }}
      />

      {/* Entrance Gate */}
      <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', width: '135px', height: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: '12px', height: '12px', background: 'var(--accent-primary)', borderRadius: '50%', boxShadow: '0 0 10px var(--accent-primary)' }} />
        <div style={{ flex: 1, height: '3px', background: 'var(--accent-primary)', position: 'relative', opacity: 0.5 }}>
          <motion.div
            animate={{ width: ['100%', '20%', '100%'], x: ['0%', '-50%', '0%'] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
            style={{ width: '100%', height: '100%', background: 'var(--bg-primary)', position: 'absolute', top: 0, right: 0, transformOrigin: 'right' }}
          />
        </div>
        <div style={{ width: '12px', height: '12px', background: 'var(--accent-primary)', borderRadius: '50%', boxShadow: '0 0 10px var(--accent-primary)' }} />
      </div>
    </div>
  );
};

export default AnimatedParkingHero;
