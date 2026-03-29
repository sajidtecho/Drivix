import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, User, Phone, Car, Clock, Calendar, ChevronRight, CheckCircle2, Loader2, Shield
} from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';

const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8];

/* ─── Styled Input ───────────────────────────────── */
const FormField = ({ label, icon: FieldIcon, iconColor = 'var(--accent-primary)', error, children }) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
      {label}
    </label>
    <div
      className="glass-panel"
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 16px', borderRadius: 'var(--radius-input)',
        background: 'var(--bg-tertiary)',
        border: error ? '1.5px solid #ff4b4b' : '1px solid var(--glass-border)',
        transition: 'all 0.2s',
      }}
    >
      <FieldIcon size={18} color={error ? '#ff4b4b' : iconColor} style={{ flexShrink: 0 }} />
      {children}
    </div>
    {error && <p style={{ marginTop: '5px', fontSize: '0.78rem', color: '#ff4b4b', fontWeight: 600 }}>{error}</p>}
  </div>
);

const inputStyle = {
  flex: 1, background: 'transparent', border: 'none',
  outline: 'none', fontSize: '1rem', fontFamily: 'inherit',
  color: 'var(--text-primary)',
};

/* ─── OTP Component ──────────────────────────────── */
const OTPVerification = ({ mobile, onVerified, onBack }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // OTP is simulated – always 123456 in demo
  const [resendCooldown, setResendCooldown] = useState(30);
  const refs = useRef([]);

  // Simulated OTP: always '123456' for demo
  const DEMO_OTP = '123456';

  React.useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const handleInput = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const entered = otp.join('');
    if (entered.length < 6) { setError('Enter all 6 digits'); return; }
    setLoading(true);
    setTimeout(() => {
      if (entered === DEMO_OTP) {
        onVerified();
      } else {
        setError('Invalid OTP. (Demo: use 123456)');
        setLoading(false);
      }
    }, 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ textAlign: 'center', padding: '0 8px' }}
    >
      {/* Shield icon */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
        style={{
          width: '80px', height: '80px', borderRadius: 'var(--radius-card)',
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', boxShadow: '0 0 30px var(--accent-glow)',
        }}
      >
        <Shield size={36} color="#000" />
      </motion.div>

      <h2 style={{ fontSize: '1.7rem', fontWeight: 900, marginBottom: '8px' }}>
        OTP <span className="text-gradient">Verification</span>
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
        We sent a 6-digit code to
      </p>
      <p style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '32px', color: 'var(--text-primary)' }}>
        +91 {mobile}
      </p>

      {/* Demo hint */}
      <div style={{ marginBottom: '24px', padding: '10px 16px', borderRadius: 'var(--radius-input)', background: 'rgba(255,206,0,0.1)', border: '1px solid rgba(255,206,0,0.25)', fontSize: '0.82rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>
        🔐 Demo Mode — Use OTP: <strong>123456</strong>
      </div>

      {/* OTP inputs */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '16px' }}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInput(e.target.value, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            style={{
              width: 'clamp(40px, 12vw, 56px)',
              height: 'clamp(48px, 13vw, 64px)',
              borderRadius: 'var(--radius-input)', textAlign: 'center',
              fontSize: '1.6rem', fontWeight: 900,
              fontFamily: 'inherit',
              background: digit ? 'rgba(255,206,0,0.1)' : 'var(--bg-tertiary)',
              border: digit ? '2px solid var(--accent-primary)' : '1.5px solid var(--glass-border)',
              color: 'var(--text-primary)', outline: 'none',
              transition: 'all 0.15s',
              boxShadow: digit ? '0 0 10px var(--accent-glow)' : 'none',
            }}
          />
        ))}
      </div>

      {error && (
        <p style={{ color: '#ff4b4b', fontWeight: 600, fontSize: '0.88rem', marginBottom: '16px' }}>{error}</p>
      )}

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '28px' }}>
        Didn't receive?{' '}
        {resendCooldown > 0
          ? <span style={{ color: 'var(--text-secondary)' }}>Resend in {resendCooldown}s</span>
          : <button onClick={() => setResendCooldown(30)} style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>Resend OTP</button>
        }
      </p>

      <button
        onClick={handleVerify}
        disabled={loading}
        className="btn btn-primary"
        style={{ width: '100%', padding: '16px', fontSize: '1.05rem', fontWeight: 800, marginBottom: '14px' }}
      >
        {loading ? <Loader2 className="animate-spin" size={22} /> : <><CheckCircle2 size={22} /> Verify & Confirm</>}
      </button>
      <button onClick={onBack} className="btn btn-secondary" style={{ width: '100%', padding: '14px' }}>
        <ArrowLeft size={16} /> Go Back
      </button>
    </motion.div>
  );
};

