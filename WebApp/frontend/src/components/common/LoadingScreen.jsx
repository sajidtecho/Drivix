import React from 'react';
import loadingVideoWebm from '../../assets/Loading_car.webm';
import loadingVideoMp4 from '../../assets/Loading_car.mp4';

const LoadingScreen = () => {
  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', gap: '0' }}>
      <div style={{ width: '400px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        >
          <source src={loadingVideoWebm} type="video/webm" />
          <source src={loadingVideoMp4} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      <div style={{ marginTop: '-45px', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
        <h2> Driving to your spot...</h2>
      </div>
    </div>
  );
};

export default LoadingScreen;
