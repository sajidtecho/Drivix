import React from 'react';

const AdminParking = () => {
  return (
    <div className="glass-panel" style={{ padding: '2rem', height: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Parking Management</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Configure locations, layout maps, slots, and adjust pricing.</p>
      
      {/* Settings Placeholder */}
      <div style={{ marginTop: '2rem', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '2rem', textAlign: 'center', border: '1px dashed var(--glass-border)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Location settings and layout editor will appear here.</p>
      </div>
    </div>
  );
};

export default AdminParking;
