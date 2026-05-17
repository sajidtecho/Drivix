import React from 'react';
import loadingVideo from '../../assets/Loading_car.webm';

const LoadingScreen = () => {
  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', gap: '0' }}>
      <div style={{ width: '400px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <video
          src={loadingVideo}
          autoPlay
          loop
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
      <div style={{ marginTop: '-40px', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
        <h2> Driving to your spot...</h2>
      </div>
    </div>
  );
};

export default LoadingScreen;
