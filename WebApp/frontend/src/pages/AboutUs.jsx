import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Target, Compass, Shield, Zap, Car, MapPin, Users, Award,
  Sparkles, Cpu, CheckCircle2, ArrowRight, Activity, Clock,
  Lock, Navigation, Eye, Globe, Building2, Quote, Layers, Check
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 90 } },
};

const AboutUs = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const drivixFeatures = [
    {
      icon: Zap,
      title: 'Instant Park & Live GPS Matching',
      description: 'Real-time geolocation-based routing that instantly finds and reserves the closest active parking slot relative to your live driving position.',
      color: '#10b981'
    },
    {
      icon: Eye,
      title: 'ANPR Gate & Contactless Entry',
      description: 'Automatic Number Plate Recognition camera integration for seamless barrier entry and exit without physical paper tickets or manual delays.',
      color: '#00f2ff'
    },
    {
      icon: Cpu,
      title: 'Dynamic Pricing Engine',
      description: 'AI-driven dynamic pricing algorithms adjusting hourly rates based on peak demand, weather conditions, holidays, and live occupancy.',
      color: '#FFCE00'
    },
    {
      icon: Navigation,
      title: 'Multi-City Zone Directory',
      description: 'Comprehensive coverage across Noida, Greater Noida, NDMC Connaught Place, and South Zone Delhi with transparent operational status flags.',
      color: '#a855f7'
    },
    {
      icon: Layers,
      title: 'Interactive Multi-Floor Layouts',
      description: 'Live 2D slot availability maps showing exact floor-by-floor occupied, temporarily reserved, and open slots in real-time.',
      color: '#ec4899'
    },
    {
      icon: Shield,
      title: 'Safety & Incident Alert System',
      description: 'Integrated emergency SOS assistance, 24/7 CCTV surveillance monitoring, and instant support ticketing for peace of mind.',
      color: '#3b82f6'
    },
    {
      icon: Sparkles,
      title: 'Drivix AI Assistant & Copilot',
      description: 'Built-in conversational AI assistant providing smart route advice, pricing forecasts, and instant booking help on the go.',
      color: '#f97316'
    },
    {
      icon: Building2,
      title: 'Partner & Operator Ecosystem',
      description: 'Dedicated analytics and management dashboard empowering municipal bodies and private commercial lot operators to maximize space utilization.',
      color: '#14b8a6'
    }
  ];

  const stats = [
    { value: '42+', label: 'Active Facilities', icon: Building2 },
    { value: '15,000+', label: 'Verified Slots', icon: Car },
    { value: '98.4%', label: 'ANPR Gate Accuracy', icon: CheckCircle2 },
    { value: '< 2 min', label: 'Avg Search Time', icon: Clock }
  ];

  const coreValues = [
    {
      title: 'Innovation First',
      description: 'Harnessing cutting-edge AI, cloud IoT, and computer vision to modernize urban mobility.',
      icon: Cpu
    },
    {
      title: 'Radical Transparency',
      description: 'Providing genuine real-time availability, clear rate structures, and explicit data-quality warnings.',
      icon: Eye
    },
    {
      title: 'Environmental Sustainability',
      description: 'Reducing urban carbon emissions and fuel waste caused by driving in circles searching for parking.',
      icon: Globe
    },
    {
      title: 'User-Centric Excellence',
      description: 'Designing intuitive, high-performance web and mobile experiences built for seamless daily use.',
      icon: HeartIcon
    }
  ];

  function HeartIcon(props) {
    return <Sparkles {...props} />;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{
        paddingTop: '90px',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        padding: '90px 5% 80px'
      }}
    >
      <style>{`
        .about-hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: center;
          margin-bottom: 60px;
        }
        .about-vision-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 64px;
        }
        .about-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
          margin-bottom: 64px;
        }
        .about-founder-card {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 32px;
          align-items: center;
        }
        @media (max-width: 768px) {
          .about-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
            text-align: left !important;
          }
          .about-vision-grid {
            grid-template-columns: 1fr !important;
          }
          .about-founder-card {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .founder-avatar-container {
            margin: 0 auto !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>

        {/* Hero Section */}
        <motion.div variants={itemVariants} className="about-hero-grid">
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 14px', borderRadius: '20px',
              background: 'rgba(250, 255, 0, 0.1)', border: '1px solid rgba(250, 255, 0, 0.25)',
              marginBottom: '16px'
            }}>
              <Sparkles size={15} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Transforming Urban Mobility
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '16px' }}>
              Redefining <span className="text-gradient">Smart Parking</span> Across Cities
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '28px' }}>
              Drivix is India’s next-generation intelligent parking & mobility platform — bridging municipal infrastructure, automated MLCPs, commercial complexes, and everyday drivers with real-time AI and computer vision.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/find')}
                className="btn btn-primary"
                style={{ padding: '12px 24px', fontSize: '0.92rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                Explore Live Locations <ArrowRight size={16} />
              </button>
              
              <button
                onClick={() => navigate('/partner')}
                style={{
                  padding: '12px 24px', borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer'
                }}
              >
                Become a Partner
              </button>
            </div>
          </div>

          {/* Hero Decorative Card / Stat Display */}
          <div className="glass-panel" style={{
            padding: '32px', borderRadius: '24px', background: 'rgba(15, 20, 32, 0.85)',
            border: '1.5px solid rgba(250, 255, 0, 0.25)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px',
              background: 'var(--accent-glow)', borderRadius: '50%', filter: 'blur(35px)'
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(250, 255, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity color="var(--accent-primary)" size={22} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>Drivix Live Network</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Real-time IoT & ANPR telemetry</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {stats.map((st) => (
                <div key={st.label} style={{
                  padding: '16px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--glass-border)'
                }}>
                  <st.icon size={18} color="var(--accent-primary)" style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{st.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '4px' }}>{st.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Vision & Mission Section */}
        <motion.div variants={itemVariants} style={{ marginBottom: '64px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>
              Our <span className="text-gradient">Vision & Mission</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto' }}>
              Guiding India's transition toward zero-friction, intelligent urban mobility.
            </p>
          </div>

          <div className="about-vision-grid">
            {/* Vision Card */}
            <div className="glass-panel" style={{
              padding: '28px', borderRadius: '20px', background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(16, 185, 129, 0.35)', boxShadow: '0 8px 30px rgba(16, 185, 129, 0.08)'
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
              }}>
                <Eye size={24} color="#10b981" />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>
                Our Vision
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                To become the central digital neural network for urban parking across India — transforming congested city hubs into stress-free, intelligent ecosystems where vehicle entry, slot booking, and payments are 100% automated and instant.
              </p>
            </div>

            {/* Mission Card */}
            <div className="glass-panel" style={{
              padding: '28px', borderRadius: '20px', background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(250, 255, 0, 0.35)', boxShadow: '0 8px 30px rgba(250, 255, 0, 0.08)'
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(250, 255, 0, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
              }}>
                <Target size={24} color="var(--accent-primary)" />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>
                Our Mission
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                To eliminate urban traffic loops by providing drivers with transparent real-time slot availability, while equipping municipal authorities and commercial lot operators with intelligent IoT tools to maximize asset efficiency and cut emissions.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Comprehensive Features of Drivix Section */}
        <motion.div variants={itemVariants} style={{ marginBottom: '64px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              Platform Architecture
            </span>
            <h2 style={{ fontSize: '1.9rem', fontWeight: 900, marginTop: '4px', marginBottom: '8px' }}>
              Core Features of <span className="text-gradient">Drivix</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '620px', margin: '0 auto' }}>
              Engineered with advanced cloud algorithms, computer vision, and real-time telemetry.
            </p>
          </div>

          <div className="about-features-grid">
            {drivixFeatures.map((feat) => (
              <div
                key={feat.title}
                className="glass-panel"
                style={{
                  padding: '24px', borderRadius: '18px', background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)', transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: `${feat.color}18`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', marginBottom: '14px', border: `1px solid ${feat.color}35`
                }}>
                  <feat.icon size={20} color={feat.color} />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                  {feat.title}
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* About the Founder Section */}
        <motion.div variants={itemVariants} style={{ marginBottom: '64px' }}>
          <div className="glass-panel" style={{
            padding: '36px', borderRadius: '24px', background: 'rgba(15, 20, 32, 0.9)',
            border: '1.5px solid rgba(250, 255, 0, 0.3)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.35)'
          }}>
            <div className="about-founder-card">
              
              {/* Founder Avatar & Badge */}
              <div className="founder-avatar-container" style={{ textAlign: 'center' }}>
                <div style={{
                  width: '180px', height: '180px', borderRadius: '50%', margin: '0 auto 16px',
                  background: 'linear-gradient(135deg, var(--accent-primary), #00f2ff)', padding: '4px',
                  boxShadow: '0 8px 24px var(--accent-glow)'
                }}>
                  <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    background: '#0d1117', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', overflow: 'hidden'
                  }}>
                    {/* Founder Avatar Icon / Initial */}
                    <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent-primary)' }}>
                      SA
                    </span>
                  </div>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', margin: '0 0 2px' }}>
                  Sajid Ahmad
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 800, margin: 0 }}>
                  Founder & Lead Architect
                </p>
              </div>

              {/* Founder Bio & Philosophy */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Quote size={20} color="var(--accent-primary)" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Founder's Perspective
                  </span>
                </div>

                <p style={{ color: 'var(--text-primary)', fontSize: '1.02rem', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '16px' }}>
                  "Urban congestion in Indian metro cities isn't just a traffic management problem — it’s an information bottleneck. Everyday drivers spend thousands of hours and burn fuel looking for a parking spot because system silos keep capacity invisible. We built Drivix to make urban parking completely transparent, automated, and effortless."
                </p>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55, margin: 0 }}>
                  Driven by a vision to solve daily commuter frustration across Delhi-NCR, <strong>Sajid Ahmad</strong> founded Drivix to integrate computer vision ANPR cameras, IoT slot sensors, and predictive pricing into a single unified mobile & web ecosystem. Under his engineering leadership, Drivix has scaled to seed and support major hubs across Noida, Greater Noida, and New Delhi.
                </p>
              </div>

            </div>
          </div>
        </motion.div>

        {/* Core Values Section */}
        <motion.div variants={itemVariants} style={{ marginBottom: '64px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 900, marginBottom: '6px' }}>
              Our Guided <span className="text-gradient">Core Values</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              The principles behind every line of code and partnership we build.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {coreValues.map((val) => (
              <div key={val.title} className="glass-panel" style={{
                padding: '20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--glass-border)'
              }}>
                <val.icon size={20} color="var(--accent-primary)" style={{ marginBottom: '10px' }} />
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>{val.title}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.45, margin: 0 }}>{val.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action Banner */}
        <motion.div variants={itemVariants} className="glass-panel" style={{
          padding: '40px 32px', borderRadius: '24px', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(250, 255, 0, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
          border: '1.5px solid rgba(250, 255, 0, 0.35)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)'
        }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginBottom: '10px' }}>
            Ready to Experience Stress-Free Parking?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', maxWidth: '540px', margin: '0 auto 24px' }}>
            Join thousands of smart commuters using Drivix to locate, reserve, and navigate to verified slots in seconds.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/find')}
              className="btn btn-primary"
              style={{ padding: '12px 28px', fontSize: '0.9rem', fontWeight: 800 }}
            >
              Start Parking Now
            </button>
            <button
              onClick={() => navigate('/partner')}
              style={{
                padding: '12px 24px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)',
                color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer'
              }}
            >
              Partner With Us
            </button>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};

export default AboutUs;
