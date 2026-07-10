import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { DollarSign, TrendingUp, Calendar, CreditCard, RefreshCw } from 'lucide-react';

const AdminRevenue = () => {
  const [revenueData, setRevenueData] = useState({
    total: 0,
    list: [],
    loading: true
  });

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const q = query(collection(db, 'bookings'), orderBy('date', 'desc'));
        const snap = await getDocs(q);
        
        let total = 0;
        const list = [];
        
        snap.forEach(doc => {
          const data = doc.data();
          if (data.status === 'completed' || data.status === 'booked') {
            const amount = Number(data.totalCost) || 0;
            total += amount;
            list.push({ id: doc.id, ...data });
          }
        });
        
        setRevenueData({
          total,
          list,
          loading: false
        });
      } catch (err) {
        console.error("Error fetching revenue:", err);
        setRevenueData(prev => ({ ...prev, loading: false }));
      }
    };
    fetchRevenue();
  }, []);

  return (
    <div className="glass-panel" style={{ padding: '2rem', minHeight: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <DollarSign size={28} color="#4CAF50" /> Revenue & Financial Oversight
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track total earnings, transaction history, and financial performance.</p>
      </header>

      <div className="grid grid-2" style={{ marginBottom: '2rem', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(33, 150, 243, 0.1) 100%)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Lifetime Revenue</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
             <h2 style={{ fontSize: '2.5rem', margin: 0 }}>₹{revenueData.total.toLocaleString()}</h2>
             <span style={{ color: '#4CAF50', display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}><TrendingUp size={16} /> +12%</span>
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Average Ticket Size</p>
          <h2 style={{ fontSize: '2.5rem', margin: 0 }}>
            ₹{revenueData.list.length > 0 ? (revenueData.total / revenueData.list.length).toFixed(0) : 0}
          </h2>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={18} /> Recent Transactions
        </h3>
        
        {revenueData.loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <RefreshCw className="animate-spin" />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Date</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>User</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Location</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Amt</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.list.slice(0, 10).map(tx => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px', fontSize: '0.9rem' }}>{tx.date}</td>
                    <td style={{ padding: '12px', fontSize: '0.9rem' }}>{tx.userName || 'Guest'}</td>
                    <td style={{ padding: '12px', fontSize: '0.9rem' }}>{tx.locationName}</td>
                    <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>₹{tx.totalCost}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        background: tx.status === 'completed' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 206, 0, 0.2)',
                        color: tx.status === 'completed' ? '#81C784' : '#FFD54F'
                      }}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {revenueData.list.length === 0 && (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No transactions found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRevenue;
