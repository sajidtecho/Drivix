import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import * as htmlToImage from 'html-to-image';
import challanIcon from '../assets/challan.png';
import {
  CheckCircle2, MapPin, Navigation, Car, Clock,
  Calendar, Download, Home, Share2, Shield
} from 'lucide-react';

const Ticket = () => {
  const navigate = useNavigate();
  const locState = useLocation().state;
  const booking = locState?.booking;
  const ticketRef = useRef(null);

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
  });

  const handleOpenMaps = () => {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(booking.locationName)}`, '_blank');
  };

  const handleShare = async () => {
    const text = `🎟️ Drivix Parking Ticket\nBooking ID: ${booking.bookingId}\nSlot: ${booking.slotId} (${booking.floor})\nDate: ${booking.entryDate} at ${booking.entryTime}\nVehicle: ${booking.vehicleNumber}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'My Parking Ticket', text }); } catch (err) { console.error('Share failed', err); }
    } else {
      navigator.clipboard?.writeText(text);
      alert('Ticket details copied to clipboard!');
    }
  };

  const handleWhatsAppShare = () => {
    const text = `*Drivix Parking Ticket* 🚗\n\n*Booking ID:* ${booking.bookingId}\n*Slot:* ${booking.slotId} (${booking.floor})\n*Vehicle:* ${booking.vehicleNumber} (${booking.vehicleName})\n*Entry:* ${booking.entryTime} on ${booking.entryDate}\n\n✅ Your reservation at ${booking.locationName} is confirmed.\n_Please show this at the entry gate._`;
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/${booking.mobile.startsWith('91') ? booking.mobile : '91' + booking.mobile}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareAsImage = async () => {
    if (ticketRef.current === null) return;
    
    try {
      // 1. Capture the Ticket UI as a PNG
      const dataUrl = await htmlToImage.toPng(ticketRef.current, { 
        quality: 1.0,
        pixelRatio: 2, // Retinal quality
        backgroundColor: '#0a0a14',
        cacheBust: true,
      });

      // 2. Conver the Data URL to a real File object for WhatsApp
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const filename = `Drivix-Ticket-${booking.bookingId}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      // 3. Try Web Share API (Mobile WhatsApp/Social)
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Drivix Parking Ticket',
          text: `Here is my parking ticket for Slot ${booking.slotId} at ${booking.locationName}.`
        });
      } else {
        // Fallback: Just download the image if sharing isn't supported
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
            Your digital ticket is ready. Show it at entry.
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
            {/* Decorative rings */}
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
                  Slot {booking.slotId}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem' }}>{booking.floor} · {booking.locationName}</p>
              </div>
              <div style={{
                padding: '6px 14px', borderRadius: 'var(--radius-pill)',
                background: 'rgba(0,204,106,0.2)', border: '1px solid rgba(0,204,106,0.4)',
                fontSize: '0.75rem', fontWeight: 800, color: '#00cc6a', letterSpacing: '1px',
              }}>
                CONFIRMED
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
            {/* QR Code */}
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

            {/* Details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { icon: Car, label: 'Vehicle', value: booking.vehicleNumber, sub: booking.vehicleName },
                { icon: MapPin, label: 'Location', value: booking.locationName, sub: booking.floor },
                { icon: Calendar, label: 'Date', value: new Date(booking.entryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                { icon: Clock, label: 'Entry', value: booking.entryTime, sub: `${booking.duration}h duration` },
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

            {/* Total */}
            <div style={{
              marginTop: '20px', padding: '16px 20px', borderRadius: 'var(--radius-card)',
              background: 'linear-gradient(135deg, rgba(255,206,0,0.12), rgba(255,173,0,0.08))',
              border: '1px solid rgba(255,206,0,0.25)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>TOTAL AMOUNT</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{booking.duration}h × ₹{Math.round(booking.totalCost / booking.duration)}/hr</p>
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
          <button
            onClick={handleOpenMaps}
            className="btn btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: '1rem', fontWeight: 800 }}
          >
            <Navigation size={20} /> Navigate to Parking
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
             <button
              onClick={handleShareAsImage}
              className="btn btn-primary"
              style={{ 
                padding: '16px', fontSize: '0.9rem', fontWeight: 800,
                background: '#FFCE00', color: '#000', border: 'none',
                boxShadow: '0 4px 20px rgba(255, 206, 0, 0.2)'
              }}
            >
              <Download size={18} /> Download Image
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="btn btn-primary"
              style={{ 
                padding: '16px', fontSize: '0.9rem', fontWeight: 800,
                background: '#25D366', color: '#fff', border: 'none',
                boxShadow: '0 4px 20px rgba(37, 211, 102, 0.2)'
              }}
            >
              <Share2 size={18} /> Share Info
            </button>
          </div>

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
