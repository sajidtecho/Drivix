import React, { useState, useEffect, useRef } from 'react';

const AnimatedWatch = ({ size = 72 }) => {
  const [time, setTime] = useState(new Date());
  const animRef = useRef(null);

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date());
      animRef.current = requestAnimationFrame(updateTime);
    };
    animRef.current = requestAnimationFrame(updateTime);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const millis = time.getMilliseconds();

  // Smooth continuous sweeping angles
  const secAngle = ((seconds + millis / 1000) / 60) * 360;
  const minAngle = ((minutes + (seconds + millis / 1000) / 60) / 60) * 360;
  const hourAngle = (((hours % 12) + (minutes + seconds / 60) / 60) / 12) * 360;

  const formattedDigital = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      {/* 60fps Smooth Sweeping Watch Face */}
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        borderRadius: '50%',
        background: 'radial-gradient(circle, #161a2b 0%, #0a0c14 100%)',
        border: '2px solid rgba(250, 255, 0, 0.45)',
        boxShadow: '0 0 22px rgba(250, 255, 0, 0.25), inset 0 0 12px rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {/* Dial Ticks */}
        {[...Array(12)].map((_, i) => {
          const angle = i * 30;
          const isMajor = i % 3 === 0;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: isMajor ? '2.5px' : '1px',
                height: isMajor ? '8px' : '4px',
                background: isMajor ? 'var(--accent-primary, #FAFF00)' : 'rgba(255,255,255,0.25)',
                top: '5px',
                transformOrigin: `50% ${size / 2 - 5}px`,
                transform: `rotate(${angle}deg)`,
                borderRadius: '1px'
              }}
            />
          );
        })}

        {/* Hour Hand */}
        <div style={{
          position: 'absolute',
          width: '3.5px',
          height: `${size * 0.26}px`,
          background: '#ffffff',
          borderRadius: '3px',
          bottom: '50%',
          left: 'calc(50% - 1.75px)',
          transformOrigin: '50% 100%',
          transform: `rotate(${hourAngle}deg)`,
          boxShadow: '0 0 6px rgba(255,255,255,0.6)',
          zIndex: 4
        }} />

        {/* Minute Hand */}
        <div style={{
          position: 'absolute',
          width: '2.5px',
          height: `${size * 0.36}px`,
          background: '#00f2ff',
          borderRadius: '2px',
          bottom: '50%',
          left: 'calc(50% - 1.25px)',
          transformOrigin: '50% 100%',
          transform: `rotate(${minAngle}deg)`,
          boxShadow: '0 0 8px #00f2ff',
          zIndex: 5
        }} />

        {/* Second Hand (Sweeping Gold Needle) */}
        <div style={{
          position: 'absolute',
          width: '1.5px',
          height: `${size * 0.42}px`,
          background: 'var(--accent-primary, #FAFF00)',
          borderRadius: '1px',
          bottom: '50%',
          left: 'calc(50% - 0.75px)',
          transformOrigin: '50% 100%',
          transform: `rotate(${secAngle}deg)`,
          boxShadow: '0 0 10px var(--accent-primary, #FAFF00)',
          zIndex: 6
        }} />

        {/* Center Pivot Cap */}
        <div style={{
          width: '9px',
          height: '9px',
          borderRadius: '50%',
          background: 'var(--accent-primary, #FAFF00)',
          border: '2px solid #000',
          zIndex: 10,
          boxShadow: '0 0 10px rgba(250, 255, 0, 0.9)'
        }} />
      </div>

      {/* Live Digital Clock Telemetry Tag */}
      <div>
        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent-primary, #FAFF00)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
          Live Telemetry Clock
        </div>
        <div style={{
          fontSize: '0.92rem',
          fontWeight: 900,
          fontFamily: 'monospace',
          color: '#fff',
          letterSpacing: '0.05em',
          background: 'rgba(0,0,0,0.4)',
          padding: '3px 8px',
          borderRadius: '6px',
          border: '1px solid rgba(250,255,0,0.2)',
          display: 'inline-block'
        }}>
          {formattedDigital}
        </div>
      </div>
    </div>
  );
};

export default AnimatedWatch;
