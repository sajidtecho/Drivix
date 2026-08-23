import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import FadeIn from '../common/FadeIn';
import SupportModal from '../common/SupportModal';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import logoImg from '../../assets/Logo.png';
import aboutImg from '../../assets/drivix_concept_about.png';

const testimonials = [
  {
    name: "Sajid Ahmad",
    role: "Daily Commuter",
    text: "Drivix saved me 40 minutes of circling every morning. I book my spot while having coffee, and it's there when I arrive."
  },
  {
    name: "Irfan Khan",
    role: "Business Owner",
    text: "Finally, a parking solution that actually works in Noida. The pre-booking feature is a game-changer for my team."
  },
  {
    name: "Md.Bilal",
    role: "App User",
    text: "The security features and real-time updates give me peace of mind when leaving my car in crowded areas."
  }
];

/* ─── About Us Modal ─── */
const AboutUsModal = ({ onClose }) => {
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="glass-panel"
          style={{
            width: '100%', maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            borderRadius: 'var(--radius-card)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            position: 'relative'
          }}
        >
          <button 
            onClick={onClose}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', zIndex: 10 }}
          >
            <X size={22} />
          </button>

          {/* Banner Image */}
          <div style={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', border: '1px solid var(--glass-border)' }}>
            <img src={aboutImg} alt="Drivix Tech Space" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '12px', marginTop: 0 }}>
            About <span className="text-gradient">Drivix</span>
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
            Drivix is a leading-edge smart mobility and parking automation platform built in India. By bridging the gap between hardware IoT sensors, real-time WebSocket state management, and user-facing scheduling portals, Drivix enables drivers to eliminate parking stress entirely.
          </p>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Meet the Co-Founders
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {/* Founder 1 */}
            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), #FF5E3A)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 800, color: '#000' }}>SA</div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.98rem', fontWeight: 800 }}>Sajid Ahmad</h4>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>Co-Founder & CEO</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Lead visionary scaling the smart infrastructure ecosystem.</p>
            </div>
            {/* Founder 2 */}
            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-secondary), #00F2FE)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 800, color: '#000' }}>IK</div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.98rem', fontWeight: 800 }}>Irfan Khan</h4>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.78rem', color: 'var(--accent-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Co-Founder & COO</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Pioneering operations strategy and growth mechanics.</p>
            </div>
            {/* Founder 3 */}
            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #00FF87, #60EFFF)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 800, color: '#000' }}>MB</div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.98rem', fontWeight: 800 }}>Bilal</h4>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.78rem', color: '#00FF87', fontWeight: 700, textTransform: 'uppercase' }}>Co-Founder & CTO</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Technical mastermind engineering allocation logic.</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ─── Policy Modal ─── */
const PolicyModal = ({ onClose }) => {
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="glass-panel"
          style={{
            width: '100%', maxWidth: '550px',
            maxHeight: '80vh',
            overflowY: 'auto',
            padding: '30px',
            borderRadius: 'var(--radius-card)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            position: 'relative'
          }}
        >
          <button 
            onClick={onClose}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
          
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '20px', marginTop: 0 }}>
            Privacy <span className="text-gradient">Policy</span>
          </h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700, margin: '16px 0 8px' }}>1. Data Collection</h3>
            <p style={{ margin: '0 0 16px' }}>We collect vehicle plate numbers, GPS location logs, and phone statistics solely to coordinate automated ANPR gates and reserve slots at active parking hubs.</p>
            
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700, margin: '16px 0 8px' }}>2. Data Safety</h3>
            <p style={{ margin: '0 0 16px' }}>All transactions, routing logs, and credentials are encrypted using industry-standard TLS protocols. We do not sell or lease user metadata to third-party ad networks.</p>
            
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700, margin: '16px 0 8px' }}>3. Real-Time Tracking</h3>
            <p style={{ margin: 0 }}>Dynamic telemetry tracking is initialized on reservation confirm and terminates automatically upon slot exit check-out validation.</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ─── Terms Modal ─── */
