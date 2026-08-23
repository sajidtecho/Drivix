import React, { useState, useRef, useEffect } from 'react';
import loadingVideoWebm from '../../assets/Loading_car.webm';
import loadingVideoMp4 from '../../assets/Loading_car.mp4';

const VideoLoader = ({ size = 100 }) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [playFailed, setPlayFailed] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      // Programmatic attributes setting to bypass React browser hydration bugs
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn("Video autoplay blocked by browser/mode:", error);
          setPlayFailed(true);
        });
      }
    }
  }, []);

  return (
    <div style={{ position: 'relative', width: `${size}px`, height: `${size / 2}px`, display: 'inline-block' }}>
      {/* SVG Fallback (Always displays instantly, remains if video fails/is blocked) */}
      {(!videoLoaded || playFailed) && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <style>{`
            @keyframes drive {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-1.5px); }
            }
            @keyframes roadMove {
              0% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: -16; }
            }
            .fallback-car {
              animation: drive 1.2s ease-in-out infinite;
            }
            .fallback-road {
              animation: roadMove 0.5s linear infinite;
            }
          `}</style>
          <svg viewBox="0 0 120 60" width="100%" height="100%" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="fallbackCarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--accent-secondary)" />
                <stop offset="100%" stopColor="var(--accent-primary)" />
              </linearGradient>
            </defs>
            <g className="fallback-car">
              <ellipse cx="58" cy="47" rx="38" ry="4" fill="var(--accent-glow)" />
              {/* Car Body */}
              <path
                d="M 12,42 L 18,42 C 20,35, 34,35, 36,42 L 80,42 C 82,35, 96,35, 98,42 L 110,42 L 106,34 C 102,28, 92,20, 80,20 L 42,22 L 26,27 C 20,30, 14,35, 12,42 Z"
                fill="url(#fallbackCarGrad)"
              />
              <path d="M 44,23.5 L 68,21.5 C 74,21.5, 84,25, 86,29 L 88,32.5 L 40,32.5 Z" fill="var(--bg-primary)" opacity="0.85" />
              {/* Wheels */}
              <circle cx="27" cy="42" r="7" fill="#09090b" stroke="var(--text-primary)" strokeWidth="2" />
              <circle cx="88" cy="42" r="7" fill="#09090b" stroke="var(--text-primary)" strokeWidth="2" />
            </g>
            {/* Moving Road */}
            <line x1="5" y1="50" x2="115" y2="50" stroke="var(--text-secondary)" strokeWidth="2" strokeDasharray="8 8" className="fallback-road" opacity="0.35" />
          </svg>
        </div>
      )}

      {/* Video Element (Fades in smoothly when it is ready to play) */}
      {!playFailed && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          onCanPlay={() => setVideoLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: videoLoaded ? 1 : 0,
            transition: 'opacity 0.4s ease-in-out',
            position: 'absolute',
            inset: 0
          }}
        >
          <source src={loadingVideoWebm} type="video/webm" />
          <source src={loadingVideoMp4} type="video/mp4" />
        </video>
      )}
    </div>
  );
};

export default VideoLoader;