/* ─── Main Booking Form ──────────────────────────── */
const SlotBookingForm = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const locState = useLocation().state;
  const { location, slot, floor } = locState || {};

  const [step, setStep] = useState('form'); // 'form' | 'otp' | 'done'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryTime, setEntryTime] = useState('');
  const [duration, setDuration] = useState(2);
  const [errors, setErrors] = useState({});

  const totalCost = (location?.pricePerHr || 60) * duration;

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!/^[6-9]\d{9}$/.test(mobile)) e.mobile = 'Enter a valid 10-digit mobile number';
    if (!/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/i.test(vehicleNumber.replace(/\s/g, '')))
      e.vehicleNumber = 'Enter valid vehicle number (e.g. UP32AB1234)';
    if (!vehicleName.trim()) e.vehicleName = 'Vehicle name/model is required';
    if (!entryTime) e.entryTime = 'Please select entry time';
    return e;
  };

  const handleFormSubmit = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) setStep('otp');
  };

  const handleOTPVerified = async () => {
    setIsSubmitting(true);
    try {
      const bookingId = `DRX-${Date.now().toString(36).toUpperCase()}`;
      // 1. Save booking document
      const ref = await addDoc(collection(db, 'bookings'), {
        bookingId,
        name,
        mobile,
        vehicleNumber: vehicleNumber.toUpperCase().replace(/\s/g, ''),
        vehicleName,
        locationId: location?.id,
        locationName: location?.name,
        slotId: slot,
        floor,
        entryDate,
        entryTime,
        duration,
        totalCost,
        status: 'booked',
        userId: user?.uid || null,
        createdAt: serverTimestamp(),
      });

      // 2. Update real-time slot status in the facility
      const slotRef = doc(db, 'parking_facilities', location.id, 'slots', slot);
      await updateDoc(slotRef, { status: 'booked', updatedAt: serverTimestamp() });

      // 3. Decrement available slots count for the facility
      const facilityRef = doc(db, 'parking_facilities', location.id);
      await updateDoc(facilityRef, {
        availableSlots: increment(-1)
      });

      setBookingData({
        bookingId,
        docId: ref.id,
        name, mobile, vehicleNumber: vehicleNumber.toUpperCase().replace(/\s/g, ''),
        vehicleName, slotId: slot, floor, entryDate, entryTime, duration, totalCost,
        locationName: location?.name,
      });
      setStep('done');
    } catch (err) {
      console.error(err);
      // Still show ticket in demo mode even if Firestore fails
      const bookingId = `DRX-${Date.now().toString(36).toUpperCase()}`;
      setBookingData({
        bookingId,
        name, mobile, vehicleNumber: vehicleNumber.toUpperCase().replace(/\s/g, ''),
        vehicleName, slotId: slot, floor, entryDate, entryTime, duration, totalCost,
        locationName: location?.name,
      });
      setStep('done');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!location || !slot) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center', padding: '120px 20px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No booking data found.</p>
        <button className="btn btn-primary" onClick={() => navigate('/parking')} style={{ marginTop: '20px' }}>
          Start Booking
        </button>
      </div>
    );
  }

  if (step === 'done' && bookingData) {
    navigate('/ticket', { state: { booking: bookingData }, replace: true });
    return null;
  }

  return (
    <div style={{ paddingTop: '90px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 5% 80px' }}>

        <AnimatePresence mode="wait">

          {/* FORM STEP */}
          {step === 'form' && (
            <motion.div key="form" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '28px', padding: '10px 18px', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Back
              </button>

              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '6px' }}>
                Booking <span className="text-gradient">Details</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>
                Complete your details to reserve slot <strong style={{ color: 'var(--text-primary)' }}>{slot}</strong> on {floor}
              </p>

              {/* Summary card */}
              <div className="glass-panel" style={{ padding: '18px 22px', marginBottom: '28px', borderRadius: 'var(--radius-card)', background: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '3px' }}>{location.name}</p>
                  <p style={{ fontWeight: 800, fontSize: '1.1rem' }}>Slot {slot} · {floor}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rate</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent-primary)' }}>₹{location.pricePerHr}/hr</p>
                </div>
              </div>

              {/* Personal Details */}
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Personal Info
              </h3>

              <FormField label="Full Name" icon={User} error={errors.name}>
                <input style={inputStyle} type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              </FormField>

              <FormField label="Mobile Number" icon={Phone} iconColor="var(--accent-secondary)" error={errors.mobile}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.95rem' }}>+91</span>
                <input style={inputStyle} type="tel" placeholder="Mobile Number" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} />
              </FormField>

              {/* Vehicle Details */}
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px', marginTop: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Vehicle Info
              </h3>

              <FormField label="Vehicle Number" icon={Car} error={errors.vehicleNumber}>
                <input
                  style={{ ...inputStyle, textTransform: 'uppercase' }}
                  type="text" placeholder="UP32AB1234" maxLength={12}
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                />
              </FormField>

              <FormField label="Vehicle Name / Model" icon={Car} iconColor="#00D2FF" error={errors.vehicleName}>
                <input style={inputStyle} type="text" placeholder="Maruti Swift, Honda City..." value={vehicleName} onChange={(e) => setVehicleName(e.target.value)} />
              </FormField>

              {/* Time & Duration */}
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px', marginTop: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Time & Duration
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <FormField label="Date" icon={Calendar} error={errors.entryDate}>
                  <input type="date" style={inputStyle} value={entryDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setEntryDate(e.target.value)} />
                </FormField>
                <FormField label="Entry Time" icon={Clock} iconColor="var(--accent-secondary)" error={errors.entryTime}>
                  <input type="time" style={inputStyle} value={entryTime} onChange={(e) => setEntryTime(e.target.value)} />
                </FormField>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Duration
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {DURATION_OPTIONS.map((h) => (
                    <button
                      key={h}
                      onClick={() => setDuration(h)}
                      style={{
                        padding: '10px 18px', borderRadius: 'var(--radius-button)', fontFamily: 'inherit',
                        fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                        background: duration === h ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--glass-bg)',
                        color: duration === h ? '#000' : 'var(--text-primary)',
                        border: duration === h ? 'none' : '1px solid var(--glass-border)',
                        boxShadow: duration === h ? '0 4px 12px var(--accent-glow)' : 'none',
                        transition: 'all 0.18s',
                      }}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost preview */}
              <div className="glass-panel" style={{ padding: '18px 22px', borderRadius: 'var(--radius-card)', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  {duration}h × ₹{location.pricePerHr}/hr
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-primary)' }}>₹{totalCost}</span>
              </div>

              <button onClick={handleFormSubmit} className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.05rem', fontWeight: 800 }}>
                Continue to OTP Verification <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {/* OTP STEP */}
          {step === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              {isSubmitting ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" style={{ margin: '0 auto 16px' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>Confirming your booking...</p>
                </div>
              ) : (
                <OTPVerification
                  mobile={mobile}
                  onVerified={handleOTPVerified}
                  onBack={() => setStep('form')}
                />
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default SlotBookingForm;
