import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Car, AlertTriangle, CreditCard } from 'lucide-react';
import parkingVideo from '../../assets/Parking_Web.m4v';
import challanVideo from '../../assets/challan_video.mp4';
import fastagVideo from '../../assets/fastag_video.mp4';
import billPaymentsVideo from '../../assets/Bill_payments.mp4';
import testDriveVideo from '../../assets/test_drive.mp4';

const TABS = [
  {
    id: 'parking',
    title: 'Car Parking',
    description: 'No more running in circles to find parking in your city! Book a parking stop for your car whenever you go out in some simple steps.',
    icon: Car,
    path: '/find',
    btnText: 'Book Parking Spot',
    isAvailable: true,
  },
  {
    id: 'challan',
    title: 'Traffic Challan',
    description: 'Check the status of your traffic police challan online - quickly and easily.',
    icon: AlertTriangle,
    path: 'https://echallan.parivahan.gov.in/index/accused-challan',
    btnText: 'Check Challan Status',
    isAvailable: true,
  },
  {
    id: 'fastag',
    title: 'FASTag',
    description: 'Recharge or buy a FASTag instantly and save more on your road trips.',
    icon: CreditCard,
    path: 'https://paytm.com/fastag-recharge',
    btnText: 'Recharge FASTag',
    isAvailable: true,
  },
  {
    id: 'testdrive',
    title: 'Test Drive',
    description: 'Book a free test drive for your favorite car model right from your phone.',
    icon: Car,
    path: 'https://www.carwale.com/book-test-drive/',
    btnText: 'Book Test Drive',
    isAvailable: true,
  },
  {
    id: 'payments',
    title: 'Bill Payments',
    description: 'Secure utility bill payments with absolute convenience and extra savings.',
    icon: CreditCard,
    path: 'https://paytm.com/rent-payment',
    btnText: 'Pay Utility Bills',
    isAvailable: true,
  },
  {
    id: 'valet',
    title: 'Valet Services',
    description: 'Premium on-demand valet services for commercial hubs and private events.',
    icon: Car,
    isAvailable: false,
  },
];

