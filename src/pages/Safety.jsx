import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Camera, QrCode, Video, Users, Lock,
  UserCheck, Database, Smartphone, Headset,
  AlertTriangle, Phone, Sun, LayoutGrid, Siren,
  ArrowRight, ShieldCheck, Heart
} from 'lucide-react';

const SafetyFeatureCard = ({ icon: Icon, title, description, color = '#0052cc' }) => (
  <motion.div
    whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
    className="glass-panel"
    style={{
      padding: '24px',
      borderRadius: 'var(--radius-card)',
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--glass-border)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      transition: 'all 0.3s ease',
      height: '100%'
    }}
  >
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      background: `${color}15`,
      color: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `0 8px 16px ${color}10`
    }}>
      <Icon size={24} />
    </div>
    <div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{description}</p>
    </div>
  </motion.div>
);

const SectionHeader = ({ title, subtitle, badge, alignment = 'center' }) => (
  <div style={{ textAlign: alignment, marginBottom: '60px' }}>
    {badge && (
      <span style={{
        padding: '8px 16px',
        borderRadius: 'var(--radius-pill)',
        background: 'rgba(0, 204, 106, 0.1)',
        color: '#00cc6a',
        fontSize: '0.75rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        display: 'inline-block',
        marginBottom: '20px'
      }}>
        {badge}
      </span>
    )}
    <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, marginBottom: '16px', color: 'var(--text-primary)' }}>{title}</h2>
    <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: alignment === 'center' ? '0 auto' : '0' }}>{subtitle}</p>
  </div>
);

