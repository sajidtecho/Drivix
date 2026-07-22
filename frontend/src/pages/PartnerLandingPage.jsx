import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, DollarSign, ShieldCheck, CheckCircle2,
  ChevronDown, Upload, FileText, MapPin, Building,
  Star, Zap, Clock, Users, ArrowRight, Shield, Award
} from 'lucide-react';
import { API_BASE_URL } from '../config';

const BENEFIT_CARDS = [
  { title: 'Passive Income', desc: 'Earn steady passive revenue from unused or underutilized parking spaces.', icon: DollarSign, color: '#FFCE00' },
  { title: 'Maximum Visibility', desc: 'Get seen by thousands of active daily Drivix drivers searching for parking.', icon: Users, color: '#bc00ff' },
  { title: 'Smart Dashboard', desc: 'Manage your slots, bookings, and pricing with our simple partner app.', icon: Clock, color: '#10b981' },
  { title: 'Secure Payments', desc: 'Receive automatic, direct, and transparent payments every week.', icon: ShieldCheck, color: '#3b82f6' },
  { title: 'Flexible Control', desc: 'Set your own parking availability hours, block out slots, and adjust rates.', icon: Zap, color: '#7c3aed' },
  { title: 'Real-time Alerts', desc: 'Get instant push notifications the moment a driver books a slot at your facility.', icon: TrendingUp, color: '#059669' },
  { title: 'Analytics Reports', desc: 'Track your occupancy rates, busy hours, and download detailed earnings reports.', icon: FileText, color: '#f97316' },
  { title: 'Dedicated Support', desc: 'Get 24/7 priority operational and technical support from our Drivix team.', icon: Award, color: '#00D2FF' },
];

const STEPS = [
  { step: '01', title: 'Register Space', desc: 'Submit details of your facility in our 2-minute registration form.', icon: Building },
  { step: '02', title: 'Submit Documents', desc: 'Upload property ownership deeds or occupancy certificates for verify.', icon: FileText },
  { step: '03', title: 'Verification', desc: 'Our team verifies documents and activates your space on our live map.', icon: Shield },
  { step: '04', title: 'Start Earning', desc: 'Receive real-time bookings and see weekly payouts land in your wallet.', icon: CheckCircle2 },
];

const FEATURES = [
  { title: 'Real-Time Booking Management', desc: 'Track active bookings, upcoming arrivals, and history instantly from any screen.' },
  { title: 'QR Code Entry & Exit', desc: 'Contactless automated gates with lightning-fast QR code scans.' },
  { title: 'Live Occupancy Tracking', desc: 'Keep tabs on vacant vs occupied spots in your garage via real-time dashboard.' },
  { title: 'Dynamic Pricing Engine', desc: 'Boost pricing automatically during peak hours or crowded events to double earnings.' },
  { title: 'Secure Digital Payments', desc: 'Accept all digital modes (UPI, cards, wallets) backed by escrow protection.' },
  { title: 'Business Analytics', desc: 'Understand consumer behaviors and optimization recommendations via ML insights.' },
];

const FAQS = [
  { q: 'Who can become a Drivix partner?', a: 'Any property owner, business entity, commercial mall, residential society, hotel, hospital, or operator with at least 1 vacant parking slot can register.' },
  { q: 'What documents are required to register?', a: 'We require a proof of identity (Aadhaar/PAN), proof of property address (utility bill), and document certifying right of parking allocation (lease, deed, or society NOC).' },
  { q: 'How and when are payments processed?', a: 'All your earnings are credited in real-time to your partner wallet. You can withdraw them directly to your linked bank account anytime. Automated settlements occur every Monday.' },
  { q: 'How long does the verification process take?', a: 'Once you submit the registration form and upload all documents, our verification team takes 24 to 48 working hours to audit and approve the location.' },
  { q: 'Is there any registration fee to join Drivix?', a: 'No, listing your parking space is 100% free. We operate on a tiny performance commission model only on successful bookings.' },
  { q: 'Can I manage multiple parking locations?', a: 'Yes! Our multi-property administrator dashboard lets you control multiple parking lots across different cities under a single master partner login.' },
];

