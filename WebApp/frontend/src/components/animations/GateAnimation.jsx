import React from 'react';
import { motion } from 'framer-motion';

const GateAnimation = () => {
  return (
    <div className="glass-panel" style={{ width: '100%', height: '350px', position: 'relative', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Ground */}
      <div style={{ position: 'absolute', bottom: '50px', left: 0, right: 0, height: '4px', background: '#e0e0e0' }} />

      {/* ANPR Camera Pole */}
      <div style={{ position: 'absolute', bottom: '50px', left: '60%', width: '8px', height: '200px', background: 'linear-gradient(to right, #444, #666)' }} />
      <div style={{ position: 'absolute', bottom: '230px', left: '52.5%', width: '40px', height: '20px', background: '#ddd', borderRadius: '4px', transform: 'rotate(-30deg)' }}>
        <div style={{ position: 'absolute', left: '-5px', top: '4px', width: '8px', height: '12px', background: '#0cc' }} />
      </div>

      {/* Scanning Beam */}
      <motion.div
        animate={{ opacity: [0, 0, 0.4, 0] }}
        transition={{ duration: 6, repeat: Infinity, times: [0, 0.3, 0.4, 0.5] }}
        style={{
          position: 'absolute',
          bottom: '50px', left: '30%', width: '240px', height: '180px',
          background: 'linear-gradient(to bottom, rgba(255, 173, 0, 0.8), transparent)',
          clipPath: 'polygon(80% 0%, 0% 100%, 80% 100%)',
          zIndex: 10
        }}
      />

      {/* Verification Popup */}
      <motion.div
        animate={{ opacity: [0, 0, 1, 0, 0], y: [10, 0, 0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, times: [0, 0.4, 0.45, 0.6, 1] }}
        style={{ position: 'absolute', bottom: '150px', left: '35%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: '#000', padding: '8px 20px', borderRadius: 'var(--radius-button)', fontWeight: 'bold', fontSize: '1.1rem', zIndex: 20, boxShadow: '0 4px 20px rgba(0,255,136,0.6)' }}
      >
        DL-14-55 Verified ✓
      </motion.div>

      {/* Gate Station */}
      <div style={{ position: 'absolute', bottom: '50px', left: '65%', width: '30px', height: '80px', background: '#f5f5f5', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', border: '2px solid #ccc' }} />

      {/* Barrier Arm */}
      <motion.div
        animate={{ rotate: [0, 0, 0, -90, -90, 0] }}
        transition={{ duration: 6, repeat: Infinity, times: [0, 0.45, 0.5, 0.6, 0.8, 0.9] }}
        style={{ position: 'absolute', bottom: '110px', left: '65%', width: '250px', height: '14px', background: 'repeating-linear-gradient(45deg, #ffcc00, #ffcc00 20px, #111 20px, #111 40px)', transformOrigin: 'left center', zIndex: 15 }}
      />

      {/* Car */}
      <motion.div
        animate={{ left: ['-30%', '40%', '40%', '150%'] }}
        transition={{ duration: 6, repeat: Infinity, times: [0, 0.3, 0.6, 1], ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: '54px', zIndex: 5 }}
      >
        <div style={{ width: '160px', height: '50px', background: 'linear-gradient(135deg, var(--accent-primary), #ff8c00)', borderRadius: '15px 30px 0 0', position: 'relative', boxShadow: '-5px 0 15px rgba(0,0,0,0.5)' }}>
          <div style={{ position: 'absolute', top: '-35px', left: '35px', width: '80px', height: '35px', background: 'linear-gradient(135deg, var(--accent-primary), #ff8c00)', borderTopLeftRadius: '30px', borderTopRightRadius: '30px' }} />
          <div style={{ position: 'absolute', top: '-28px', left: '40px', width: '30px', height: '28px', background: '#111', borderTopLeftRadius: '20px' }} />
          <div style={{ position: 'absolute', top: '-28px', left: '75px', width: '35px', height: '28px', background: '#111', borderTopRightRadius: '20px' }} />
          <div style={{ position: 'absolute', top: '15px', right: '0', width: '8px', height: '15px', background: '#ffeade', borderRadius: '5px 0 0 5px', boxShadow: '15px 0 25px 15px rgba(255, 234, 222, 0.3)' }} />
          <div style={{ position: 'absolute', top: '15px', left: '0', width: '8px', height: '20px', background: '#ff0000', borderRadius: '0 5px 5px 0', boxShadow: '-5px 0 15px 5px rgba(255, 0, 0, 0.5)' }} />
          <div style={{ position: 'absolute', bottom: '-15px', left: '20px', width: '30px', height: '30px', background: '#1a1a1a', borderRadius: '50%', border: '3px solid #666' }} />
          <div style={{ position: 'absolute', bottom: '-15px', right: '25px', width: '30px', height: '30px', background: '#1a1a1a', borderRadius: '50%', border: '3px solid #666' }} />
          <div style={{ position: 'absolute', bottom: '10px', right: '-4px', width: '8px', height: '20px', background: '#fff', borderRadius: '2px' }} />
        </div>
      </motion.div>
    </div>
  );
};

export default GateAnimation;
