import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Loader2, Users, Mail, Phone, Shield, User } from 'lucide-react';

const AdminUsers = () => {
  const [usersInfo, setUsersInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const data = [];
      querySnapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUsersInfo(data);
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
    try {
      const userRef = doc(db, 'users', id);
      await updateDoc(userRef, { plan: newPlan });
      setUsersInfo(prev => prev.map(u => u.id === id ? { ...u, plan: newPlan } : u));
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
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>User Profile</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Contact Info</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Vehicle Details</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Subscription Plan</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersInfo.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}>
                  
                  {/* Name and Role */}
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                         width: '40px', height: '40px', borderRadius: '50%', 
                         background: u.role === 'admin' ? 'rgba(255, 206, 0, 0.1)' : 'rgba(255,255,255,0.05)', 
                         color: u.role === 'admin' ? '#FFCE00' : 'var(--text-secondary)',
                         display: 'flex', alignItems: 'center', justifyContent: 'center' 
                      }}>
                        {u.role === 'admin' ? <Shield size={20} /> : <User size={20} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {u.name || 'Incomplete Profile'}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: u.role === 'admin' ? '#FFCE00' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Role: {u.role || 'user'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contact Info */}
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <Mail size={14} color="var(--accent-primary)" /> {u.email || 'N/A'}
                    </div>
                    {u.mobile && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <Phone size={14} color="var(--accent-primary)" /> {u.mobile}
                      </div>
                    )}
                  </td>

                  {/* Vehicle Details */}
                  <td style={{ padding: '16px' }}>
                    {u.vehicles && u.vehicles.length > 0 ? (
                      <div>
                        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--glass-border)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px', marginBottom: '4px' }}>
                          {u.vehicles[0].number}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {u.vehicles[0].type || 'Vehicle'} • {u.vehicles[0].name || 'Unknown'}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No vehicle registered</span>
                    )}
                  </td>

                  {/* Plan Badge */}
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      padding: '6px 14px', 
                      borderRadius: '20px', 
                      fontSize: '0.75rem', 
                      fontWeight: 800, 
                      textTransform: 'uppercase',
                      background: u.plan === 'premium' ? 'rgba(0, 210, 255, 0.1)' : 'rgba(255,255,255,0.1)',
                      color: u.plan === 'premium' ? '#00D2FF' : 'var(--text-secondary)'
                    }}>
                      {u.plan || 'free'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    {u.role !== 'admin' && (
                      <button 
                        disabled={updatingId === u.id}
                        onClick={() => handlePlanUpdate(u.id, u.plan || 'free')}
                        style={{ 
                          padding: '8px 16px', 
                          borderRadius: '8px', 
                          background: u.plan === 'premium' ? 'transparent' : 'var(--accent-primary)',
                          border: u.plan === 'premium' ? '1px solid var(--glass-border)' : 'none',
                          color: u.plan === 'premium' ? 'var(--text-secondary)' : '#000',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          opacity: updatingId === u.id ? 0.7 : 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {updatingId === u.id ? <Loader2 size={14} className="animate-spin" /> : null}
                        {u.plan === 'premium' ? 'Downgrade to Free' : 'Upgrade to Premium'}
                      </button>
                    )}
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
