import React, { useState, useEffect } from 'react';
import { Calendar, Car, MapPin, Clock, Phone, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtering & Sorting State
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchBookings = async () => {
      const token = localStorage.getItem('drivix_auth_token');
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/bookings/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map(b => ({
            id: b._id || b.id,
            ...b
          }));
          setBookings(mapped);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Derived Values
  const uniqueLocations = [...new Set(bookings.map(b => b.locationName).filter(Boolean))];

  const filteredBookings = bookings.filter(b => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (filterLocation !== 'all' && b.locationName !== filterLocation) return false;
    return true;
  }).sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (sortBy === 'newest') return timeB - timeA;
    return timeA - timeB;
  });

  return (
    <div className="glass-panel" style={{ padding: '2rem', minHeight: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Manage Bookings</h1>
          <p style={{ color: 'var(--text-secondary)' }}>View and manage all active and past parking reservations across all locations.</p>
        </div>
        
        {/* Filters and Sorting UI */}
        {!loading && bookings.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select 
              value={filterLocation} 
              onChange={(e) => setFilterLocation(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none' }}
            >
              <option value="all">All Locations</option>
              {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>

            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none' }}
            >
              <option value="all">All Statuses</option>
              <option value="booked">Booked</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none' }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        )}
      </div>
      
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
            <Loader2 size={40} color="var(--accent-primary)" className="animate-spin" style={{ marginBottom: '16px' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading live bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '3rem', textAlign: 'center', border: '1px dashed var(--glass-border)' }}>
          <Calendar size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>No bookings found in the database.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Booking ID</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Customer</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Vehicle</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Location & Slot</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Time & Cost</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Payment</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No bookings match your current filters.
                  </td>
                </tr>
              ) : 
                filteredBookings.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px', fontSize: '0.9rem', fontWeight: 600 }}>
                      {b.bookingId}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{b.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Phone size={12} /> {b.mobile}
                      </div>
                      {b.userId && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'monospace' }}>
                          UID: {b.userId.substring(0, 8)}...
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--glass-border)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px', marginBottom: '4px' }}>
                        {b.vehicleNumber}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Car size={12} /> {b.vehicleName}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{b.locationName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> Slot {b.slotId} ({b.floor})
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <Clock size={12} /> {b.entryDate} at {b.entryTime}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 800 }}>
                        ₹{b.totalCost} <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 500 }}>({b.duration}h)</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                        {b.paymentMode === 'PAY_NOW' ? 'Pay Now' : 'Pay After Exit'}
                      </div>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        textTransform: 'uppercase',
                        background: b.paymentStatus === 'paid' ? 'rgba(0, 204, 106, 0.15)' : 'rgba(255, 206, 0, 0.15)',
                        color: b.paymentStatus === 'paid' ? '#00cc6a' : '#FFB300'
                      }}>
                        {b.paymentStatus || 'pending'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        fontWeight: 800, 
                        textTransform: 'uppercase',
                        background: b.status === 'booked' ? 'rgba(0, 210, 255, 0.1)' : 'rgba(255,255,255,0.1)',
                        color: b.status === 'booked' ? '#00D2FF' : 'var(--text-secondary)'
                      }}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
