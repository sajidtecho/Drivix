import React from 'react';

const AdminBookings = () => {
  return (
    <div className="glass-panel" style={{ padding: '2rem', height: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Manage Bookings</h1>
      <p style={{ color: 'var(--text-secondary)' }}>View and manage all active and past parking reservations.</p>
      
      {/* Table Placeholder */}
      <div style={{ marginTop: '2rem', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '2rem', textAlign: 'center', border: '1px dashed var(--glass-border)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Booking data will appear here.</p>
      </div>
    </div>
  );
};

export default AdminBookings;
