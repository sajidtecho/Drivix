import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  Users,
  MapPin,
  Calendar,
  AlertCircle,
  DollarSign,
  LogOut
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const [realStats, setRealStats] = useState({
    bookingsCount: '...',
    usersCount: '...',
    openComplaints: '...',
    revenue: '...'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const bookingsSnap = await getDocs(collection(db, 'bookings'));
        const usersSnap = await getDocs(collection(db, 'users'));

        const qComplaints = query(collection(db, 'complaints'), where('status', '==', 'pending'));
        const complaintsSnap = await getDocs(qComplaints);

        let totalRev = 0;
        bookingsSnap.forEach(doc => {
          const data = doc.data();
          if (data.status === 'completed' || data.status === 'booked') {
            totalRev += (Number(data.totalCost) || 0);
          }
        });

        // Format revenue (e.g., 12400 -> 12.4k)
        let formattedRev = totalRev.toString();
        if (totalRev >= 1000) {
          formattedRev = (totalRev / 1000).toFixed(1) + 'k';
        }

        setRealStats({
          bookingsCount: bookingsSnap.size.toLocaleString(),
          usersCount: usersSnap.size.toLocaleString(),
          openComplaints: complaintsSnap.size.toLocaleString(),
          revenue: formattedRev
        });
      } catch (err) {
        console.error("Error fetching dashboard stats", err);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { label: 'Total Bookings', value: realStats.bookingsCount, icon: <Calendar />, color: '#FFCE00', path: '/admin/bookings' },
    { label: 'Active Users', value: realStats.usersCount, icon: <Users />, color: '#4CAF50', path: '/admin/users' },
    { label: 'Open Complaints', value: realStats.openComplaints, icon: <AlertCircle />, color: '#f44336', path: '/admin/complaints' },
    { label: 'Total Revenue', value: `₹${realStats.revenue}`, icon: <DollarSign />, color: '#2196F3', path: '/admin/revenue' },
  ];

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        padding: '1.5rem',
        borderRadius: 'var(--radius-card)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--glass-border)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Admin Control Center</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{user?.name || 'Admin'}</span></p>
        </div>
        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{ padding: '10px 20px', fontSize: '0.9rem' }}
        >
          <LogOut size={18} style={{ marginRight: '8px' }} /> Logout
        </button>
      </header>

      <div className="grid grid-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '3rem' }}>
        {stats.map((stat, i) => (
          <div 
            key={i} 
            className="glass-panel" 
            style={{ 
              padding: '1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1.5rem',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onClick={() => stat.path && navigate(stat.path)}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              padding: '1rem',
              borderRadius: '16px',
              background: `${stat.color}15`,
              color: stat.color,
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{stat.label}</p>
              <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ gap: '2rem' }}>
        <section className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <MapPin style={{ color: 'var(--accent-primary)' }} /> Quick Management
          </h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <button 
              className="btn btn-secondary" 
              style={{ justifyContent: 'flex-start', width: '100%', padding: '1.2rem' }}
              onClick={() => navigate('/admin/bookings')}
            >
              <Calendar size={18} style={{ marginRight: '10px' }} /> Manage All Bookings
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ justifyContent: 'flex-start', width: '100%', padding: '1.2rem' }}
              onClick={() => navigate('/admin/users')}
            >
              <Users size={18} style={{ marginRight: '10px' }} /> User Administration
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ justifyContent: 'flex-start', width: '100%', padding: '1.2rem' }}
              onClick={() => navigate('/admin/parking')}
            >
              <MapPin size={18} style={{ marginRight: '10px' }} /> Parking Locations & Slots
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ justifyContent: 'flex-start', width: '100%', padding: '1.2rem' }}
              onClick={() => navigate('/admin/pricing')}
            >
              <DollarSign size={18} style={{ marginRight: '10px' }} /> Pricing Configuration
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ justifyContent: 'flex-start', width: '100%', padding: '1.2rem' }}
              onClick={() => navigate('/admin/complaints')}
            >
              <AlertCircle size={18} style={{ marginRight: '10px' }} /> Customer Complaints
            </button>
          </div>
        </section>

        <section className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Recent System Alerts</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                padding: '1rem',
                borderRadius: '12px',
                background: 'var(--bg-secondary)',
                fontSize: '0.9rem',
                borderLeft: '4px solid var(--accent-primary)'
              }}>
                <p style={{ fontWeight: 'bold', marginBottom: '0.2rem' }}>Slot Sensor Offline - Area B</p>
                <p style={{ color: 'var(--text-secondary)' }}>Reported 2 hours ago • Action required</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
