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
        height: '240px',
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
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            flexDirection: 'row',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        >
          {/* Text content section */}
          <div 
            style={{
              flex: 1.2,
              padding: '32px 40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              zIndex: 3
            }}
          >
            <span 
              style={{
                fontSize: '0.75rem',
                fontWeight: 900,
                color: 'var(--accent-primary)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}
            >
              Sponsored Promotion
            </span>
            <h3 
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '8px',
                lineHeight: 1.2
              }}
            >
              {currentBanner.title}
            </h3>
            <p 
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                lineHeight: 1.4,
                marginBottom: '20px',
                maxHeight: '60px',
                overflow: 'hidden'
              }}
            >
              {currentBanner.description}
            </p>
            
            <button
              onClick={() => handleBannerClick(currentBanner)}
              className="btn btn-primary"
              style={{
                alignSelf: 'flex-start',
                padding: '10px 20px',
                fontSize: '0.85rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                borderRadius: 'var(--radius-button)',
                boxShadow: '0 4px 15px var(--accent-glow)'
              }}
            >
              {currentBanner.ctaText} 
              {currentBanner.redirectUrl.startsWith('http') && <ExternalLink size={13} />}
            </button>
          </div>

          {/* Image visual section */}
          <div 
            style={{
              flex: 1,
              height: '100%',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Visual fade overlays */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '120px',
                background: 'linear-gradient(to right, var(--bg-tertiary) 0%, transparent 100%)',
                zIndex: 2
              }}
            />
            <img 
              src={currentBanner.imageUrl} 
              alt={currentBanner.title}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.85
              }}
            />
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

      {/* Pagination Dot Indicators */}
      {banners.length > 1 && (
        <div 
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '40px',
            display: 'flex',
            gap: '8px',
            zIndex: 10
          }}
        >
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              style={{
                width: index === currentIndex ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: index === currentIndex ? 'var(--accent-primary)' : 'rgba(255,255,255,0.25)',
                border: 'none',
                cursor: 'pointer',
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
