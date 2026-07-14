import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, User, Phone, Car, Clock, Calendar, ChevronRight, CheckCircle2, Loader2, Shield, CreditCard
} from 'lucide-react';
import { useUser } from '../hooks/useUser';
import loadingCar from '../assets/Loading_car.webm';
import { API_BASE_URL } from '../config';

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
const OTPVerification = ({ mobile, confirmationResult, onVerified, onBack }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const refs = useRef([]);

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

  const handleVerify = async () => {
    const entered = otp.join('');
    if (entered.length < 6) { setError('Enter all 6 digits'); return; }
    setLoading(true);
    setError('');
    try {
      if (!confirmationResult) {
        throw new Error("Verification session expired. Please go back and request a new code.");
      }
      await confirmationResult.confirm(entered);
      onVerified();
    } catch (err) {
      console.error(err);
      setError('Invalid OTP. Please check the code and try again.');
      setLoading(false);
    }
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
      <div style={{ marginBottom: '24px', padding: '10px 16px', borderRadius: 'var(--radius-input)', background: 'rgba(0, 204, 106, 0.1)', border: '1px solid rgba(0, 204, 106, 0.25)', fontSize: '0.82rem', color: '#00cc6a', fontWeight: 600 }}>
        💬 A 6-digit verification code has been sent to your phone.
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

  const [step, setStep] = useState('form'); // 'form' | 'payment' | 'otp' | 'done'
  const [paymentMode, setPaymentMode] = useState('PAY_AFTER_CHECKOUT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Autofill logic
  React.useEffect(() => {
    if (user && !vehicleNumber && !name && !mobile) {
      setName(user.fullName || user.name || '');
      setMobile(user.mobile || '');
      if (user.vehicles && user.vehicles.length > 0) {
        const primary = user.vehicles.find(v => v.isPrimary) || user.vehicles[0];
        if (primary) {
          setVehicleNumber(primary.plate || '');
          setVehicleName(primary.model || '');
        }
      }
    }
  }, [user]);

  // Form state
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryTime, setEntryTime] = useState('');
  const [duration, setDuration] = useState(2);
  const [errors, setErrors] = useState({});
  const [selectedServices, setSelectedServices] = useState([]);

  const SERVICE_PRICES = {
    'Rest Area': 150,
    'EV Charging': 250,
    'Car Wash': 300,
    'Food & Beverages': 200
  };

  const servicesCost = selectedServices.reduce((sum, srv) => sum + (SERVICE_PRICES[srv] || 0), 0);
  const totalCost = (location?.pricePerHr || 60) * duration + servicesCost;

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

  const handleFormSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setStep('payment');
  };

  const handlePaymentSubmit = () => {
    setConfirmationResult({
      confirm: async (code) => {
        if (code === '123456') {
          return true;
        } else {
          throw new Error("Invalid OTP");
        }
      }
    });
    setStep('otp');
  };

  const handleOTPVerified = async () => {
    setIsSubmitting(true);
    const token = localStorage.getItem('drivix_auth_token');
    const bookingId = `DRX-${Date.now().toString(36).toUpperCase()}`;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId,
          name,
          mobile,
          vehicleNumber: vehicleNumber.toUpperCase().replace(/\s/g, ''),
          vehicleName,
          locationId: location?.id || location?._id,
          locationName: location?.name || location?.parkingName,
          slotId: slot,
          floor,
          entryDate,
          entryTime,
          duration,
          totalCost,
          paymentMode,
          additionalServices: selectedServices
        })
      });

      if (res.ok) {
        const createdBooking = await res.json();
        setBookingData({
          bookingId,
          docId: createdBooking._id || createdBooking.id,
          name, mobile, vehicleNumber: vehicleNumber.toUpperCase().replace(/\s/g, ''),
          vehicleName, slotId: slot, floor, entryDate, entryTime, duration, totalCost,
          locationName: location?.name || location?.parkingName, paymentMode,
          additionalServices: selectedServices
        });
        setStep('done');
      } else {
        const errorData = await res.json();
        alert('Booking failed: ' + (errorData.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error placing booking.');
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

              {user && user.vehicles && user.vehicles.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Select from Registered Vehicles
                  </label>
                  <select 
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-button)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                    value={user.vehicles.some(v => v.plate.toUpperCase() === vehicleNumber.toUpperCase()) ? user.vehicles.find(v => v.plate.toUpperCase() === vehicleNumber.toUpperCase()).plate : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const selected = user.vehicles.find(v => v.plate === val);
                        if (selected) {
                          setVehicleNumber(selected.plate);
                          setVehicleName(selected.model);
                        }
                      } else {
                        setVehicleNumber('');
                        setVehicleName('');
                      }
                    }}
                  >
                    <option value="" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>-- Use a New / Other Vehicle --</option>
                    {user.vehicles.map((v) => (
                      <option 
                        key={v.plate} 
                        value={v.plate}
                        style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                      >
                        {v.plate} ({v.model}) {v.isPrimary ? '⭐️ Primary' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

              {/* Optional Services */}
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px', marginTop: '16px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Optional Services
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                {[
                  { name: 'Rest Area', price: 150, desc: 'Access to premium waiting lounge with Wi-Fi & refreshments', icon: '🛋️' },
                  { name: 'EV Charging', price: 250, desc: 'High-speed EV charging slot setup', icon: '⚡' },
                  { name: 'Car Wash', price: 300, desc: 'Full exterior foam wash & internal vacuuming', icon: '🧼' },
                  { name: 'Food & Beverages', price: 200, desc: 'Pre-ordered snack & beverage package delivered to car', icon: '🍔' }
                ].map((srv) => {
                  const isChecked = selectedServices.includes(srv.name);
                  return (
                    <div 
                      key={srv.name}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedServices(selectedServices.filter(s => s !== srv.name));
                        } else {
                          setSelectedServices([...selectedServices, srv.name]);
                        }
                      }}
                      className="glass-panel"
                      style={{
                        padding: '16px 20px', borderRadius: 'var(--radius-card)', cursor: 'pointer',
                        background: isChecked ? 'rgba(255, 206, 0, 0.05)' : 'var(--bg-tertiary)',
                        border: isChecked ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                        boxShadow: isChecked ? '0 0 16px var(--accent-glow)' : 'none',
                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '14px'
                      }}
                    >
                      <div style={{ fontSize: '1.5rem', width: '36px', height: '36px', borderRadius: '50%', background: isChecked ? 'rgba(255,206,0,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {srv.icon}
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{srv.name}</span>
                          <span style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--accent-primary)' }}>+₹{srv.price}</span>
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{srv.desc}</p>
                      </div>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '4px',
                        border: isChecked ? '2px solid var(--accent-primary)' : '2px solid var(--text-muted)',
                        background: isChecked ? 'var(--accent-primary)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {isChecked && <span style={{ color: '#000', fontSize: '0.75rem', fontWeight: 900 }}>✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cost preview */}
              <div className="glass-panel" style={{ padding: '18px 22px', borderRadius: 'var(--radius-card)', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-tertiary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    Parking ({duration}h × ₹{location.pricePerHr}/hr)
                  </span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>₹{(location?.pricePerHr || 60) * duration}</span>
                </div>
                {servicesCost > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border-light)', paddingTop: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      Additional Services Cost
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>+₹{servicesCost}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid var(--glass-border)', paddingTop: '10px', marginTop: '4px' }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                    Total Payable
                  </span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-primary)' }}>₹{totalCost}</span>
                </div>
              </div>

              <button onClick={handleFormSubmit} className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.05rem', fontWeight: 800 }}>
                Continue to Payment Options <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {/* PAYMENT STEP */}
          {step === 'payment' && (
            <motion.div key="payment" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <button onClick={() => setStep('form')} className="btn btn-secondary" style={{ marginBottom: '28px', padding: '10px 18px', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Back to Details
              </button>

              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '6px' }}>
                Select <span className="text-gradient">Payment Option</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>
                Choose how you want to pay for your parking reservation.
              </p>

              {/* Options list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                
                {/* PAY_AFTER_CHECKOUT Option Card */}
                <div 
                  onClick={() => setPaymentMode('PAY_AFTER_CHECKOUT')}
                  className="glass-panel"
                  style={{
                    padding: '20px', borderRadius: 'var(--radius-card)', cursor: 'pointer',
                    background: paymentMode === 'PAY_AFTER_CHECKOUT' ? 'rgba(0, 204, 106, 0.05)' : 'var(--bg-tertiary)',
                    border: paymentMode === 'PAY_AFTER_CHECKOUT' ? '2.5px solid #00cc6a' : '1px solid var(--glass-border)',
                    boxShadow: paymentMode === 'PAY_AFTER_CHECKOUT' ? '0 0 16px rgba(0, 204, 106, 0.15)' : 'none',
                    transition: 'all 0.2s', position: 'relative'
                  }}
                >
                  <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0, 204, 106, 0.15)', color: '#00cc6a', fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', letterSpacing: '0.5px' }}>
                    RECOMMENDED
                  </div>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0, 204, 106, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00cc6a', flexShrink: 0 }}>
                      <Clock size={20} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.08rem', fontWeight: 800 }}>Pay After Checkout</h3>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                        No advance pay. Session starts at entry. Pay only for actual parked hours upon exit.
                      </p>
                    </div>
                  </div>
                </div>

                {/* PAY_NOW Option Card */}
                <div 
                  onClick={() => setPaymentMode('PAY_NOW')}
                  className="glass-panel"
                  style={{
                    padding: '20px', borderRadius: 'var(--radius-card)', cursor: 'pointer',
                    background: paymentMode === 'PAY_NOW' ? 'rgba(255, 206, 0, 0.05)' : 'var(--bg-tertiary)',
                    border: paymentMode === 'PAY_NOW' ? '2.5px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                    boxShadow: paymentMode === 'PAY_NOW' ? '0 0 16px var(--accent-glow)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255, 206, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', flexShrink: 0 }}>
                      <CreditCard size={20} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.08rem', fontWeight: 800 }}>Pay Now</h3>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                        Prepay ₹{totalCost} for {duration} hours now. Quick exit with pre-generated QR ticket.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Comparison table */}
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'left' }}>
                Comparison
              </h3>
              <div className="glass-panel" style={{ overflow: 'hidden', borderRadius: 'var(--radius-card)', border: '1px solid var(--glass-border)', marginBottom: '32px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                      <th style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontWeight: 700 }}>Feature</th>
                      <th style={{ padding: '12px 14px', color: '#00cc6a', fontWeight: 800 }}>Pay After Checkout</th>
                      <th style={{ padding: '12px 14px', color: 'var(--accent-primary)', fontWeight: 800 }}>Pay Now</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Entry Cost</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>₹0 (Book Free)</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>₹{totalCost} prepaid</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Flexibility</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>High (leave early/late)</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>Fixed duration</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Overstay</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>No extra penalty</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>Penalty charges at exit</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Best For</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>Shopping, Errands</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>Work, Fixed events</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <button onClick={handlePaymentSubmit} className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.05rem', fontWeight: 800 }}>
                Proceed to Verification <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {/* OTP STEP */}
          {step === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              {isSubmitting ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <video 
                    src={loadingCar} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    style={{ width: '120px', height: '120px', margin: '0 auto 16px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                  <p style={{ color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '1px' }}>CONFIRMING YOUR BOOKING...</p>
                </div>
              ) : (
                <OTPVerification
                  mobile={mobile}
                  confirmationResult={confirmationResult}
                  onVerified={handleOTPVerified}
                  onBack={() => setStep('form')}
                />
              )}
            </motion.div>
          )}

          <div id="recaptcha-container"></div>

        </AnimatePresence>
      </div>
    </div>
  );
};

export default SlotBookingForm;
