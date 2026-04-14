import React from 'react';

const AdminComplaints = () => {
  return (
    <div className="glass-panel" style={{ padding: '2rem', height: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: '#f44336' }}>Customer Complaints</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Review, respond to, and resolve active customer issues.</p>
      
      {/* Cards Placeholder */}
      <div style={{ marginTop: '2rem', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '2rem', textAlign: 'center', border: '1px dashed var(--glass-border)' }}>
        <p style={{ color: 'var(--text-muted)' }}>No active complaints at the moment.</p>
      </div>
    </div>
  );
};

export default AdminComplaints;
