import React, { useState, useEffect } from 'react';
import { Loader2, Users, Mail, Phone, Shield, User } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const AdminUsers = () => {
  const [usersInfo, setUsersInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    const token = localStorage.getItem('drivix_auth_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map(u => ({
          id: u._id || u.id,
          plan: (u.membershipType || 'Free').toLowerCase(),
          ...u
        }));
        setUsersInfo(mapped);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handlePlanUpdate = async (id, currentPlan) => {
    const newPlan = currentPlan === 'premium' ? 'free' : 'premium';
    setUpdatingId(id);
    const token = localStorage.getItem('drivix_auth_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/users/${id}/plan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan: newPlan })
      });
      if (res.ok) {
        setUsersInfo(prev => prev.map(u => u.id === id ? { ...u, plan: newPlan } : u));
      } else {
        alert('Failed to update user plan');
      }
    } catch (error) {
      console.error("Error updating user plan:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', minHeight: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>User Administration</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage platform users, verify vehicles, and upgrade access plans.</p>
      </header>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
            <Loader2 size={40} color="var(--accent-primary)" className="animate-spin" style={{ marginBottom: '16px' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading user directory...</p>
        </div>
      ) : usersInfo.length === 0 ? (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '3rem', textAlign: 'center', border: '1px dashed var(--glass-border)' }}>
          <Users size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>No registered users found in the database.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>User</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Contact Info</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>City</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Current Plan</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersInfo.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '50%', 
                        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)'
                      }}>
                        {u.profileImage ? (
                          <img src={u.profileImage} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <User size={18} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.fullName || u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>Role: {u.role || 'User'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      <Mail size={14} color="var(--text-secondary)" /> {u.email}
                    </div>
                    {u.mobile && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        <Phone size={12} /> {u.mobile}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {u.city || 'N/A'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '0.75rem', 
                      fontWeight: 800, 
                      textTransform: 'uppercase',
                      background: u.plan === 'premium' ? 'rgba(255, 206, 0, 0.15)' : 'rgba(255,255,255,0.08)',
                      color: u.plan === 'premium' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      border: `1px solid ${u.plan === 'premium' ? 'var(--accent-primary)' : 'var(--glass-border)'}`
                    }}>
                      {u.plan}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button
                      className={`btn ${u.plan === 'premium' ? 'btn-secondary' : 'btn-primary'}`}
                      disabled={updatingId === u.id}
                      onClick={() => handlePlanUpdate(u.id, u.plan)}
                      style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {updatingId === u.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Shield size={14} />
                      )}
                      {u.plan === 'premium' ? 'Downgrade Access' : 'Upgrade Premium'}
                    </button>
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

export default AdminUsers;
