import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const inputStyle = {
  width: '100%',
  padding: '14px',
  borderRadius: '12px',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--glass-border)',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  fontSize: '0.95rem',
  outline: 'none',
  marginBottom: '16px',
  boxSizing: 'border-box'
};

const SupportModal = ({ onClose }) => {
  const { user, isAuthenticated } = useUser();
  const [issueType, setIssueType] = useState('Payment Issue');
  const [message, setMessage] = useState('');
  const [slotLocation, setSlotLocation] = useState('');
  const [contact, setContact] = useState(user?.mobile || '');
  const [email, setEmail] = useState(user?.email || '');
  const [photoData, setPhotoData] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please enter a description to submit.');
      return;
    }

    if (!isAuthenticated) {
      setError('You must be logged in to submit a complaint.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await addDoc(collection(db, 'complaints'), {
        userId: user.uid || 'unknown',
        userName: user.name || user.email || 'Anonymous user',
        email: email.trim(),
        contact: contact.trim(),
        slotLocation: slotLocation.trim(),
        issueType: issueType,
        message: message.trim(),
        photo: photoData,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      setError('Failed to submit. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="glass-panel"
          style={{
            width: '100%', maxWidth: '550px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '30px',
            borderRadius: 'var(--radius-card)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            position: 'relative'
          }}
        >
          <button 
            onClick={onClose}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>

          {isSuccess ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <CheckCircle2 size={64} color="#4CAF50" style={{ margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Submitted!</h2>
              <p style={{ color: 'var(--text-secondary)' }}>We've received your complaint and our team will resolve it soon.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255, 75, 75, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={20} color="#ff4b4b" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Submit Complaint</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>How can we help you today?</p>
                </div>
              </div>

              {!isAuthenticated && (
                <div style={{ padding: '12px', background: 'rgba(255, 204, 0, 0.1)', border: '1px solid #FFC107', borderRadius: '8px', color: '#FFC107', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 600 }}>
                  You must be logged in to submit a complaint. Please log in first.
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Issue Category</label>
                <select 
                  value={issueType}
                  onChange={e => setIssueType(e.target.value)}
                  disabled={!isAuthenticated || isSubmitting}
                  style={inputStyle}
                >
                  <option value="Payment Issue">Payment Issue</option>
                  <option value="Booking Issue">Booking Issue</option>
                  <option value="Location/Slot Issue">Location/Slot Issue</option>
                  <option value="App Bug">App Bug</option>
                  <option value="Other">Other</option>
                </select>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '0' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Contact Number</label>
                    <input type="tel" value={contact} onChange={e => setContact(e.target.value)} disabled={!isAuthenticated || isSubmitting} style={inputStyle} placeholder="Your phone number" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={!isAuthenticated || isSubmitting} style={inputStyle} placeholder="Your email" />
                  </div>
                </div>

                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Parking Slot & Location (Optional)</label>
                <input type="text" value={slotLocation} onChange={e => setSlotLocation(e.target.value)} disabled={!isAuthenticated || isSubmitting} style={inputStyle} placeholder="e.g. Sector 18, Slot A-12" />

                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Description</label>
                <textarea 
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  disabled={!isAuthenticated || isSubmitting}
                  style={{
                    ...inputStyle,
                    minHeight: '120px',
                    resize: 'vertical',
                    marginBottom: '8px'
                  }}
                />
                
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', marginTop: '8px', textTransform: 'uppercase' }}>Upload Photo (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  disabled={!isAuthenticated || isSubmitting}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setPhotoData(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{...inputStyle, padding: '10px'}}
                />

                {error && <p style={{ color: '#ff4b4b', fontSize: '0.85rem', marginTop: '16px', marginBottom: '0', fontWeight: 600 }}>{error}</p>}

                <button 
                  type="submit" 
                  disabled={!isAuthenticated || isSubmitting}
                  className="btn btn-primary"
                  style={{ 
                    width: '100%', 
                    padding: '14px', 
                    fontSize: '1rem', 
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: (!isAuthenticated || isSubmitting) ? 'var(--glass-bg)' : '#ff4b4b',
                    color: (!isAuthenticated || isSubmitting) ? 'var(--text-muted)' : '#fff',
                    border: 'none',
                    marginTop: error ? '16px' : '0px'
                  }}
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  Submit Complaint
                </button>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SupportModal;
