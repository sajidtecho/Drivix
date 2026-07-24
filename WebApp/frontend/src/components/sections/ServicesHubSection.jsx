import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, AlertTriangle, CreditCard, FileText, Wind, Key } from 'lucide-react';

const SERVICES = [
  { id: 'parking', title: 'Parking Spot Finder', desc: 'Locate and book secure parking spots in real-time.', color: '#FFCE00', path: '/find', icon: MapPin },
  { id: 'challan', title: 'Challan Management', desc: 'View and pay pending traffic fines securely.', color: '#bc00ff', url: 'https://echallan.parivahan.gov.in/index/accused-challan', icon: AlertTriangle },
  { id: 'fastag', title: 'FASTag Recharge', desc: 'Top-up your FASTag wallet instantly.', color: '#00cc6a', url: 'https://paytm.com/fastag-recharge', icon: CreditCard },
  { id: 'docs', title: 'Document Manager', desc: 'Secure vault for DL, RC, and Insurance.', color: '#00D2FF', path: '/profile', icon: FileText },
  { id: 'pollution', title: 'Pollution Certificate', desc: 'Track validity and renew PUCC online.', color: '#059669', url: 'https://vahan.parivahan.gov.in/puc/', icon: Wind },
  { id: 'transfer', title: 'Ownership Transfer', desc: 'Transfer vehicle ownership digitally.', color: '#FF7A00', url: 'https://sarathi.parivahan.gov.in/', icon: Key },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, filter: 'blur(8px)' },
  visible: { 
    y: 0, 
    opacity: 1, 
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 100, damping: 15 } 
  }
};

const ServiceCard = ({ title, desc, color, icon: Icon, onClick }) => {
  const cardRef = React.useRef(null);
  const [coords, setCoords] = React.useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState(false);
  const [rotateX, setRotateX] = React.useState(0);
  const [rotateY, setRotateY] = React.useState(0);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const normalizedX = (x / rect.width) - 0.5;
    const normalizedY = (y / rect.height) - 0.5;
    
    setRotateX(-normalizedY * 5); // Subtle 3D tilt
    setRotateY(normalizedX * 5);
    setCoords({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      style={{
        position: 'relative',
        borderRadius: '24px', // Reduced radius for compact One UI widget look
        padding: '24px 20px', // Reduced padding
        background: isHovered 
          ? `radial-gradient(300px circle at ${coords.x}px ${coords.y}px, ${color}08, rgba(255, 255, 255, 0.015))`
          : 'rgba(255, 255, 255, 0.015)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: isHovered ? `1px solid ${color}40` : '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: isHovered 
          ? `0 20px 40px rgba(0,0,0,0.4), 0 0 15px ${color}10` 
          : '0 8px 24px rgba(0,0,0,0.15)',
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${isHovered ? -4 : 0}px)`,
        transition: 'transform 0.1s ease, border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Subtle Inner Glow */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '24px',
          pointerEvents: 'none',
          background: `radial-gradient(150px circle at ${coords.x}px ${coords.y}px, ${color}10, transparent)`,
          mixBlendMode: 'screen',
          zIndex: 0
        }} />
      )}

      {/* Top Edge Glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '25%',
        right: '25%',
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
        zIndex: 1,
        pointerEvents: 'none',
        opacity: isHovered ? 1 : 0.4,
        transition: 'opacity 0.3s ease'
      }} />

      {/* Content wrapper */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
        {/* Icon Container */}
        <div style={{
          width: '48px', // Reduced from 64px
          height: '48px', // Reduced from 64px
          borderRadius: '12px', // Reduced from 18px
          background: isHovered 
            ? `linear-gradient(135deg, ${color}25 0%, ${color}05 100%)`
            : `linear-gradient(135deg, ${color}12 0%, ${color}02 100%)`,
          border: isHovered ? `1px solid ${color}40` : '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: isHovered 
            ? `inset 0 1px 1px rgba(255,255,255,0.15), 0 0 10px ${color}20`
            : `inset 0 1px 1px rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.1)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px', // Reduced from 28px
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}>
          {/* Glass glare effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '50%',
            background: 'linear-gradient(rgba(255, 255, 255, 0.08), transparent)',
            pointerEvents: 'none'
          }} />
          
          <div style={{ color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={20} />
          </div>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '1.2rem', // Reduced from 1.4rem
          fontWeight: 800,
          marginBottom: '10px',
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          fontFamily: 'var(--font-display)',
        }}>
          {title}
        </h3>

        {/* Description */}
        <p style={{
          color: 'var(--text-secondary)',
          lineHeight: '1.4',
          fontSize: '0.85rem', // Reduced from 0.95rem
          fontWeight: 500,
          flex: 1,
          marginBottom: '20px' // Reduced from 32px
        }}>
          {desc}
        </p>

        {/* Action Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--accent-primary)',
          fontWeight: 700,
          fontSize: '0.85rem', // Reduced from 0.95rem
          marginTop: 'auto',
        }}>
          <span>Access Service</span>
          <motion.span
            animate={{ x: isHovered ? 3 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            style={{ display: 'inline-block' }}
          >
            →
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
};

const ServicesHubSection = () => {
  const navigate = useNavigate();

  return (
    <section id="services-hub" style={{ padding: '60px 0', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%' }}>
        <style>{`
          .services-hub-grid {
            display: grid;
            gap: 20px;
            grid-template-columns: repeat(3, 1fr);
            width: 100%;
          }
          @media (max-width: 1023px) {
            .services-hub-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
            }
          }
          @media (max-width: 767px) {
            .services-hub-grid {
              grid-template-columns: 1fr;
              gap: 16px;
            }
          }
        `}</style>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px' }}>
          <div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900 }}>Our <span className="text-gradient">Services</span></h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '6px' }}>All your car needs in one dashboard</p>
          </div>
          <button onClick={() => navigate('/services')} className="btn" style={{ background: 'none', color: 'var(--accent-primary)', fontWeight: 800, fontSize: '0.95rem', border: 'none', cursor: 'pointer' }}>View All &rarr;</button>
        </div>

        <motion.div 
          className="services-hub-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {SERVICES.map((service) => (
            <motion.div key={service.id} variants={itemVariants} style={{ height: '100%' }}>
              <ServiceCard
                title={service.title}
                desc={service.desc}
                color={service.color}
                icon={service.icon}
                onClick={() => {
                  if (service.path === '/profile') {
                    navigate('/profile', { state: { activeTab: 'documents' } });
                  } else if (service.url) {
                    window.open(service.url, '_blank', 'noopener,noreferrer');
                  } else if (service.path) {
                    navigate(service.path);
                  }
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesHubSection;