const ShowcaseSection = () => {
  const navigate = useNavigate();
  // 'parking' is active, others are placeholders for the future
  const [activeTab, setActiveTab] = useState('parking');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTabClick = (tab) => {
    if (tab.isAvailable) {
      setActiveTab(tab.id);
    }
  };

  return (
    <section className="showcase-section" style={{ padding: '100px 0', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden' }}>
      {/* Background Decorative Glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: 'var(--accent-glow)',
        filter: 'blur(150px)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <style>{`
        .showcase-container {
          display: grid;
          grid-template-columns: 4fr 6.5fr;
          gap: 50px;
          align-items: flex-start;
          width: 100%;
          position: relative;
          z-index: 1;
        }

        .showcase-header {
          margin-bottom: 50px;
          text-align: left;
        }

        .tab-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tab-item {
          border-radius: var(--radius-card);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid transparent;
        }

        .tab-item.active {
          background: var(--accent-primary);
          color: #000000;
          padding: 24px;
          box-shadow: 0 15px 35px rgba(255, 206, 0, 0.25);
        }

        .tab-item.inactive {
          background: transparent;
          color: var(--text-primary);
          padding: 16px 20px;
          opacity: 0.8;
        }

        .tab-item.inactive:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.03);
          border-color: var(--glass-border);
        }

        .tab-item.disabled {
          cursor: not-allowed;
          position: relative;
        }

        .tab-item.disabled:hover .coming-soon-tag {
          opacity: 1;
          transform: translateY(-50%) scale(1);
        }

        .coming-soon-tag {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%) scale(0.95);
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          opacity: 0;
          transition: all 0.2s ease;
          pointer-events: none;
        }

        .media-panel-container {
          background: var(--glass-bg);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid var(--glass-border);
          border-radius: 32px;
          padding: 16px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.25);
          position: relative;
          overflow: hidden;
          width: 100%;
          display: flex;
          align-items: center;
          justifyContent: center;
        }

        .video-wrapper {
          width: 100%;
          height: 100%;
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          background: #000;
          box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.8);
        }

        .video-player {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-overlay-glow {
          position: absolute;
          inset: 0;
          box-shadow: inset 0 0 20px rgba(255, 206, 0, 0.1);
          pointer-events: none;
          border-radius: 20px;
          border: 1px solid rgba(255, 206, 0, 0.15);
        }

        @media (max-width: 1024px) {
          .showcase-container {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .media-panel-container {
            max-width: 700px;
            margin: 0 auto;
          }
        }

        @media (max-width: 640px) {
          .showcase-header h2 {
            font-size: 2.2rem !important;
          }
          .coming-soon-tag {
            opacity: 0.6;
            position: relative;
            right: auto;
            top: auto;
            transform: none;
            display: inline-block;
            margin-top: 6px;
          }
          .tab-item.disabled {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%' }}>
        
        {/* Section Header */}
        <div className="showcase-header">
          <h2 style={{
            fontSize: '3rem',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.03em',
            marginBottom: '16px'
          }}>
            Explore our <span className="text-gradient">Core Services</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px' }}>
            Interactive features built to remove friction from every touchpoint of your journey.
          </p>
        </div>

        {/* Core Showcase Grid */}
        <div className="showcase-container">
          
          {/* Left Column: Tab switcher list */}
          <div className="tab-list">
            <AnimatePresence initial={false}>
              {TABS.map((tab, index) => {
                const activeIndex = TABS.findIndex(t => t.id === activeTab);
                if (isMobile && index > activeIndex + 1) return null;

                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <motion.div
                    key={tab.id}
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    onClick={() => handleTabClick(tab)}
                    className={`tab-item ${isActive ? 'active' : 'inactive'} ${!tab.isAvailable ? 'disabled' : ''}`}
                    style={{ overflow: 'hidden' }}
                  >
                  {isActive ? (
                    <motion.div
                      layoutId="activeTabDetails"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          background: '#000000',
                          color: 'var(--accent-primary)',
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <TabIcon size={20} />
                        </div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#000000', fontFamily: 'var(--font-display)' }}>
                          {tab.title}
                        </h3>
                        <span style={{
                          background: '#000000',
                          color: '#FFFFFF',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '20px',
                          marginLeft: 'auto',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Active
                        </span>
                      </div>

                      <p style={{
                        fontSize: '0.9rem',
                        lineHeight: '1.5',
                        fontWeight: 600,
                        color: 'rgba(0, 0, 0, 0.8)',
                        margin: 0
                      }}>
                        {tab.description}
                      </p>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (tab.path) {
                            if (tab.path.startsWith('http')) {
                              window.open(tab.path, '_blank', 'noopener,noreferrer');
                            } else {
                              navigate(tab.path);
                            }
                          }
                        }}
                        style={{
                          alignSelf: 'flex-start',
                          background: '#000000',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '12px 20px',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.25)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.15)';
                        }}
                      >
                        {tab.btnText} &rarr;
                      </button>
                    </motion.div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-secondary)',
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <TabIcon size={16} />
                      </div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)' }}>
                        {tab.title}
                      </h4>
                      {!tab.isAvailable && (
                        <span className="coming-soon-tag">Coming Soon</span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>

          {/* Right Column: Visual Player */}
          <div 
            className="media-panel-container"
            style={{
              aspectRatio: activeTab === 'parking' ? '4/3' : '16/9',
              maxWidth: activeTab === 'parking' ? '100%' : '700px',
              margin: '0 auto',
              transition: 'aspect-ratio 0.3s ease, max-width 0.3s ease'
            }}
          >
            <AnimatePresence mode="wait">
              {activeTab === 'parking' && (
                <motion.div
                  key="parking-video"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="video-wrapper"
                >
                  <video
                    src={parkingVideo}
                    className="video-player"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                  <div className="video-overlay-glow" />
                </motion.div>
              )}
              {activeTab === 'challan' && (
                <motion.div
                  key="challan-video"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="video-wrapper"
                >
                  <video
                    src={challanVideo}
                    className="video-player"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                  <div className="video-overlay-glow" />
                </motion.div>
              )}
              {activeTab === 'fastag' && (
                <motion.div
                  key="fastag-video"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="video-wrapper"
                >
                  <video
                    src={fastagVideo}
                    className="video-player"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                  <div className="video-overlay-glow" />
                </motion.div>
              )}
              {activeTab === 'payments' && (
                <motion.div
                  key="payments-video"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="video-wrapper"
                >
                  <video
                    src={billPaymentsVideo}
                    className="video-player"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                  <div className="video-overlay-glow" />
                </motion.div>
              )}
              {activeTab === 'testdrive' && (
                <motion.div
                  key="testdrive-video"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="video-wrapper"
                >
                  <video
                    src={testDriveVideo}
                    className="video-player"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                  <div className="video-overlay-glow" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ShowcaseSection;
