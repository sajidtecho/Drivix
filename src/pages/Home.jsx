import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, CarFront, Zap, ShieldCheck, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

const Home = () => {
  const navigate = useNavigate();

  const handleBook = (facility) => {
    if (typeof facility.slots !== 'number') return;
    navigate('/booking', { state: { spot: facility } });
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '120px 5% 60px', maxWidth: '1200px', margin: '0 auto' }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <motion.div variants={itemVariants}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '8px' }}>
            Find & Book <br/>Your <span className="text-gradient">Smart Slot</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            AI-powered discovery for secure and fast parking.
          </p>
        </motion.div>
        
        <motion.div variants={itemVariants} style={{ display: 'flex', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(0, 255, 136, 0.1)', padding: '12px', borderRadius: '12px' }}>
              <Zap color="var(--accent-primary)" size={24} />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>Available Slots</p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 700 }}>2,451</h3>
            </div>
          </div>
        </motion.div>
      </header>

      <motion.div variants={itemVariants} className="glass-panel" style={{ height: '400px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Abstract Map Placeholder */}
        <div style={{ 
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'radial-gradient(circle at center, rgba(0, 210, 255, 0.1) 0%, transparent 60%)',
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: 'repeat(6, 1fr)',
          gap: '2px',
          opacity: 0.4
        }}>
          {Array.from({ length: 72 }).map((_, i) => (
            <div key={i} style={{ borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}></div>
          ))}
        </div>
        
        {/* Animated Radar Effect */}
        <motion.div
          animate={{ scale: [1, 2, 3], opacity: [0.5, 0.2, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
          style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', border: '2px solid var(--accent-primary)' }}
        />
        <motion.div
          animate={{ scale: [1, 2, 3], opacity: [0.5, 0.2, 0] }}
          transition={{ repeat: Infinity, duration: 3, delay: 1, ease: 'linear' }}
          style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', border: '2px solid var(--accent-secondary)' }}
        />
        
        <div style={{ zIndex: 10, textAlign: 'center', background: 'rgba(10,10,10,0.8)', padding: '24px 32px', borderRadius: '20px', border: '1px solid var(--glass-border-light)', backdropFilter: 'blur(10px)' }}>
          <Navigation color="var(--accent-primary)" size={40} style={{ margin: '0 auto 16px' }} />
          <h4 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '8px' }}>Scanning Nearby Facilities</h4>
          <p style={{ color: 'var(--text-secondary)' }}>Connaught Place, New Delhi</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {[{
          title: 'CP Inner Circle - Premium', distance: '0.8 km', slots: 42, price: '₹60/hr', pricePerHr: 60, icon: ShieldCheck, color: 'var(--accent-primary)'
        }, {
          title: 'Palika Bazaar Under Ground', distance: '1.2 km', slots: 15, price: '₹40/hr', pricePerHr: 40, icon: CarFront, color: 'var(--accent-secondary)'
        }, {
          title: 'NDMC Smart Parking', distance: '2.5 km', slots: 'Full', price: '₹30/hr', pricePerHr: 30, icon: MapPin, color: '#ff4b4b'
        }].map((facility, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -5, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}
            className="glass-panel"
            style={{ padding: '24px', position: 'relative', overflow: 'hidden', opacity: facility.slots === 'Full' ? 0.6 : 1 }}
          >
            {/* Invisible full-cover click target for reliable navigation */}
            {typeof facility.slots === 'number' && (
              <button
                aria-label={`Book ${facility.title}`}
                onClick={() => handleBook(facility)}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 2 }}
              />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', position: 'relative', zIndex: 3 }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '12px', color: facility.color }}>
                <facility.icon size={24} />
              </div>
              <span style={{ background: 'var(--glass-bg)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '500', border: '1px solid var(--glass-border)' }}>
                {facility.distance}
              </span>
            </div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', position: 'relative', zIndex: 3 }}>{facility.title}</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', position: 'relative', zIndex: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: facility.slots === 'Full' ? '#ff4b4b' : '#00cc6a' }}>
                <Clock size={16} />
                <span style={{ fontWeight: 600 }}>{typeof facility.slots === 'number' ? `${facility.slots} left` : 'Full'}</span>
              </div>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{facility.price}</span>
            </div>
            {typeof facility.slots === 'number' && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', position: 'relative', zIndex: 3 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                  Book Now <ChevronRight size={14} />
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default Home;
