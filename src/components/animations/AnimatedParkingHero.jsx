import React from 'react';
import { motion } from 'framer-motion';

const AnimatedParkingHero = () => {
  return (
    <div className="glass-panel" style={{
      width: '100%',
      height: '600px',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--glass-border)',
      borderRadius: '30px'
    }}>
      {/* Road Base */}
      <div style={{
        position: 'absolute', top: '0', bottom: '0', left: '50%', width: '120px',
        background: '#111111', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ height: '100%', width: '4px', backgroundImage: 'linear-gradient(to bottom, transparent 50%, rgba(255,255,255,0.2) 50%)', backgroundSize: '100% 40px' }} />
      </div>

      {/* Left Parking Spots */}
      <div style={{ position: 'absolute', top: '100px', bottom: '100px', left: '10%', width: '25%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {[0, 1, 2].map(i => (
          <div key={`left-${i}`} style={{ height: '100px', width: '100%', border: '2px solid rgba(255, 0, 0, 0.3)', borderRadius: '12px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', right: '-30px', transform: 'translateY(-50%)', color: 'rgba(255, 0, 0, 0.5)', fontSize: '0.8rem', fontWeight: 600 }}>P-{i + 1}</div>
            {i === 0 && <div style={{ position: 'absolute', inset: '10px', background: '#e60000', borderRadius: '8px', opacity: 0.5, boxShadow: '0 0 20px #ff0000' }} />}
            {i === 2 && <div style={{ position: 'absolute', inset: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', opacity: 0.5 }} />}
          </div>
        ))}
      </div>

      {/* Right Parking Spots */}
      <div style={{ position: 'absolute', top: '100px', bottom: '100px', right: '10%', width: '25%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {[3, 4, 5].map(i => (
          <div key={`right-${i}`} style={{ height: '100px', width: '100%', border: '2px solid rgba(255, 0, 0, 0.3)', borderRadius: '12px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: '-30px', transform: 'translateY(-50%)', color: 'rgba(255, 0, 0, 0.5)', fontSize: '0.8rem', fontWeight: 600 }}>P-{i + 1}</div>
            {i === 3 && <div style={{ position: 'absolute', inset: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', opacity: 0.5 }} />}
          </div>
        ))}
      </div>

      {/* Moving Car 1 — parks in left-middle */}
      <motion.div
        animate={{ y: [600, 280, 280], x: [0, 0, -110], rotate: [0, 0, -90] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: 0, left: 'calc(50% + 15px)', width: '40px', height: '80px',
          background: 'linear-gradient(180deg, #ff4b4b, #990000)',
          borderRadius: '8px', boxShadow: '0 0 20px #ff0000', zIndex: 10
        }}
      />

      {/* Moving Car 2 — drives straight through */}
      <motion.div
        animate={{ y: [-100, 700] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1, ease: 'linear' }}
        style={{
          position: 'absolute', top: 0, left: 'calc(50% - 55px)', width: '40px', height: '80px',
          background: '#cc0000',
          borderRadius: '8px', boxShadow: '0 0 20px #cc0000', zIndex: 10, opacity: 0.8
        }}
      />

      {/* Entrance Gate */}
      <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', width: '180px', height: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: '20px', height: '20px', background: '#ff0000', borderRadius: '50%', boxShadow: '0 0 10px #ff0000' }} />
        <div style={{ flex: 1, height: '4px', background: '#ff0000', position: 'relative' }}>
          <motion.div
            animate={{ width: ['100%', '20%', '100%'], x: ['0%', '-50%', '0%'] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
            style={{ width: '100%', height: '100%', background: 'var(--bg-primary)', position: 'absolute', top: 0, right: 0, transformOrigin: 'right' }}
          />
        </div>
        <div style={{ width: '20px', height: '20px', background: '#ff0000', borderRadius: '50%', boxShadow: '0 0 10px #ff0000' }} />
      </div>
    </div>
  );
};

export default AnimatedParkingHero;
