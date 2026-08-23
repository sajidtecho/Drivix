import React from 'react';
import VideoLoader from './VideoLoader';

const LoadingScreen = () => {
  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', gap: '30px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <VideoLoader size={200} />
      </div>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'center' }}>
        <h2> Driving to your spot...</h2>
      </div>
    </div>
  );
};

export default LoadingScreen;