const PartnerLandingPage = () => {
  const formRef = useRef(null);

  // Sliders for calculator
  const [slots, setSlots] = useState(50);
  const [rate, setRate] = useState(30);
  const [hours, setHours] = useState(8);

  // FAQ Accordion
  const [activeFaq, setActiveFaq] = useState(null);

  // Stats state (with fallback defaults matching original design)
  const [stats, setStats] = useState({
    activePartners: 120,
    monthlyBookings: 15000,
    satisfactionRating: 98
  });

  // Fetch stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/partners/stats`);
        const data = await response.json();
        if (response.ok && data.success) {
          setStats({
            activePartners: data.activePartners,
            monthlyBookings: data.monthlyBookings,
            satisfactionRating: data.satisfactionRating
          });
        }
      } catch (err) {
        console.error('Failed to fetch partner stats:', err);
      }
    };
    fetchStats();
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pin: '',
    facilityType: 'Commercial',
    slotsCount: '10',
    vehicles: [],
    operatingHours: '24/7',
    notes: '',
  });

  const [documentFile, setDocumentFile] = useState(null);
  const [submitStatus, setSubmitStatus] = useState('idle'); // idle, submitting, success
  const [error, setError] = useState('');

  const monthlyEarnings = slots * rate * hours * 30;

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleVehicleChange = (type) => {
    const isChecked = formData.vehicles.includes(type);
    if (isChecked) {
      setFormData({ ...formData, vehicles: formData.vehicles.filter(v => v !== type) });
    } else {
      setFormData({ ...formData, vehicles: [...formData.vehicles, type] });
    }
  };

  const compressImage = (file, maxWidth = 1600, maxHeight = 1600, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        if (file.size > 3.3 * 1024 * 1024) {
          reject(new Error('Document is too large. Please upload a file smaller than 3MB.'));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read the file.'));
        reader.readAsDataURL(file);
        return;
      }

      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const approxSizeBytes = compressedDataUrl.length * 0.75;
        if (approxSizeBytes > 4 * 1024 * 1024) {
          reject(new Error('The uploaded image is too large. Please upload a file smaller than 3MB.'));
          return;
        }

        resolve(compressedDataUrl);
      };
      img.onerror = () => {
        if (file.size > 3.3 * 1024 * 1024) {
          reject(new Error('Document is too large. Please upload a file smaller than 3MB.'));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read the file.'));
        reader.readAsDataURL(file);
      };
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!documentFile) {
      setError('Please upload the required verification document.');
      return;
    }

    if (formData.vehicles.length === 0) {
      setError('Please select at least one vehicle type supported.');
      return;
    }

    setSubmitStatus('submitting');
    setError('');

    try {
      const base64Data = await compressImage(documentFile);

      const response = await fetch(`${API_BASE_URL}/api/v1/partners/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          documentFile: base64Data
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSubmitStatus('success');
      setFormData({
        fullName: '',
        businessName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pin: '',
        facilityType: 'Commercial',
        slotsCount: '10',
        vehicles: [],
        operatingHours: '24/7',
        notes: '',
      });
      setDocumentFile(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
      setSubmitStatus('idle');
    }
  };

  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', paddingTop: '100px' }}>

      {/* ─── HERO SECTION ─── */}
      <section style={{ position: 'relative', padding: '100px 0 60px 0', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(250, 255, 0, 0.05) 0%, transparent 70%)',
          filter: 'blur(80px)',
          zIndex: 0
        }} />

        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '850px', margin: '0 auto', textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(250, 255, 0, 0.08)',
                border: '1px solid rgba(250, 255, 0, 0.15)',
                color: 'var(--accent-primary)',
                fontSize: '0.85rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '28px'
              }}
            >
              <Zap size={14} /> Drivix Partner Program
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 4.2rem)',
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                marginBottom: '24px',
                fontFamily: 'var(--font-display)',
              }}
            >
              Turn Your Empty Parking Space Into a <span className="text-gradient">Revenue-Generating Asset</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{
                fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                fontWeight: 500,
                maxWidth: '700px',
                margin: '0 auto 40px auto'
              }}
            >
              Join Drivix and connect your parking facility with thousands of drivers searching for secure parking spaces every day.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}
            >
              <button onClick={scrollToForm} className="btn btn-primary" style={{ padding: '16px 36px', fontSize: '1.05rem', fontWeight: 800 }}>
                Become a Partner
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── WHY PARTNER SECTION ─── */}
      <section style={{ padding: '80px 0', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900 }}>Why Partner with <span className="text-gradient">Drivix?</span></h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '10px' }}>Unlock full control and monetize your unused spots effortlessly</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px'
          }}>
            {BENEFIT_CARDS.map((card, i) => {
              const IconComp = card.icon;
              return (
                <div
                  key={i}
                  className="glass-panel"
                  style={{
                    padding: '28px 24px',
                    borderRadius: '24px',
                    border: '1px solid var(--glass-border)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                    cursor: 'default'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = `${card.color}35`;
                    e.currentTarget.style.boxShadow = `0 12px 30px rgba(0,0,0,0.3), 0 0 15px ${card.color}08`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: `${card.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                    border: `1px solid ${card.color}30`
                  }}>
                    <IconComp size={20} color={card.color} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '10px' }}>{card.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.45, flex: 1 }}>{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ padding: '80px 0', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900 }}>Simple <span className="text-gradient">Onboarding</span></h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '10px' }}>Get your parking space active in four basic steps</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
            position: 'relative'
          }}>
            {STEPS.map((step, i) => {
              const IconComp = step.icon;
              return (
                <div
                  key={i}
                  className="glass-panel"
                  style={{
                    padding: '32px 24px',
                    borderRadius: '24px',
                    border: '1px solid var(--glass-border)',
                    position: 'relative',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '24px',
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    opacity: 0.05,
                    fontFamily: 'monospace'
                  }}>{step.step}</div>

                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(250, 255, 0, 0.08)',
                    border: '1px solid rgba(250, 255, 0, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px auto',
                  }}>
                    <IconComp size={24} color="var(--accent-primary)" />
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px' }}>{step.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.45 }}>{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── REVENUE CALCULATOR ─── */}
      <section style={{ padding: '80px 0', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '48px', alignItems: 'center' }} className="calc-grid-responsive">
            <style>{`
              @media (min-width: 1025px) {
                .calc-grid-responsive {
                  grid-template-columns: 1fr 1fr !important;
                }
              }
            `}</style>

            <div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '20px' }}>Estimate Your <span className="text-gradient">Earning Potential</span></h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.5, marginBottom: '32px' }}>
                Monetizing empty slots is highly profitable. See how much monthly revenue you can generate by partnering with the Drivix platform.
              </p>

              <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(250, 255, 0, 0.15)', background: 'rgba(250, 255, 0, 0.02)' }}>
                <p style={{ fontSize: '0.82rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '8px', letterSpacing: '0.05em' }}>Revenue Example Calculation</p>
                <p style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.4, margin: 0 }}>
                  50 Parking Slots × ₹30 per Hour × 8 Hours Daily = <span style={{ color: 'var(--accent-primary)' }}>₹3,60,000</span> Estimated Monthly Income!
                </p>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '36px 28px', borderRadius: '28px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '28px', textAlign: 'center' }}>Earnings Calculator</h3>

              {/* Slots Slider */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 700 }}>
                  <span>Parking Slots</span>
                  <span style={{ color: 'var(--accent-primary)' }}>{slots} Slots</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="500"
                  value={slots}
                  onChange={(e) => setSlots(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>

              {/* Rate Slider */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 700 }}>
                  <span>Hourly Rate (₹)</span>
                  <span style={{ color: 'var(--accent-primary)' }}>₹{rate}/hr</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>

              {/* Hours Slider */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 700 }}>
                  <span>Avg. Hours Booked Daily</span>
                  <span style={{ color: 'var(--accent-primary)' }}>{hours} Hours</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '20px',
                padding: '24px',
                textAlign: 'center'
              }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800 }}>Estimated Monthly Income</p>
                <h2 style={{ fontSize: '2.8rem', fontWeight: 900, margin: '8px 0', color: 'var(--accent-primary)' }}>
                  ₹{monthlyEarnings.toLocaleString('en-IN')}
                </h2>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>*Based on 30 operational days per month</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF ─── */}
      <section style={{ padding: '80px 0', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%' }}>

          {/* Stats Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            marginBottom: '80px',
            textAlign: 'center'
          }}>
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-primary)' }}>{stats.activePartners.toLocaleString()}+</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Active Parking Partners</p>
            </div>
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-primary)' }}>{stats.monthlyBookings.toLocaleString()}+</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Monthly Bookings</p>
            </div>
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-primary)' }}>{stats.satisfactionRating}%</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Satisfaction Rating</p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900 }}>What Our <span className="text-gradient">Partners Say</span></h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '10px' }}>Success stories from property owners listing on Drivix</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '28px'
          }}>
            <div className="glass-panel" style={{ padding: '32px 28px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="var(--accent-primary)" color="var(--accent-primary)" />)}
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '24px', fontSize: '0.95rem' }}>
                "We had 30 vacant basement slots in our commercial building in Sector 62. Since listing them on Drivix, we achieve a consistent 80% daily occupancy. The payouts are completely transparent."
              </p>
              <div>
                <h4 style={{ fontWeight: 800, margin: 0 }}>Rajesh Kumar</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Commercial Property Owner, Sector 62</p>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '32px 28px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="var(--accent-primary)" color="var(--accent-primary)" />)}
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '24px', fontSize: '0.95rem' }}>
                "Drivix QR gate integration transformed our hotel valet system. Bookings sync automatically, and payments land weekly. Our team does not have to worry about cash or collections."
              </p>
              <div>
                <h4 style={{ fontWeight: 800, margin: 0 }}>Neha Sharma</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Operations Manager, Grand Inn Hotel</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section style={{ padding: '80px 0', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900 }}>Premium <span className="text-gradient">Platform Features</span></h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '10px' }}>Designed for modern parking management and peak operations</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {FEATURES.map((feat, i) => (
              <div
                key={i}
                className="glass-panel"
                style={{
                  padding: '24px 20px',
                  borderRadius: '20px',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{feat.title}</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQS ─── */}
      <section style={{ padding: '80px 0', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 5%' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900 }}>Frequently Asked <span className="text-gradient">Questions</span></h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '10px' }}>Find quick answers about the Drivix Partner Program</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {FAQS.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="glass-panel"
                  style={{
                    borderRadius: '16px',
                    border: '1px solid var(--glass-border)',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                >
                  <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{faq.q}</h3>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      <ChevronDown size={20} />
                    </motion.div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '0 24px 24px 24px', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.02)' }}>
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── REGISTRATION FORM ─── */}
      <section ref={formRef} style={{ padding: '80px 0', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <div className="container" style={{ maxWidth: '750px', margin: '0 auto', padding: '0 5%' }}>

          <AnimatePresence mode="wait">
            {submitStatus === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel"
                style={{
                  padding: '60px 40px',
                  borderRadius: '32px',
                  border: '1.5px solid var(--accent-primary)',
                  background: 'rgba(250, 255, 0, 0.01)',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(0, 204, 106, 0.1)',
                  border: '1.5px solid #00cc6a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px auto',
                  color: '#00cc6a'
                }}>
                  <CheckCircle2 size={36} />
                </div>

                <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '16px' }}>Registration Submitted!</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '500px', margin: '0 auto 32px auto' }}>
                  Thank you for expressing interest in partnering with Drivix. Our audit team will review your application and get in touch with you within 24 to 48 hours.
                </p>
                <button onClick={() => setSubmitStatus('idle')} className="btn btn-primary" style={{ padding: '12px 24px' }}>Submit Another Space</button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="glass-panel"
                style={{ padding: '40px 32px', borderRadius: '32px', border: '1px solid var(--glass-border)' }}
              >
                <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '8px', textAlign: 'center' }}>Become a Partner</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '36px', textAlign: 'center' }}>
                  Fill out the form below and list your property on Drivix today.
                </p>

                <form onSubmit={handleFormSubmit}>

                  {/* Basic Info */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '0.95rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>Business / Facility Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Phoenix Mall, Sharda Residences"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '0.95rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 99999 99999"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '0.95rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '0.95rem' }}
                      />
                    </div>
                  </div>

                  {/* Address Info */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>Parking Facility Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="Street address, building block, locality"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '0.95rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }} className="three-col-responsive">
                    <style>{`
                      @media (max-width: 600px) {
                        .three-col-responsive {
                          grid-template-columns: 1fr !important;
                        }
                      }
                    `}</style>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>City *</label>
                      <input
                        type="text"
                        required
                        placeholder="Noida"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '0.95rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>State *</label>
                      <input
                        type="text"
                        required
                        placeholder="Uttar Pradesh"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '0.95rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>PIN Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="201301"
                        value={formData.pin}
                        onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                        style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '0.95rem' }}
                      />
                    </div>
                  </div>

                  {/* Specific Fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>Parking Type *</label>
                      <select
                        value={formData.facilityType}
                        onChange={(e) => setFormData({ ...formData, facilityType: e.target.value })}
                        style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '0.95rem' }}
                      >
                        <option value="Commercial">Commercial/Mall</option>
                        <option value="Hospital">Hospital</option>
                        <option value="Hotel">Hotel</option>
                        <option value="Office">Office Building</option>
                        <option value="Apartment">Residential/Society</option>
                        <option value="Empty Plot">Empty Plot/Land</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>Number of Parking Slots *</label>
                      <select
                        value={formData.slotsCount}
                        onChange={(e) => setFormData({ ...formData, slotsCount: e.target.value })}
                        style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '0.95rem' }}
                      >
                        <option value="1-5">1 - 5 Slots</option>
                        <option value="6-20">6 - 20 Slots</option>
                        <option value="21-50">21 - 50 Slots</option>
                        <option value="51-100">51 - 100 Slots</option>
                        <option value="101+">101+ Slots</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>Operating Hours *</label>
                      <select
                        value={formData.operatingHours}
                        onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                        style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '0.95rem' }}
                      >
                        <option value="24/7">Open 24/7</option>
                        <option value="Day-only">Day Shift (6:00 AM - 10:00 PM)</option>
                        <option value="Night-only">Night Shift (10:00 PM - 6:00 AM)</option>
                        <option value="Custom">Custom Hours</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>Vehicle Types Supported *</label>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', paddingTop: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.vehicles.includes('2Wheeler')}
                            onChange={() => handleVehicleChange('2Wheeler')}
                            style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                          />
                          2-Wheelers
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.vehicles.includes('4Wheeler')}
                            onChange={() => handleVehicleChange('4Wheeler')}
                            style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                          />
                          4-Wheelers
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Document Upload */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>Upload Required Documents (Registry/Electricity Bill/Society NOC) *</label>
                    <div style={{
                      border: '2px dashed var(--glass-border)',
                      borderRadius: '16px',
                      padding: '24px',
                      textAlign: 'center',
                      background: 'rgba(255,255,255,0.01)',
                      position: 'relative',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="file"
                        required
                        onChange={(e) => setDocumentFile(e.target.files[0])}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <Upload size={28} color="var(--accent-primary)" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                          {documentFile ? documentFile.name : 'Click or Drag files to upload'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF, PNG, JPG up to 10MB</span>
                      </div>
                    </div>
                  </div>

                  {/* Additional notes */}
                  <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>Additional Notes (Optional)</label>
                    <textarea
                      rows="3"
                      placeholder="Add any specific parking access instructions or notes..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '0.95rem', resize: 'vertical' }}
                    />
                  </div>

                  {error && <p style={{ color: '#ff4b4b', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 600, textAlign: 'center' }}>{error}</p>}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitStatus === 'submitting'}
                    style={{ width: '100%', padding: '16px', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  >
                    {submitStatus === 'submitting' ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#000' }}
                        />
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        Submit Registration <ArrowRight size={18} />
                      </>
                    )}
                  </button>

                </form>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </section>

    </div>
  );
};

export default PartnerLandingPage;
