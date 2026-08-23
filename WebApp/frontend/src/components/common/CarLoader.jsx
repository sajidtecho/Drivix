import React from 'react';

const CarLoader = ({ size = 100 }) => {
  return (
    <div style={{ position: 'relative', width: `${size}px`, height: `${size / 2}px`, display: 'inline-block' }}>
      <style>{`
        @keyframes drive {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1.5px); }
        }
        @keyframes roadMove {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -16; }
        }
        @keyframes windLine {
          0% { transform: translateX(20px); opacity: 0; }
          30% { opacity: 0.6; }
          70% { opacity: 0.6; }
          100% { transform: translateX(-40px); opacity: 0; }
        }
        @keyframes tailLight {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.3; }
        }
        .animate-car-body {
          animation: drive 1.2s ease-in-out infinite;
        }
        .animate-road {
          animation: roadMove 0.5s linear infinite;
        }
        .wind-line-1 {
          animation: windLine 0.7s linear infinite;
        }
        .wind-line-2 {
          animation: windLine 1.0s linear infinite 0.15s;
        }
        .wind-line-3 {
          animation: windLine 0.8s linear infinite 0.3s;
        }
      `}</style>
      <svg
        viewBox="0 0 120 60"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        {/* Glow behind the car */}
        <defs>
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="carBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent-secondary)" />
            <stop offset="100%" stopColor="var(--accent-primary)" />
          </linearGradient>
        </defs>

        {/* Speed / Wind Lines */}
        <g stroke="var(--text-secondary)" strokeWidth="1.2" opacity="0.5" strokeLinecap="round">
          <line x1="110" y1="18" x2="130" y2="18" className="wind-line-1" />
          <line x1="105" y1="28" x2="120" y2="28" className="wind-line-2" />
          <line x1="115" y1="38" x2="135" y2="38" className="wind-line-3" />
        </g>

        {/* The Car */}
        <g className="animate-car-body">
          {/* Neon Underglow */}
          <ellipse cx="58" cy="47" rx="38" ry="4" fill="var(--accent-glow)" filter="url(#neon-glow)" />

          {/* Sleek sports car body */}
          <path
            d="M 12,42 
               L 18,42 
               C 20,35, 34,35, 36,42 
               L 80,42 
               C 82,35, 96,35, 98,42 
               L 110,42 
               L 106,34 
               C 102,28, 92,20, 80,20 
               L 42,22 
               L 26,27 
               C 20,30, 14,35, 12,42 Z"
            fill="url(#carBodyGrad)"
          />

          {/* Windows / Cabin */}
          <path
            d="M 44,23.5 
               L 68,21.5 
               C 74,21.5, 84,25, 86,29 
               L 88,32.5 
               L 40,32.5 
               Z"
            fill="var(--bg-primary)"
            opacity="0.85"
          />
          <path
            d="M 60,22 
               L 61,32.5 
               L 86.5,32.5 
               C 85,30, 78,25, 70,22 
               Z"
            fill="var(--bg-primary)"
            opacity="0.35"
          />

          {/* Tail light */}
          <path
            d="M 11.5,37 C 11.5,35, 13,35, 13,37 Z"
            fill="#ff3b30"
            stroke="#ff3b30"
            strokeWidth="0.8"
            filter="url(#neon-glow)"
            style={{ animation: 'tailLight 1.5s infinite' }}
          />

          {/* Wheels (using native SVG animateTransform for 100% browser-compatible rotation) */}
          <g>
            <circle cx="27" cy="42" r="7" fill="#09090b" stroke="var(--text-primary)" strokeWidth="2" />
            <circle cx="27" cy="42" r="3.5" fill="none" stroke="var(--accent-primary)" strokeWidth="1" />
            <line x1="27" y1="35" x2="27" y2="49" stroke="var(--accent-primary)" strokeWidth="1" />
            <line x1="20" y1="42" x2="34" y2="42" stroke="var(--accent-primary)" strokeWidth="1" />
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 27 42"
              to="360 27 42"
              dur="0.4s"
              repeatCount="indefinite"
            />
          </g>

          <g>
            <circle cx="88" cy="42" r="7" fill="#09090b" stroke="var(--text-primary)" strokeWidth="2" />
            <circle cx="88" cy="42" r="3.5" fill="none" stroke="var(--accent-primary)" strokeWidth="1" />
            <line x1="88" y1="35" x2="88" y2="49" stroke="var(--accent-primary)" strokeWidth="1" />
            <line x1="81" y1="42" x2="95" y2="42" stroke="var(--accent-primary)" strokeWidth="1" />
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 88 42"
              to="360 88 42"
              dur="0.4s"
              repeatCount="indefinite"
            />
          </g>
        </g>

        {/* Road (running dashes) */}
        <line
          x1="5"
          y1="50"
          x2="115"
          y2="50"
          stroke="var(--text-secondary)"
          strokeWidth="2"
          strokeDasharray="8 8"
          strokeLinecap="round"
          className="animate-road"
          opacity="0.35"
        />
      </svg>
    </div>
  );
};

export default CarLoader;
