import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserCircle, Sun, Moon } from 'lucide-react';
import { useUser } from '../hooks/useUser';

// Nav links for each context
const LANDING_LINKS = [
  { label: 'The Problem', scrollId: 'problem' },
  { label: 'How It Works', scrollId: 'how-it-works' },
  { label: 'App Features', scrollId: 'features' },
];

const APP_LINKS = [
  { label: 'Book Slot', path: '/slot-layout' },
  { label: 'Services', path: '/services' },
];

const Navbar = () => {
  const { user, isAuthenticated } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = location.pathname === '/';
  const [hasScrolled, setHasScrolled] = useState(false);
  
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : document.documentElement.getAttribute('data-theme') === 'dark';
  });

  const scrolled = isLanding && hasScrolled;

  useEffect(() => {
    if (!isLanding) return;
    const handleScroll = () => setHasScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLanding]);

  // Apply theme change
  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <>
      {/* Handcrafted Announcement Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '32px',
        background: 'var(--announcement-bg)',
        color: 'var(--announcement-text)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        zIndex: 1001,
        transition: 'all 0.4s ease'
      }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--announcement-text)', marginRight: '10px', boxShadow: '0 0 10px currentColor' }} />
        NOIDA, INDIA — LIVE ALPHA
      </div>

      <nav
        className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}
        style={{
          position: 'fixed',
          top: '32px',
          left: 0,
          right: 0,
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 5%',
          zIndex: 1000,
          background: scrolled || isMenuOpen ? 'var(--bg-primary)' : 'transparent',
          backdropFilter: scrolled || isMenuOpen ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--glass-border)' : 'none',
          transition: 'all 0.5s var(--transition-normal)',
        }}
      >
        {/* Logo */}
        <Link 
          to="/" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            textDecoration: 'none',
            color: 'var(--text-primary)',
            marginRight: 'auto'
          }}
          onClick={() => setIsMenuOpen(false)}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(250, 255, 0, 0.3)'
          }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#000' }}>D</span>
          </div>
          <span style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.05em', color: 'var(--text-primary)' }}>
            Drivix
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
        }} className="desktop-only">
          {isLanding ? 
            LANDING_LINKS.map((link) => (
              <button
                key={link.scrollId}
                onClick={() => scrollTo(link.scrollId)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'color var(--transition-fast)',
                }}
              >
                {link.label}
              </button>
            )) : 
            APP_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  textDecoration: 'none',
                  color: location.pathname === link.path ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                }}
              >
                {link.label}
              </Link>
            ))}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          <div className="desktop-only" style={{ display: 'flex', gap: '12px' }}>
            {isLanding && (
              <button
                onClick={() => isAuthenticated ? navigate('/slot-layout') : navigate('/login')}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Start Booking
              </button>
            )}
          </div>

          {/* Profile & Theme */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAuthenticated ? (
              <Link
                to="/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '50px',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                <UserCircle size={20} color="var(--accent-primary)" />
                <span className="desktop-only">{user?.name?.split(' ')[0]}</span>
              </Link>
            ) : (
              !isLanding && (
                <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ padding: '8px 16px' }}>Login</button>
              )
            )}

            <button
              onClick={toggleTheme}
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
              }}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              className="mobile-only"
              onClick={toggleMenu}
              style={{
                background: 'var(--accent-primary)',
                border: 'none',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
              }}
            >
              <div style={{ width: '20px', height: '18px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span style={{ width: '100%', height: '2px', background: '#000', borderRadius: '2px', transition: '0.3s', transform: isMenuOpen ? 'translateY(8px) rotate(45deg)' : 'none' }}></span>
                <span style={{ width: '100%', height: '2px', background: '#000', borderRadius: '2px', transition: '0.3s', opacity: isMenuOpen ? 0 : 1 }}></span>
                <span style={{ width: '100%', height: '2px', background: '#000', borderRadius: '2px', transition: '0.3s', transform: isMenuOpen ? 'translateY(-8px) rotate(-45deg)' : 'none' }}></span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--bg-primary)',
          zIndex: 999,
          padding: '40px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }} className="mobile-only">
          {(isLanding ? LANDING_LINKS : APP_LINKS).map((link) => (
            <button
              key={link.scrollId || link.path}
              onClick={() => {
                if (link.scrollId) scrollTo(link.scrollId);
                else navigate(link.path);
                setIsMenuOpen(false);
              }}
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                padding: '20px',
                borderRadius: '16px',
                color: 'var(--text-primary)',
                fontSize: '1.2rem',
                fontWeight: 700,
                textAlign: 'left',
                width: '100%',
              }}
            >
              {link.label}
            </button>
          ))}
          {isLanding && (
            <button
              onClick={() => {
                navigate(isAuthenticated ? '/slot-layout' : '/login');
                setIsMenuOpen(false);
              }}
              className="btn btn-primary"
              style={{ padding: '20px', fontSize: '1.2rem', marginTop: 'auto' }}
            >
              Start Booking Now
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default Navbar;
