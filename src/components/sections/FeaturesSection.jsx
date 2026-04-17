import { motion } from 'framer-motion';
import { Key, Tag, Search, Gavel, Car, ShieldCheck, Banknote, Wallet } from 'lucide-react';
import fastagIcon from '../../assets/fastag.png';
import FadeIn from '../common/FadeIn';

const FeaturesSection = () => {
  return (
    <section id="features" style={{ padding: '80px 0', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 5%' }}>
        <div style={{ marginBottom: '48px', maxWidth: '640px' }}>
          <h2 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            lineHeight: 1,
            letterSpacing: '-0.04em',
            marginBottom: '16px'
          }}>
            Built for <span style={{ color: 'var(--accent-primary)' }}>human drivers</span>,<br />not just sensors.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.5 }}>
            A parking ecosystem that removes the friction from every touchpoint, from the mall entrance to your office elevator.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '0.8fr 0.8fr 1.2fr 1.2fr',
          gridTemplateAreas: `
            "network network secure time"
            "network network payment payment"
            "help help avail avail"
          `,
          gridAutoRows: 'minmax(130px, auto)',
          gap: '12px',
        }} className="bento-grid">
          <style>{`
            @media (max-width: 1024px) {
              .bento-grid { 
                grid-template-columns: repeat(2, 1fr) !important; 
                grid-template-areas: 
                  "network network"
                  "network network"
                  "secure time"
                  "payment payment"
                  "help help"
                  "avail avail"
                !important;
              }
            }
            @media (max-width: 640px) {
              .bento-grid { 
                grid-template-columns: 1fr !important;
                grid-template-areas: 
                  "network"
                  "secure"
                  "time"
                  "payment"
                  "help"
                  "avail"
                !important;
              }
            }
            .bento-card {
               transition: all var(--transition-normal);
               cursor: pointer;
            }
            .bento-card:hover {
               transform: translateY(-8px);
               border-color: var(--accent-primary);
               box-shadow: 0 20px 40px rgba(0,0,0,0.4);
               transition: all var(--transition-fast);
            }
          `}</style>

          {/* Main Large Card */}
          <div className="glass-panel bento-card" style={{ gridArea: 'network', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(135deg, var(--bg-secondary), #1a1a24)' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Network Growth</div>
              <h3 style={{ fontSize: 'clamp(1.3rem, 3.5vw, 2.2rem)', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 0.9, marginBottom: '14px' }}>
                42<span style={{ fontSize: '0.9rem' }}> sites</span> <br />and counting.
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '200px', lineHeight: 1.3 }}>
                From Sector 18 to Knowledge Park II. If it's a major hub in Noida, we're already there.
              </p>
            </div>
            <div style={{ marginTop: '16px' }}>
              <button className="btn" style={{ padding: '0', background: 'none', color: 'var(--accent-primary)', fontWeight: 800, borderBottom: '2px solid' }}>See Network →</button>
            </div>
          </div>

          {/* Wide Card */}
          <div className="glass-panel bento-card" style={{ gridArea: 'payment', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ padding: '14px', borderRadius: '50%', background: 'rgba(250, 255, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px' }}>
              <img src={fastagIcon} alt="FASTag" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px' }}>Zero-Friction Payments</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Forget standard gateways. One-tap FASTag integration means no stopping at the gate.</p>
            </div>
          </div>

          <div className="glass-panel bento-card" style={{ gridArea: 'secure', padding: '20px' }}>
            <ShieldCheck size={28} color="var(--accent-primary)" style={{ marginBottom: '16px' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px' }}>ANPR Secure</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>High-speed camera entry. No more reaching for QR codes.</p>
          </div>

          <div className="glass-panel bento-card" style={{ gridArea: 'time', padding: '20px', background: 'var(--bg-tertiary)' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-warm)', marginBottom: '8px' }}>3 min</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Average time saved per session vs. traditional parking.</p>
          </div>

          {/* Bottom Card Wide */}
          <div className="glass-panel bento-card" style={{ gridArea: 'help', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Need insurance help?</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>We've partnered with top carriers for direct quotes.</p>
            </div>
            <button className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>Explore</button>
          </div>

          <div className="glass-panel bento-card" style={{ gridArea: 'avail', padding: '20px', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '10px' }}>Available 24/7</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{
                  flex: 1, height: '40px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '4px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {i < 5 && (
                    <motion.div
                      initial={{ width: '0%' }}
                      whileInView={{ width: '100%' }}
                      transition={{
                        delay: i * 0.15,
                        duration: 0.6,
                        ease: [0.22, 1, 0.36, 1]
                      }}
                      viewport={{ once: false }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        background: 'var(--accent-primary)',
                        boxShadow: '0 0 15px var(--accent-glow)'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Real-time availability monitoring across all zones.</p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
