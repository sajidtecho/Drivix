import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import {
  ArrowLeft, Calendar, Clock, BatteryCharging, CreditCard,
  Smartphone, Wallet, CheckCircle2, MapPin, Zap, Timer,
  ChevronRight, Car, Loader2, Plus
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

/* ─── helpers ─────────────────────────────────────── */
const pad = (n) => String(n).padStart(2, '0');
const fmtTime = (secs) =>
  `${pad(Math.floor(secs / 3600))}:${pad(Math.floor((secs % 3600) / 60))}:${pad(secs % 60)}`;

const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8];
const EV_RATE = 30;

const PAYMENT_METHODS = [
  { id: 'upi',    label: 'UPI',    icon: Smartphone, desc: 'Pay via any UPI app' },
  { id: 'fastag', label: 'FASTag', icon: Zap,        desc: 'Auto-deduct from wallet' },
  { id: 'card',   label: 'Card',   icon: CreditCard, desc: 'Credit / Debit card' },
  { id: 'wallet', label: 'Wallet', icon: Wallet,     desc: 'Drivix wallet balance' },
];

/* ─── tiny shared pieces (no state, safe as components) ── */
const SpotCard = ({ spot }) => (
  <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', background: 'var(--bg-tertiary)' }}>
    <div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>SELECTED SPOT</p>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>{spot.title}</h3>
      <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}><MapPin size={13} /> {spot.distance}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00cc6a', fontWeight: 600 }}><Clock size={13} color="#00cc6a" /> {spot.slots} slots left</span>
      </div>
    </div>
    <div style={{ textAlign: 'right' }}>
      <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>₹{spot.pricePerHr}</span>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>/hr</span>
    </div>
  </div>
);

const StepBar = ({ step }) => (
  <div style={{ display: 'flex', gap: '8px', marginBottom: '36px' }}>
    {['Details', 'Add-ons', 'Payment'].map((label, i) => (
      <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ height: '4px', borderRadius: '2px', transition: 'background 0.35s', background: step > i + 1 ? 'var(--accent-primary)' : step === i + 1 ? 'var(--accent-secondary)' : 'var(--glass-border-light)' }} />
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: step >= i + 1 ? 'var(--accent-secondary)' : 'var(--text-secondary)' }}>{label}</span>
      </div>
    ))}
  </div>
);

