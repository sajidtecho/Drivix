import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import * as htmlToImage from 'html-to-image';
import challanIcon from '../assets/challan.png';
import { API_BASE_URL } from '../config';
import { useToast } from '../context/ToastContext';
import {
  CheckCircle2, MapPin, Navigation, Car, Clock,
  Calendar, Download, Home, Share2, Shield, Loader2
} from 'lucide-react';

const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.toUpperCase().includes('AM') || timeStr.toUpperCase().includes('PM')) {
    return timeStr;
  }
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].substring(0, 2);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  }
  return timeStr;
};

const Ticket = () => {
  const navigate = useNavigate();
  const locState = useLocation().state;
  const initialBooking = locState?.booking;
  const ticketRef = useRef(null);
  const { showToast } = useToast();

  const [booking, setBooking] = useState(initialBooking);
  const [qrToken, setQrToken] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (booking && booking.slotId && !qrToken) {
      // Generate a client-side placeholder token or fetch the token
      const token = localStorage.getItem('drivix_auth_token');
      // If we don't have a token, we request a slot details update to retrieve the encrypted pass
      const fetchBookingDetails = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/bookings/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const current = data.find(b => b.bookingId === booking.bookingId || b._id === booking.docId || b._id === booking._id);
            if (current && current.slotId) {
              setBooking(current);
            }
          }
        } catch (err) {
          console.error("Error retrieving booking token:", err);
        }
      };
      fetchBookingDetails();
    }
  }, [booking, qrToken]);

  if (!booking) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center', padding: '120px 20px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No booking found.</p>
        <button className="btn btn-primary" onClick={() => navigate('/parking')} style={{ marginTop: '20px' }}>
          Book a Slot
        </button>
      </div>
    );
  }

  const qrPayload = JSON.stringify({
    id: booking.bookingId,
    slot: booking.slotId,
    floor: booking.floor,
    vehicle: booking.vehicleNumber,
    date: booking.entryDate,
    time: booking.entryTime,
    token: qrToken || 'DRIVIX-PASS-TOKEN-AUTO-VERIFIED'
  });

  const handleStartNavigation = async () => {
    setSubmitting(true);
    const token = localStorage.getItem('drivix_auth_token');
    const bookingDocId = booking.docId || booking._id;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/${bookingDocId}/assign-slot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setBooking(data.booking);
        setQrToken(data.qrToken);
        showToast(`Dynamic Slot Assigned: ${data.booking.slotId} on ${data.booking.floor}!`, "success");

        // Delay navigation slightly to let user see confirmation
        setTimeout(() => {
          if (data.booking.latitude !== undefined && data.booking.longitude !== undefined) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${data.booking.latitude},${data.booking.longitude}`, '_blank');
          } else {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(data.booking.locationName)}`, '_blank');
          }
        }, 1500);
      } else {
        const err = await res.json();
        showToast(err.message || "Failed to assign slot. Please check floor capacity.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error executing slot allocation.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleArrivalCheck = async (action) => {
    setSubmitting(true);
    const token = localStorage.getItem('drivix_auth_token');
    const bookingDocId = booking.docId || booking._id;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/${bookingDocId}/arrival-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (res.ok) {
        const data = await res.json();
        if (action === 'cancel') {
          showToast("Reservation cancelled and capacity released.", "success");
          navigate('/parking');
        } else if (action === 'delay') {
          setBooking(data.booking);
          showToast("Arrival time delayed by 30 minutes successfully.", "success");
        } else if (action === 'yes') {
          setBooking(data.booking);
          setQrToken(data.qrToken);
          showToast(`Welcome! Slot assigned: ${data.booking.slotId} (${data.booking.floor})`, "success");
        }
      } else {
        const err = await res.json();
        showToast(err.message || `Failed to process action ${action}`, "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error sending confirmation.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenMaps = () => {
    if (booking.latitude !== undefined && booking.longitude !== undefined) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${booking.latitude},${booking.longitude}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.locationName)}`, '_blank');
    }
  };

  const handleShare = async () => {
    const slotStr = booking.slotId ? booking.slotId : 'Assigned on arrival';
    const text = `🎟️ Drivix Parking Ticket\nBooking ID: ${booking.bookingId}\nSlot: ${slotStr} (${booking.floor})\nDate: ${booking.entryDate} at ${booking.entryTime}\nVehicle: ${booking.vehicleNumber}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'My Parking Ticket', text }); } catch (err) { console.error('Share failed', err); }
    } else {
      navigator.clipboard?.writeText(text);
      alert('Ticket details copied to clipboard!');
    }
  };

  const handleWhatsAppShare = () => {
    const slotStr = booking.slotId ? booking.slotId : 'Assigned on arrival';
    const text = `*Drivix Parking Ticket* 🚗\n\n*Booking ID:* ${booking.bookingId}\n*Slot:* ${slotStr} (${booking.floor})\n*Vehicle:* ${booking.vehicleNumber} (${booking.vehicleName})\n*Entry:* ${booking.entryTime} on ${booking.entryDate}\n\n✅ Your reservation at ${booking.locationName} is confirmed.\n_Please show this at the entry gate._`;
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/${booking.mobile.startsWith('91') ? booking.mobile : '91' + booking.mobile}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareAsImage = async () => {
    if (ticketRef.current === null) return;
    
    try {
      const dataUrl = await htmlToImage.toPng(ticketRef.current, { 
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#0a0a14',
        cacheBust: true,
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const filename = `Drivix-Ticket-${booking.bookingId}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Drivix Parking Ticket',
          text: `Here is my parking ticket for ${booking.slotId ? `Slot ${booking.slotId}` : `${booking.floor} reservation`} at ${booking.locationName}.`
        });
      } else {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
        alert('Ticket image downloaded! You can now share it manually on WhatsApp.');
      }
    } catch (err) {
      console.error('Image capture failed', err);
      alert('Could not generate ticket image. Please take a screenshot instead.');
    }
  };

  return (
    <div style={{ paddingTop: '90px', minHeight: '100vh', background: 'var(--bg-primary)', padding: '110px 5% 80px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>

        {/* Success animation */}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          style={{ textAlign: 'center', marginBottom: '32px' }}
        >
          <div style={{
            width: '90px', height: '90px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #00cc6a, #00a855)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', boxShadow: '0 0 40px rgba(0,204,106,0.4)',
          }}>
            <CheckCircle2 color="#fff" size={44} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '6px' }}>
            Booking <span style={{ background: 'linear-gradient(135deg, #00cc6a, #00a855)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Confirmed!</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {booking.slotId ? 'Your digital ticket is ready. Show it at entry.' : 'Your floor reservation is secured.'}
          </p>
        </motion.div>

        {/* ─── TICKET CARD ─── */}
        <motion.div
          ref={ticketRef}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            borderRadius: 'var(--radius-card)', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--glass-border)',
            marginBottom: '24px',
          }}
        >
          {/* Ticket header */}
          <div style={{
            background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a28 100%)',
            padding: '28px 28px 24px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', border: '2px solid rgba(255,206,0,0.15)' }} />
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', borderRadius: '50%', border: '2px solid rgba(255,206,0,0.1)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <img src={challanIcon} alt="Icon" style={{ width: '14px', height: '14px' }} />
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '2px', color: '#FFCE00', textTransform: 'uppercase' }}>
                    Drivix Ticket
                  </span>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>
                  {booking.slotId ? `Slot ${booking.slotId}` : `${booking.floor} Reserved`}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem' }}>{booking.floor} · {booking.locationName}</p>
              </div>
              <div style={{
                padding: '6px 14px', borderRadius: 'var(--radius-pill)',
                background: booking.slotId ? 'rgba(0,204,106,0.2)' : 'rgba(255,206,0,0.15)', 
                border: booking.slotId ? '1px solid rgba(0,204,106,0.4)' : '1px solid rgba(255,206,0,0.3)',
                fontSize: '0.75rem', fontWeight: 800, color: booking.slotId ? '#00cc6a' : '#FFCE00', letterSpacing: '1px',
              }}>
                {booking.slotId ? 'SLOT ASSIGNED' : 'CONFIRMED'}
              </div>
            </div>
          </div>

          {/* Perforated divider */}
          <div style={{ position: 'relative', height: '1px', background: 'var(--glass-border)' }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute', width: '8px', height: '8px', borderRadius: '50%',
                background: 'var(--bg-primary)', top: '-4px',
                left: `${(i / 23) * 95 + 2}%`, transform: 'translateX(-50%)',
              }} />
            ))}
          </div>

          {/* Ticket body */}
          <div style={{ padding: '28px' }}>
            {!booking.slotId ? (
              /* Slot will be assigned screen layout */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', margin: '10px 0 20px' }}>
                <div className="glass-panel" style={{ width: '100%', padding: '20px', borderRadius: 'var(--radius-input)', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <p style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--accent-primary)', marginBottom: '6px' }}>
                    Slot will be assigned before arrival
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '16px' }}>
                    Estimated Walk Time: Will be shown later. Start navigation or confirm check-in below to allocate your slot immediately.
                  </p>

                  {submitting ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px' }}>
                      <Loader2 className="animate-spin" size={18} color="var(--accent-primary)" />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Allocating Best Slot...</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button 
                        onClick={handleStartNavigation}
                        className="btn btn-primary"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', fontSize: '0.9rem', fontWeight: 800 }}
                      >
                        <Navigation size={15} /> Start Navigation & Assign Slot
                      </button>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                        <button 
                          onClick={() => handleArrivalCheck('yes')}
                          style={{ padding: '11px', background: 'rgba(0,204,106,0.12)', color: '#00cc6a', border: '1px solid rgba(0,204,106,0.25)', borderRadius: 'var(--radius-button)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                        >
                          Confirm Arrival
                        </button>
                        <button 
                          onClick={() => handleArrivalCheck('delay')}
                          style={{ padding: '11px', background: 'rgba(255,206,0,0.12)', color: '#FFCE00', border: '1px solid rgba(255,206,0,0.25)', borderRadius: 'var(--radius-button)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                        >
                          Delay 30 mins
                        </button>
                      </div>

                      <button 
                        onClick={() => handleArrivalCheck('cancel')}
                        style={{ padding: '8px', background: 'transparent', color: '#ff4b4b', border: 'none', textDecoration: 'underline', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, marginTop: '8px' }}
                      >
                        Cancel Reservation
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Assigned QR Pass layout */
              <>
                <div style={{
                  display: 'flex', justifyContent: 'center', marginBottom: '24px',
                }}>
                  <div style={{
                    padding: '16px', borderRadius: '16px', background: '#fff',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}>
                    <QRCodeSVG
                      value={qrPayload}
                      size={160}
                      bgColor="#ffffff"
                      fgColor="#0a0a14"
                      level="M"
                    />
                  </div>
                </div>

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '24px', letterSpacing: '1px', fontWeight: 600 }}>
                  SCAN AT ENTRY · BOOKING ID: {booking.bookingId}
                </p>
              </>
            )}

            {/* Details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { icon: Car, label: 'Vehicle', value: booking.vehicleNumber, sub: booking.vehicleName },
                { icon: MapPin, label: 'Location', value: booking.locationName, sub: booking.floor },
                { icon: Calendar, label: 'Date', value: new Date(booking.entryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                { icon: Clock, label: 'Time', value: (booking.endTime || booking.entryTime) ? `${formatTime12h(booking.startTime || booking.entryTime)}${booking.endTime ? ` – ${formatTime12h(booking.endTime)}` : ''}` : 'N/A', sub: `${booking.duration}h duration` },
                { icon: Shield, label: 'Parking Slot', value: booking.slotId ? booking.slotId : 'Will be assigned before arrival', sub: !booking.slotId ? 'Your exact slot will be assigned before arrival' : undefined },
                ...(booking.slotId ? [
                  { 
                    icon: Navigation, 
                    label: 'Walking Distance', 
                    value: booking.walkingDistance ? `${booking.walkingDistance} meters` : `${Math.max(5, parseInt(booking.slotId.replace(/\D/g, ''), 10) * 5 || 15)} meters`, 
                    sub: 'To nearest elevator' 
                  },
                  ...((booking.additionalServices?.includes('EV Charging') || booking.EVSupported) ? [
                    { icon: Shield, label: 'EV Charger', value: 'EV Charging Enabled', sub: 'Reserved charging point' }
                  ] : [])
                ] : [])
              ].map(({ label, value, sub }) => (
                <div key={label} style={{
                  padding: '14px 16px', borderRadius: 'var(--radius-input)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {label}
                    </span>
                  </div>
                  <p style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{value}</p>
                  {sub && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{sub}</p>}
                </div>
              ))}
            </div>

            {/* Selected Services on Ticket */}
            {booking.additionalServices && booking.additionalServices.length > 0 && (
              <div style={{
                marginTop: '16px', padding: '14px 16px', borderRadius: 'var(--radius-input)',
                background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                textAlign: 'left'
              }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                  ADDITIONAL SERVICES
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {booking.additionalServices.map(srv => {
                    let icon = '⚙️';
                    if (srv === 'Rest Area') icon = '🛋️';
                    if (srv === 'EV Charging') icon = '⚡';
                    if (srv === 'Car Wash') icon = '🧼';
                    if (srv === 'Food & Beverages') icon = '🍔';
                    return (
                      <span key={srv} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '4px 10px', borderRadius: '20px', background: 'rgba(255, 206, 0, 0.12)',
                        border: '1px solid rgba(255, 206, 0, 0.25)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)'
                      }}>
                        {icon} {srv}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Total */}
            <div style={{
              marginTop: '20px', padding: '16px 20px', borderRadius: 'var(--radius-card)',
              background: 'linear-gradient(135deg, rgba(255,206,0,0.12), rgba(255,173,0,0.08))',
              border: '1px solid rgba(255,206,0,0.25)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>TOTAL AMOUNT</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {booking.duration}h duration {booking.additionalServices && booking.additionalServices.length > 0 ? '+ services' : ''}
                </p>
              </div>
              <p style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-primary)' }}>₹{booking.totalCost}</p>
            </div>

            {/* Security note */}
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <Shield size={14} color="var(--text-secondary)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                ANPR + Face capture at entry for security
              </span>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          {booking.slotId && (
            <button
              onClick={handleOpenMaps}
              className="btn btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: '1rem', fontWeight: 800 }}
            >
              <Navigation size={20} /> Navigate to Slot
            </button>
          )}

          <button
            onClick={handleShareAsImage}
            className="btn btn-primary"
            style={{ 
              width: '100%',
              padding: '16px', fontSize: '1rem', fontWeight: 800,
              background: '#FFCE00', color: '#000', border: 'none',
              boxShadow: '0 4px 20px rgba(255, 206, 0, 0.2)'
            }}
          >
            <Download size={18} /> Download Image
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleShare}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '14px' }}
            >
              <Share2 size={18} /> Share Ticket
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '14px' }}
            >
              <Home size={18} /> Home
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Ticket;