const Safety = () => {
  const navigate = useNavigate();

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingTop: '100px' }}>
      {/* Hero Section */}
      <section style={{ padding: '80px 5%', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '400px', background: 'radial-gradient(circle, rgba(0, 82, 204, 0.08) 0%, transparent 70%)',
          zIndex: 0, pointerEvents: 'none'
        }} />
        
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           style={{ position: 'relative', zIndex: 1 }}
        >
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '24px', 
            background: 'linear-gradient(135deg, #0052cc, #00cc6a)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 32px', boxShadow: '0 20px 40px rgba(0, 82, 204, 0.2)'
          }}>
            <ShieldCheck size={40} color="#fff" />
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 900, marginBottom: '20px', letterSpacing: '-0.03em' }}>
            Safety & Security<br /><span className="text-gradient">at Drivix</span>
          </h1>
          <p style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', color: 'var(--text-secondary)', maxWidth: '800px', margin: '0 auto 40px', lineHeight: 1.6 }}>
            Your vehicle’s safety is our top priority. We employ military-grade security infrastructure to ensure peace of mind for every spot you book.
          </p>
        </motion.div>
      </section>

      {/* Security Features Grid */}
      <section style={{ padding: '80px 5%', maxWidth: '1300px', margin: '0 auto' }}>
        <SectionHeader 
          title="Advanced Protection" 
          subtitle="Multiple layers of security working in sync to protect your vehicle 24/7." 
          badge="Security Infrastructure"
        />
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px',
          paddingBottom: '60px'
        }}>
          <SafetyFeatureCard 
            icon={Camera} 
            title="ANPR-Based Entry" 
            description="Automatic number plate recognition ensures only authorized vehicles enter the facility, matching your digital ticket instantly."
            color="#0052cc"
          />
          <SafetyFeatureCard 
            icon={QrCode} 
            title="QR Ticket Verification" 
            description="Unique, time-stamped QR codes for every booking prevent fraudulent entry and ensure seamless check-in/out."
            color="#00cc6a"
          />
          <SafetyFeatureCard 
            icon={Video} 
            title="24/7 CCTV Surveillance" 
            description="High-definition cameras cover every corner of the facility with live monitoring and AI-based anomaly detection."
            color="#0052cc"
          />
          <SafetyFeatureCard 
            icon={Users} 
            title="Face Capture at Entry" 
            description="Additional identity verification through face capture during entry provides an extra layer of security for high-value zones."
            color="#00cc6a"
          />
          <SafetyFeatureCard 
            icon={Lock} 
            title="Access Prevention" 
            description="Zero-tolerance unauthorized access prevention with automated barriers and rapid-response security personnel."
            color="#0052cc"
          />
        </div>
      </section>

      {/* User Data Protection Section */}
      <section style={{ 
        padding: '100px 5%', 
        background: 'linear-gradient(180deg, transparent, rgba(0, 82, 204, 0.03), transparent)',
        borderTop: '1px solid var(--glass-border)',
        borderBottom: '1px solid var(--glass-border)'
       }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
          <SectionHeader 
            alignment="left"
            title="Digital Data Fortress" 
            subtitle="We protect your personal information with the same rigor we apply to your vehicle." 
            badge="Data Privacy"
          />
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ color: '#0052cc' }}><UserCheck size={32} /></div>
              <div>
                <h4 style={{ fontWeight: 800, marginBottom: '8px', fontSize: '1.2rem' }}>Secure Authentication</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Powered by Firebase Auth, ensuring your account is protected by industry-standard encryption.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ color: '#00cc6a' }}><Database size={32} /></div>
              <div>
                <h4 style={{ fontWeight: 800, marginBottom: '8px', fontSize: '1.2rem' }}>Encrypted Storage</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>All booking and personal data is encrypted at rest and in transit using 256-bit AES encryption.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ color: '#0052cc' }}><Smartphone size={32} /></div>
              <div>
                <h4 style={{ fontWeight: 800, marginBottom: '8px', fontSize: '1.2rem' }}>OTP Verification</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Multi-factor verification for every booking confirms it's really you before a ticket is issued.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency & Support */}
      <section style={{ padding: '100px 5%', maxWidth: '1300px', margin: '0 auto' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '60px',
          alignItems: 'center'
        }}>
          <div>
            <SectionHeader 
              alignment="left"
              title="Immediate Assistance" 
              subtitle="Help is never more than a tap away. Our support team is available round the clock." 
              badge="Emergency Response"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem', fontWeight: 600 }}>
                <Headset color="#00cc6a" size={20} /> 24/7 Real-time Chat Support
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem', fontWeight: 600 }}>
                <Phone color="#0052cc" size={20} /> Emergency Support Line: +91 1800-DRIVIX
              </div>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ padding: '20px 40px', background: '#ff4b4b', border: 'none', boxShadow: '0 10px 20px rgba(255, 75, 75, 0.2)' }}
            >
              <AlertTriangle size={20} /> Report a Security Issue
            </button>
          </div>

          <div style={{ 
            background: 'var(--bg-tertiary)', 
            padding: '48px', 
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Siren /> Infrastructure Safety
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <li style={{ display: 'flex', gap: '16px' }}>
                <Sun color="#FFCE00" />
                <div>
                  <h5 style={{ fontWeight: 700, marginBottom: '4px' }}>Well-lit Facilities</h5>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Automated lighting systems ensure visibility in all areas at all times.</p>
                </div>
              </li>
              <li style={{ display: 'flex', gap: '16px' }}>
                <LayoutGrid color="#0052cc" />
                <div>
                  <h5 style={{ fontWeight: 700, marginBottom: '4px' }}>Organized Layouts</h5>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Dedicated slots with clear signage prevent congestion and minor accidents.</p>
                </div>
              </li>
              <li style={{ display: 'flex', gap: '16px' }}>
                <Siren color="#ff4b4b" />
                <div>
                  <h5 style={{ fontWeight: 700, marginBottom: '4px' }}>Emergency Zones</h5>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Reserved slots for emergency vehicles and quick evacuation paths.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '100px 5% 150px' }}>
        <div style={{ 
          maxWidth: '1100px', 
          margin: '0 auto', 
          background: 'linear-gradient(135deg, #0052cc, #001a41)',
          borderRadius: 'var(--radius-card)',
          padding: '80px 40px',
          textAlign: 'center',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0, 82, 204, 0.3)'
        }}>
          <div style={{ position: 'absolute', top: '-10%', right: '-5%', fontSize: '15rem', opacity: 0.05, fontWeight: 900 }}>SHIELD</div>
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
          >
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, marginBottom: '24px' }}>
              Park with confidence.
            </h2>
            <p style={{ fontSize: '1.25rem', opacity: 0.8, maxWidth: '600px', margin: '0 auto 48px' }}>
              Join thousands of drivers who trust Drivix for secure, effortless parking every day.
            </p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => navigate('/find')}
                className="btn btn-primary" 
                style={{ background: '#fff', color: '#0052cc', padding: '20px 40px', fontSize: '1.1rem' }}
              >
                Find Secure Parking <ArrowRight size={20} />
              </button>
              <button 
                className="btn" 
                style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff', padding: '20px 40px', fontSize: '1.1rem' }}
              >
                Learn More
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: '40px', borderTop: '1px solid var(--glass-border)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        <p>Built for your security <Heart size={14} style={{ fill: '#ff4b4b', color: '#ff4b4b' }} /> By Drivix Team © 2026</p>
      </footer>
    </div>
  );
};

export default Safety;