/* ─── main ────────────────────────────────────────── */
const Booking = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();
  const locState = useLocation().state;

  const spot = locState?.spot ?? {
    id: 'default-spot',
    title: 'CP Inner Circle – Premium',
    distance: '0.8 km',
    slots: 42,
    pricePerHr: 60,
    color: 'var(--accent-primary)',
  };

  const [step,         setStep]        = useState(1);
  const [date,         setDate]        = useState(new Date().toISOString().split('T')[0]);
  const [arrivalTime,  setArrivalTime] = useState('');
  const [duration,     setDuration]    = useState(2);
  const [selectedVehicle, setSelectedVehicle] = useState(user?.vehicles?.[0] || null);
  const [evCharging,   setEvCharging]  = useState(user?.preferences?.evCharging ?? false);
  const [payMethod,    setPayMethod]   = useState('upi');
  const [elapsed,      setElapsed]     = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [finalElapsed, setFinalElapsed] = useState(0);
  const [bookingId,    setBookingId]   = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (user?.vehicles?.length > 0 && !selectedVehicle) {
      setSelectedVehicle(user.vehicles[0]);
    }
  }, [user, selectedVehicle]);

  const totalRate     = spot.pricePerHr + (evCharging ? EV_RATE : 0);
  const estimatedCost = (totalRate * duration).toFixed(0);
  const liveFare      = ((elapsed / 3600) * totalRate).toFixed(2);

  /* live timer */
  useEffect(() => {
    if (step !== 4 || sessionEnded) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [step, sessionEnded]);

  const startSession = async () => {
    setIsProcessing(true);
    try {
      const bRef = await addDoc(collection(db, 'bookings'), {
        userId: user.uid,
        userName: user.name,
        spotId: spot.id || 'unknown',
        spotTitle: spot.title,
        vehiclePlate: selectedVehicle?.plate || 'Unknown',
        date,
        arrivalTime,
        duration,
        evCharging,
        payMethod,
        status: 'active',
        startTime: serverTimestamp(),
        estimatedCost: parseFloat(estimatedCost)
      });
      setBookingId(bRef.id);
      setStep(4);
    } catch (err) {
      console.error(err);
      alert('Failed to start session. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const endSession = async () => {
    setIsProcessing(true);
    const finalFare = parseFloat(((elapsed / 3600) * totalRate).toFixed(2));
    try {
      const bRef = doc(db, 'bookings', bookingId);
      await updateDoc(bRef, {
        status: 'completed',
        endTime: serverTimestamp(),
        finalElapsed: elapsed,
        finalFare
      });
      setFinalElapsed(elapsed);
      setSessionEnded(true);
    } catch (err) {
      console.error(err);
      alert('Failed to end session properly, but your time is recorded.');
      setFinalElapsed(elapsed);
      setSessionEnded(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const slide = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: -40 },
    transition: { duration: 0.22 },
  };

  /* ═══════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════ */
  return (
    <div style={{ paddingTop: '90px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 5% 80px' }}>

        {/* Back button */}
        {step < 4 && (
          <button
            onClick={() => step > 1 ? setStep((s) => s - 1) : navigate('/find')}
            className="btn btn-secondary"
            style={{ marginBottom: '28px', padding: '10px 18px', fontSize: '0.9rem' }}
          >
            <ArrowLeft size={16} /> {step > 1 ? 'Back' : 'Back to Find Parking'}
          </button>
        )}

        {step < 4 && <StepBar step={step} />}

        <AnimatePresence mode="wait">

          {/* ── STEP 1 – DETAILS ──────────────────────── */}
          {step === 1 && (
            <motion.div key="step1" {...slide}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Booking <span className="text-gradient">Details</span></h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>Choose your date, arrival time and how long you need the slot.</p>
              <SpotCard spot={spot} />

              {/* Vehicle Selection */}
              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>SELECT VEHICLE</label>
                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                  {user?.vehicles?.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVehicle(v)}
                      style={{
                        padding: '12px 20px', borderRadius: 'var(--radius-input)', border: selectedVehicle?.id === v.id ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                        background: selectedVehicle?.id === v.id ? 'rgba(255, 206, 0, 0.05)' : 'var(--bg-tertiary)',
                        color: selectedVehicle?.id === v.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s', flexShrink: 0
                      }}
                    >
                      <Car size={18} color={selectedVehicle?.id === v.id ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{v.plate}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{v.model}</div>
                      </div>
                    </button>
                  ))}
                  <button onClick={() => navigate('/profile')} style={{ padding: '12px 20px', borderRadius: 'var(--radius-input)', border: '1px dashed var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <Plus size={18} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>New Vehicle</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                {/* Date */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>DATE</label>
                  <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderRadius: 'var(--radius-input)', background: 'var(--bg-tertiary)', gap: '10px' }}>
                    <Calendar size={18} color="var(--accent-primary)" />
                    <input
                      type="date"
                      value={date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDate(e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '1rem', outline: 'none', flex: 1 }}
                    />
                  </div>
                </div>

                {/* Arrival Time */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>ARRIVAL TIME</label>
                  <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderRadius: 'var(--radius-input)', background: 'var(--bg-tertiary)', gap: '10px' }}>
                    <Clock size={18} color="var(--accent-secondary)" />
                    <input
                      type="time"
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '1rem', outline: 'none', flex: 1 }}
                    />
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>PARKING DURATION</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {DURATION_OPTIONS.map((hrs) => (
                    <button
                      key={hrs}
                      onClick={() => setDuration(hrs)}
                      style={{
                        padding: '10px 20px', borderRadius: 'var(--radius-button)', fontFamily: 'inherit',
                        fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                        background: duration === hrs ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--glass-bg)',
                        color: duration === hrs ? '#000' : 'var(--text-primary)',
                        boxShadow: duration === hrs ? '0 4px 15px var(--accent-glow)' : 'none',
                        border: duration === hrs ? 'none' : '1px solid var(--glass-border)',
                        transition: 'all 0.2s',
                      }}
                    >
                      {hrs}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost preview */}
              <div style={{ padding: '16px 20px', borderRadius: 'var(--radius-card)', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Estimated cost ({duration}h @ ₹{spot.pricePerHr}/hr)</span>
                <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>₹{(spot.pricePerHr * duration).toFixed(0)}</span>
              </div>

              <button
                onClick={() => {
                  if (!arrivalTime) {
                    window.alert('Please select your arrival time to continue.');
                    return;
                  }
                  if (!selectedVehicle) {
                    window.alert('Please select a vehicle to continue.');
                    return;
                  }
                  setStep(2);
                }}
                className="btn btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: '1.05rem' }}
              >
                Continue to Add-ons <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {/* ── STEP 2 – EV CHARGING ──────────────────── */}
          {step === 2 && (
            <motion.div key="step2" {...slide}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Add-<span className="text-gradient">ons</span></h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>Enhance your parking with optional services.</p>
              <SpotCard spot={spot} />

              {/* EV Toggle Card */}
              <div
                onClick={() => setEvCharging((v) => !v)}
                className="glass-panel"
                style={{
                  padding: '24px', marginBottom: '20px', cursor: 'pointer',
                  border: evCharging ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                  background: evCharging ? 'rgba(255,206,0,0.04)' : 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-card)', transition: 'all 0.25s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: evCharging ? 'rgba(255,206,0,0.15)' : 'var(--bg-secondary)', transition: 'all 0.25s' }}>
                      <BatteryCharging size={26} color={evCharging ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '4px' }}>EV Charging</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Charge your electric vehicle while parked</p>
                      <p style={{ color: 'var(--accent-secondary)', fontWeight: 700, fontSize: '0.88rem', marginTop: '2px' }}>+ ₹{EV_RATE}/hr</p>
                    </div>
                  </div>
                  {/* Toggle pill */}
                  <div style={{ width: '48px', height: '26px', borderRadius: 'var(--radius-pill)', background: evCharging ? 'var(--accent-primary)' : 'var(--glass-border-light)', position: 'relative', transition: 'background 0.25s', flexShrink: 0 }}>
                    <motion.div
                      animate={{ left: evCharging ? '24px' : '2px' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      style={{ position: 'absolute', top: '2px', width: '22px', height: '22px', borderRadius: '50%', background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
                    />
                  </div>
                </div>

                {evCharging && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {['Fast Charging (22kW)', 'Slow Charging (7.4kW)'].map((opt, i) => (
                        <div key={opt} style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-button)', textAlign: 'center', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', background: i === 0 ? 'rgba(255,206,0,0.1)' : 'var(--bg-secondary)', border: i === 0 ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)', color: i === 0 ? 'var(--accent-secondary)' : 'var(--text-secondary)' }}>
                          {opt}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Cost breakdown */}
              <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: 'var(--radius-card)', marginBottom: '28px', background: 'var(--bg-tertiary)' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '14px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>COST BREAKDOWN</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Parking ({duration}h × ₹{spot.pricePerHr})</span>
                  <span style={{ fontWeight: 700 }}>₹{spot.pricePerHr * duration}</span>
                </div>
                {evCharging && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>EV Charging ({duration}h × ₹{EV_RATE})</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>₹{EV_RATE * duration}</span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px', marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>Total Estimate</span>
                  <span style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--accent-primary)' }}>₹{estimatedCost}</span>
                </div>
              </div>

              <button onClick={() => setStep(3)} className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.05rem' }}>
                Proceed to Payment <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {/* ── STEP 3 – PAYMENT ──────────────────────── */}
          {step === 3 && (
            <motion.div key="step3" {...slide}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Confirm & <span className="text-gradient">Pay</span></h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>Review your booking and choose a payment method.</p>

              {/* Summary */}
              <div className="glass-panel" style={{ padding: '22px 24px', marginBottom: '24px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-card)' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '14px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>BOOKING SUMMARY</h4>
                {[
                  ['Parking Spot', spot.title],
                  ['Vehicle',      selectedVehicle?.plate || '—'],
                  ['Date',         date],
                  ['Arrival Time', arrivalTime],
                  ['Duration',     `${duration} hour${duration > 1 ? 's' : ''}`],
                  ['EV Charging',  evCharging ? '✓ Included' : 'Not added'],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontWeight: 600, color: String(val).startsWith('✓') ? '#00cc6a' : 'var(--text-primary)', maxWidth: '55%', textAlign: 'right' }}>{val}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: '12px', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Total</span>
                  <span style={{ fontWeight: 900, fontSize: '1.6rem', color: 'var(--accent-primary)' }}>₹{estimatedCost}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '8px' }}>
                  * Final charge is based on actual time. Session starts on confirmation.
                </p>
              </div>

              {/* Payment method */}
              <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>PAYMENT METHOD</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
                {PAYMENT_METHODS.map((pm) => {
                  const Icon = pm.icon;
                  return (
                  <button
                    key={pm.id}
                    onClick={() => setPayMethod(pm.id)}
                    style={{
                      padding: '16px', borderRadius: 'var(--radius-card)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      border: payMethod === pm.id ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                      background: payMethod === pm.id ? 'rgba(255,206,0,0.06)' : 'var(--bg-tertiary)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Icon size={22} color={payMethod === pm.id ? 'var(--accent-primary)' : 'var(--text-secondary)'} style={{ marginBottom: '10px' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{pm.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{pm.desc}</div>
                  </button>
                  );
                })}
              </div>

              <button
                onClick={startSession}
                disabled={isProcessing}
                className="btn btn-primary"
                style={{ width: '100%', padding: '18px', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                {isProcessing ? <Loader2 className="animate-spin" size={24} /> : (
                  <><CheckCircle2 size={24} /> Confirm & Start Session</>
                )}
              </button>
            </motion.div>
          )}

          {/* ── STEP 4 – LIVE SESSION ─────────────────── */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
              {!sessionEnded ? (
                <div style={{ textAlign: 'center' }}>
                  {/* Pulsing live dot */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '36px' }}>
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                      style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#00cc6a' }}
                    />
                    <span style={{ fontWeight: 700, color: '#00cc6a', fontSize: '1rem' }}>Live Parking Session</span>
                  </div>

                  {/* Giant clock */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: 'clamp(3.5rem, 12vw, 5.5rem)', fontWeight: 900, letterSpacing: '4px', color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      {fmtTime(elapsed)}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.85rem', letterSpacing: '8px' }}>HH  MM  SS</p>
                  </div>

                  {/* Running fare */}
                  <motion.div
                    animate={{ scale: [1, 1.015, 1] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                    style={{ display: 'inline-block', padding: '14px 36px', borderRadius: 'var(--radius-pill)', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', marginBottom: '36px' }}
                  >
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#333', marginBottom: '2px' }}>RUNNING FARE</p>
                    <p style={{ fontSize: '2.2rem', fontWeight: 900, color: '#000', lineHeight: 1 }}>₹ {liveFare}</p>
                  </motion.div>

                  {/* Session info */}
                  <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: 'var(--radius-card)', marginBottom: '32px', background: 'var(--bg-tertiary)', textAlign: 'left' }}>
                    {[
                      ['Spot',        spot.title],
                      ['Vehicle',     selectedVehicle?.plate || '—'],
                      ['Rate',        `₹${totalRate}/hr${evCharging ? ' (incl. EV)' : ''}`],
                      ['Arrived',     arrivalTime || '—'],
                      ['EV Charging', evCharging ? 'Active ⚡' : 'Not active'],
                    ].map(([label, val]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.92rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                        <span style={{ fontWeight: 600, color: String(val).includes('Active') ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>{val}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={endSession}
                    disabled={isProcessing}
                    className="btn btn-secondary"
                    style={{ width: '100%', padding: '16px', fontSize: '1.05rem', border: '1.5px solid #ff4b4b', color: '#ff4b4b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={20} /> : (
                      <><Timer size={18} /> End Session & Pay</>
                    )}
                  </button>
                </div>
              ) : (
                /* ── FINAL BILL ── */
                <div style={{ textAlign: 'center' }}>
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                    style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 30px var(--accent-glow)' }}
                  >
                    <CheckCircle2 color="#000" size={40} />
                  </motion.div>

                  <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>Session Ended!</h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Thanks for parking with Drivix. Here's your final bill.</p>

                  <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-card)', marginBottom: '28px', background: 'var(--bg-tertiary)', textAlign: 'left' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px' }}>FINAL BILL</h4>
                    {[
                      ['Duration',     fmtTime(finalElapsed)],
                      ['Parking Rate', `₹${spot.pricePerHr}/hr`],
                      ...(evCharging ? [['EV Charging', `₹${EV_RATE}/hr`]] : []),
                    ].map(([label, val]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.92rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                        <span style={{ fontWeight: 600 }}>{val}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '14px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Total Charged</span>
                      <span style={{ fontWeight: 900, fontSize: '1.8rem', color: 'var(--accent-primary)' }}>
                        ₹{((finalElapsed / 3600) * totalRate).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" style={{ flex: 1, padding: '14px' }}>Download Receipt</button>
                    <button onClick={() => navigate('/find')} className="btn btn-primary" style={{ flex: 1, padding: '14px' }}>Find Parking Again</button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default Booking;
