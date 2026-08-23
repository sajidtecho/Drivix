import React from 'react';
import loadingVideo from '../../assets/Loading_car.mp4';

const LoadingScreen = () => {
  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ width: '300px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <video
          src={loadingVideo}
          autoPlay
          loop
          muted
          playsInline
          className="loader-video"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
        <h2> Driving to your spot...</h2>
      </div>
    </div>
  );
};

export default LoadingScreen;
