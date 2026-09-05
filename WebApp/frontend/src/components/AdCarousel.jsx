import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { API_BASE_URL } from '../config';

const AdCarousel = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const autoPlayRef = useRef(null);
  const trackedImpressions = useRef(new Set());

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/banners`);
        if (res.ok) {
          const data = await res.json();
          setBanners(data);
        }
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;
    const currentBanner = banners[currentIndex];
    if (!currentBanner) return;

    const bannerId = currentBanner._id;
    if (!trackedImpressions.current.has(bannerId)) {
      trackedImpressions.current.add(bannerId);
      fetch(`${API_BASE_URL}/api/v1/banners/${bannerId}/impression`, {
        method: 'POST'
      }).catch(err => console.error('Impression tracking error:', err));
    }
  }, [currentIndex, banners]);

  useEffect(() => {
    if (banners.length <= 1) return;
    autoPlayRef.current = setInterval(() => {
      handleNext();
    }, 5000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [currentIndex, banners]);

  const handlePrev = () => {
    if (banners.length === 0) return;
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (banners.length === 0) return;
    setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  const handleBannerClick = async (banner) => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/banners/${banner._id}/click`, {
        method: 'POST'
      });
    } catch (err) {
      console.error('Click tracking error:', err);
    }

    if (banner.redirectUrl.startsWith('http')) {
      window.open(banner.redirectUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = banner.redirectUrl;
    }
  };

  const renderHeroStyleTitle = (titleText) => {
    const separators = ['|', '-', ':'];
    let parts = [];
    for (const sep of separators) {
      if (titleText.includes(sep)) {
        parts = titleText.split(sep);
        break;
      }
    }
    if (parts.length < 2) {
      const words = titleText.split(' ');
      if (words.length > 2) {
        const mid = Math.ceil(words.length / 2);
        parts = [
          words.slice(0, mid).join(' '),
          words.slice(mid).join(' ')
        ];
      } else {
        parts = [titleText, ''];
      }
    }
    const firstLine = parts[0].trim();
    const secondLine = parts.slice(1).join(' ').trim();

    return (
      <h3 className="ad-hero-title">
        {firstLine}
        {secondLine && (
          <>
            <br />
            <span style={{ color: 'var(--accent-primary)' }}>{secondLine}</span>
          </>
        )}
      </h3>
    );
  };

  if (loading) return null;
  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  return (
    <div className="glass-panel ad-carousel-container">
      <style>{`
        .ad-carousel-container {
          position: relative;
          width: 100%;
          min-height: 200px;
          border-radius: var(--radius-card);
          overflow: hidden;
          border: 1.5px solid var(--glass-border);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          background: var(--bg-tertiary);
          margin-bottom: 24px;
        }
        .ad-content-wrapper {
          position: relative;
          z-index: 3;
          display: flex;
          flex-direction: column;
          justify-content: center;
          width: 85%;
          padding: 24px 36px;
        }
        .ad-hero-title {
          font-size: 1.6rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 8px;
          line-height: 1.2;
        }
        .ad-description {
          color: var(--text-secondary);
          font-size: 0.88rem;
          line-height: 1.4;
          margin-bottom: 14px;
          max-width: 600px;
        }
        @media (max-width: 640px) {
          .ad-carousel-container {
            min-height: 170px;
          }
          .ad-content-wrapper {
            width: 100% !important;
            padding: 16px 32px 14px 28px !important;
          }
          .ad-hero-title {
            font-size: 1.12rem !important;
            margin-bottom: 4px !important;
          }
          .ad-description {
            font-size: 0.78rem !important;
            line-height: 1.35 !important;
            margin-bottom: 10px !important;
          }
          .ad-cta-btn {
            padding: 7px 14px !important;
            font-size: 0.75rem !important;
          }
          .ad-nav-btn {
            width: 26px !important;
            height: 26px !important;
          }
        }
      `}</style>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          style={{ position: 'relative', width: '100%', height: '100%', minHeight: 'inherit' }}
        >
          {/* Watermark Image Background */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden' }}>
            <img 
              src={currentBanner.imageUrl} 
              alt={currentBanner.title}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.14 }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 20%, var(--bg-tertiary) 85%)' }} />
          </div>

          <div className="ad-content-wrapper">
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--accent-primary)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2px' }}>
              Sponsored Promotion
            </span>
            
            {renderHeroStyleTitle(currentBanner.title)}
            
            <p className="ad-description">
              {currentBanner.description}
            </p>
            
            <button
              onClick={() => handleBannerClick(currentBanner)}
              className="btn btn-primary ad-cta-btn"
              style={{
                alignSelf: 'flex-start',
                padding: '9px 20px',
                fontSize: '0.82rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                borderRadius: '24px',
                boxShadow: '0 4px 15px var(--accent-glow)',
                border: 'none',
                background: 'var(--accent-primary)',
                color: '#000'
              }}
            >
              {currentBanner.ctaText} 
              {currentBanner.redirectUrl.startsWith('http') && <ExternalLink size={13} />}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Manual control arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="ad-nav-btn"
            style={{
              position: 'absolute', top: '50%', left: '4px', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.6)', border: '1px solid var(--glass-border)',
              borderRadius: '50%', width: '32px', height: '32px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#ffffff', cursor: 'pointer', zIndex: 10
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNext}
            className="ad-nav-btn"
            style={{
              position: 'absolute', top: '50%', right: '4px', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.6)', border: '1px solid var(--glass-border)',
              borderRadius: '50%', width: '32px', height: '32px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#ffffff', cursor: 'pointer', zIndex: 10
            }}
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {banners.length > 1 && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '4px', zIndex: 10, background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '10px' }}>
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              style={{
                width: index === currentIndex ? '14px' : '5px',
                height: '5px',
                borderRadius: '3px',
                background: index === currentIndex ? 'var(--accent-primary)' : 'rgba(255,255,255,0.4)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.25s ease'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdCarousel;
