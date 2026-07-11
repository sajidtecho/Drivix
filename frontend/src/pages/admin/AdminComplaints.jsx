import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2, MessageSquare, User, Clock, Phone, Mail, MapPin, Image as ImageIcon } from 'lucide-react';
import challanIcon from '../../assets/challan.png';

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchComplaints = async () => {
    const token = localStorage.getItem('drivix_auth_token');
    try {
      const res = await fetch('http://localhost:5000/api/v1/complaints/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      }
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleResolve = async (id) => {
    setUpdatingId(id);
    const token = localStorage.getItem('drivix_auth_token');
    try {
      const res = await fetch(`http://localhost:5000/api/v1/complaints/${id}/resolve`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        // Update local state to reflect change without refetching immediately
        setComplaints(prev => prev.map(c => (c._id === id || c.id === id) ? { ...c, complaintStatus: 'resolved' } : c));
      }
    } catch (error) {
      console.error("Error resolving complaint:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', minHeight: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '8px', color: '#f44336', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src={challanIcon} alt="challan" style={{ width: '32px', height: '32px' }} />
        Customer Complaints
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Review, respond to, and resolve active customer issues.</p>
      
      {loading ? (
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
             <Loader2 size={40} color="#f44336" className="animate-spin" style={{ marginBottom: '16px' }} />
             <p style={{ color: 'var(--text-secondary)' }}>Loading complaints...</p>
         </div>
      ) : complaints.length === 0 ? (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '3rem', textAlign: 'center', border: '1px dashed var(--glass-border)' }}>
          <CheckCircle size={40} color="#4CAF50" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>All Clear!</h3>
          <p style={{ color: 'var(--text-secondary)' }}>No active complaints at the moment.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {complaints.map((c) => {
            const compId = c._id || c.id;
            const userName = c.userId?.name || c.userId?.fullName || 'Anonymous User';
            const userUid = c.userId?._id || c.userId || 'N/A';
            const isResolved = c.complaintStatus === 'resolved';

            return (
              <div key={compId} style={{ 
                background: 'var(--bg-secondary)', 
                borderRadius: '12px', 
                padding: '20px', 
                border: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  {/* User Info */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ 
                       width: '40px', height: '40px', borderRadius: '50%', 
                       background: 'rgba(255,255,255,0.05)', display: 'flex', 
                       alignItems: 'center', justifyContent: 'center' 
                    }}>
                      <User size={20} color="var(--text-secondary)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{userName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        UID: {userUid} • <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{c.title || 'General Issue'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <span style={{ 
                    padding: '6px 14px', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    textTransform: 'uppercase',
                    background: isResolved ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                    color: isResolved ? '#4CAF50' : '#f44336',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {isResolved ? <CheckCircle size={14} /> : <img src={challanIcon} alt="challan" style={{ width: '14px', height: '14px' }} />}
                    {c.complaintStatus || 'pending'}
                  </span>
                </div>

                {/* Message & Details */}
                <div style={{ 
                  background: 'rgba(0,0,0,0.2)', 
                  padding: '16px', 
                  borderRadius: '8px',
                  borderLeft: `3px solid ${isResolved ? '#4CAF50' : '#f44336'}`
                }}>
                  {/* Contact Info Row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {c.contact && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <Phone size={14} color="var(--accent-primary)" />
                        {c.contact}
                      </div>
                    )}
                    {c.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <Mail size={14} color="var(--accent-primary)" />
                        {c.email}
                      </div>
                    )}
                    {c.slotLocation && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={14} color="var(--accent-primary)" />
                        {c.slotLocation}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <MessageSquare size={16} color="var(--text-secondary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <p style={{ color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                      {c.description}
                    </p>
                  </div>
                  
                  {c.image && (
                    <div style={{ margin: '12px 0 12px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <ImageIcon size={14} /> Attached Photo
                      </div>
                      <img 
                        src={c.image} 
                        alt="Complaint attachment" 
                        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--glass-border)' }} 
                      />
                    </div>
                  )}

                  {c.createdAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '24px', marginTop: '12px' }}>
                      <Clock size={10} />
                      {new Date(c.createdAt).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!isResolved && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button 
                      onClick={() => handleResolve(compId)}
                      disabled={updatingId === compId}
                      style={{ 
                        padding: '8px 20px', 
                        borderRadius: '8px', 
                        background: '#4CAF50', 
                        color: '#fff',
                        border: 'none',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: updatingId === compId ? 0.7 : 1,
                        transition: 'opacity 0.2s'
                      }}
                    >
                      {updatingId === compId ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                      Mark as Resolved
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminComplaints;
