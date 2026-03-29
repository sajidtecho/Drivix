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

  return (
    <nav
      className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 5%',
        zIndex: 1000,
        background: scrolled ? 'rgba(10, 10, 10, 0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(15px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--glass-border)' : 'none',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
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
      >
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px var(--accent-glow)',
        }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#000' }}>D</span>
        </div>
        <span style={{ fontSize: '1.6rem', fontWeight: 900, tracking: '-0.02em', letterSpacing: '-0.5px' }}>
          Drivix
        </span>
      </Link>

      {/* Navigation Links */}
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
              onMouseEnter={(e) => (e.target.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.target.style.color = 'var(--text-secondary)')}
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
                transition: 'all 0.2s',
              }}
            >
              {link.label}
            </Link>
          ))}
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {isLanding && (
          <button
            onClick={() => isAuthenticated ? navigate('/slot-layout') : navigate('/login')}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
          >
            Start Booking
          </button>
        )}

        {isLanding && (
          <button
            className="btn btn-primary desktop-only"
            style={{ 
              padding: '10px 18px', 
              fontSize: '0.85rem',
              background: 'rgba(255, 173, 0, 0.15)',
              color: 'var(--accent-primary)',
              border: '1px solid var(--accent-primary)',
            }}
          >
            Get the App
          </button>
        )}

        {/* Profile Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAuthenticated ? (
            <Link
              to="/profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 16px',
                borderRadius: '50px',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                fontWeight: 700,
                transition: 'all 0.2s',
              }}
            >
              <UserCircle size={22} color="var(--accent-primary)" />
              <span className="desktop-only">{user?.name?.split(' ')[0] || 'Profile'}</span>
            </Link>
          ) : (
            !isLanding && (
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.9rem' }}
              >
                Login
              </button>
            )
          )}

          {/* Theme Toggle Button - Integrated into profile group area */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              width: '42px',
              height: '42px',
              borderRadius: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isDark ? 'var(--accent-primary)' : 'var(--text-primary)',
              transition: 'all 0.3s var(--transition-normal)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
