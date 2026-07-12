import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { API_BASE_URL } from '../config';

const AdCarousel = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const autoPlayRef = useRef(null);
  
  // Tracked banners to avoid double impressions in the same session
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

  // Analytics helper for impressions
  useEffect(() => {
    if (banners.length === 0) return;
    const currentBanner = banners[currentIndex];
    if (!currentBanner) return;

    const bannerId = currentBanner._id;
    if (!trackedImpressions.current.has(bannerId)) {
      trackedImpressions.current.add(bannerId);
      // Fire impression tracking call in background
      fetch(`${API_BASE_URL}/api/v1/banners/${bannerId}/impression`, {
        method: 'POST'
      }).catch(err => console.error('Impression tracking error:', err));
    }
  }, [currentIndex, banners]);

  // Autoplay setup
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
      <h3 
        style={{
          fontSize: '1.8rem',
          fontWeight: 800,
          color: '#ffffff',
          marginBottom: '10px',
          lineHeight: 1.25
        }}
      >
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading advertisements...</p>
      </div>
    );
  }

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  return (
    <div 
      className="glass-panel"
      style={{
        position: 'relative',
        width: '100%',
        height: '220px',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
        border: '1.5px solid var(--glass-border)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        background: 'var(--bg-tertiary)',
        marginBottom: '24px'
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '32px 48px'
          }}
        >
          {/* Blended Background Watermark Image */}
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              overflow: 'hidden'
            }}
          >
            <img 
              src={currentBanner.imageUrl} 
              alt={currentBanner.title}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.12
              }}
            />
            <div 
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at center, transparent 30%, var(--bg-tertiary) 90%)'
              }}
            />
          </div>

          {/* Left Column: Hero-style Text Layout */}
          <div 
            style={{
              position: 'relative',
              zIndex: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: '80%',
              gap: '6px'
            }}
          >
            <span 
              style={{
                fontSize: '0.75rem',
                fontWeight: 900,
                color: 'var(--accent-primary)',
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}
            >
              Sponsored Promotion
            </span>
            
            {renderHeroStyleTitle(currentBanner.title)}
            
            <p 
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.92rem',
                lineHeight: 1.45,
                marginBottom: '16px',
                maxWidth: '650px'
              }}
            >
              {currentBanner.description}
            </p>
            
            <button
              onClick={() => handleBannerClick(currentBanner)}
              className="btn btn-primary"
              style={{
                alignSelf: 'flex-start',
                padding: '10px 24px',
                fontSize: '0.85rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                borderRadius: '24px', // Capsule Shape
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
            style={{
              position: 'absolute',
              top: '50%',
              left: '12px',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid var(--glass-border)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={handleNext}
            style={{
              position: 'absolute',
              top: '50%',
              right: '12px',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid var(--glass-border)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Pagination Dot Indicators (Top Right Capsule) */}
      {banners.length > 1 && (
        <div 
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            display: 'flex',
            gap: '6px',
            zIndex: 10,
            background: 'rgba(0,0,0,0.45)',
            padding: '6px 10px',
            borderRadius: '12px'
          }}
        >
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              style={{
                width: index === currentIndex ? '16px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: index === currentIndex ? 'var(--accent-primary)' : 'rgba(255,255,255,0.4)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdCarousel;