const TermsModal = ({ onClose }) => {
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="glass-panel"
          style={{
            width: '100%', maxWidth: '550px',
            maxHeight: '80vh',
            overflowY: 'auto',
            padding: '30px',
            borderRadius: 'var(--radius-card)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            position: 'relative'
          }}
        >
          <button 
            onClick={onClose}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
          
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '20px', marginTop: 0 }}>
            Terms & <span className="text-gradient">Conditions</span>
          </h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700, margin: '16px 0 8px' }}>1. Booking Reservations</h3>
            <p style={{ margin: '0 0 16px' }}>Drivers are assigned specific parking space coordinates. Arriving at incorrect levels or slots might trigger check-in override notifications.</p>
            
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700, margin: '16px 0 8px' }}>2. Cancellation Guidelines</h3>
            <p style={{ margin: '0 0 16px' }}>Reservations are held for exactly 15 minutes post-start time. Unconfirmed bookings are auto-cancelled to free capacity for waiting commuters.</p>
            
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700, margin: '16px 0 8px' }}>3. Multipliers & Dynamic Pricing</h3>
            <p style={{ margin: 0 }}>Extended parking usage beyond selected durations triggers hourly billing multipliers. Users are responsible for clearing all dues prior to exit gate release.</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const FooterSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const navigate = useNavigate();
  const { isAuthenticated } = useUser();
  return (
    <footer style={{
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      paddingTop: '80px',
      paddingBottom: '60px',
      position: 'relative',
      overflow: 'hidden',
      borderTop: '1px solid var(--glass-border)'
    }}>
      {/* Massive Typographic Background */}
      <div style={{
        position: 'absolute',
        top: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 'clamp(6rem, 18vw, 15rem)',
        fontWeight: 100,
        fontFamily: 'var(--font-display)',
        color: 'var(--text-primary)',
        opacity: 0.03,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        letterSpacing: '-0.05em',
        lineHeight: 1,
        zIndex: 0
      }}>
        PARK SMARTER.
      </div>

      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 5%', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '100px' }}>
          <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1, marginBottom: '24px', marginTop: '0' }}>
            Ready to stop <br /><span style={{ color: 'var(--accent-primary)' }}>circling the block?</span>
          </h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '500px', marginBottom: '48px' }}>
            Join the movement of drivers who find their spot before they even turn the ignition.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button className="btn btn-primary" style={{ padding: '20px 40px', fontSize: '1.1rem' }}>Get the App</button>
            <button
              className="btn btn-primary"
              onClick={() => navigate(isAuthenticated ? '/find' : '/login')}
              style={{ padding: '20px 40px', fontSize: '1.1rem' }}
            >
              Book Now
            </button>
          </div>
        </div>

        {/* Testimonial Carousel */}
        <FadeIn delay={0.4}>
          <div className="glass-panel" style={{
            padding: 'clamp(28px, 6vw, 60px)',
            marginBottom: '80px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(20px, 4vw, 40px)',
            alignItems: 'center',
            background: 'var(--bg-tertiary)',
            borderLeft: '4px solid var(--accent-primary)',
            width: '100%',
            boxSizing: 'border-box',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ flex: 1, minWidth: 'unset', width: '100%', position: 'relative', minHeight: '180px' }}>
              {testimonials.map((test, index) => (
                <div
                  key={index}
                  style={{
                    position: index === currentSlide ? 'relative' : 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    opacity: index === currentSlide ? 1 : 0,
                    transform: `translateY(${index === currentSlide ? 0 : (index < currentSlide ? '-20px' : '20px')})`,
                    transition: 'all 0.5s ease-in-out',
                    pointerEvents: index === currentSlide ? 'auto' : 'none'
                  }}
                >
                  <div style={{
                    fontSize: 'clamp(1.15rem, 4.5vw, 1.85rem)',
                    fontWeight: 300,
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                    marginBottom: '20px',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em'
                  }}>
                    "{test.text}"
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--accent-primary), var(--accent-warm))' }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600 }}>{test.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{test.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dots */}
            <div style={{ display: 'flex', gap: '8px', position: 'absolute', bottom: 'clamp(15px, 4vw, 30px)', right: 'clamp(15px, 4vw, 40px)' }}>
              {testimonials.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  style={{
                    width: '8px', height: '8px', borderRadius: '50%', cursor: 'pointer',
                    background: currentSlide === idx ? 'var(--accent-primary)' : 'var(--glass-border)',
                    transition: 'all 0.3s'
                  }}
                />
              ))}
            </div>
          </div>
        </FadeIn>


        {/* Dense row of links */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '60px',
          borderTop: '1px solid var(--glass-border)',
          flexWrap: 'wrap',
          gap: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-button)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <img src={logoImg} alt="Drivix Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.03em' }}>Drivix</span>
          </div>


          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {['Safety', 'Policy', 'Terms & Conditions', 'Network', 'Support', 'Careers', 'About Us'].map(link => (
              <span
                key={link}
                onClick={() => {
                  if (link === 'Safety') navigate('/safety');
                  if (link === 'Policy') setIsPolicyOpen(true);
                  if (link === 'Terms & Conditions') setIsTermsOpen(true);
                  if (link === 'Support') setIsSupportOpen(true);
                  if (link === 'About Us') setIsAboutOpen(true);
                }}
                style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
              >
                {link}
              </span>
            ))}
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            Built in India With ❤️ By Sajid Ahmad • © 2026
          </div>
        </div>
      </div>
      {isSupportOpen && <SupportModal onClose={() => setIsSupportOpen(false)} />}
      {isAboutOpen && <AboutUsModal onClose={() => setIsAboutOpen(false)} />}
      {isPolicyOpen && <PolicyModal onClose={() => setIsPolicyOpen(false)} />}
      {isTermsOpen && <TermsModal onClose={() => setIsTermsOpen(false)} />}
    </footer>
  );
};

export default FooterSection;
