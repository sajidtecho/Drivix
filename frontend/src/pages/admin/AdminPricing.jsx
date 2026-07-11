import React, { useState, useEffect } from 'react';
import { DollarSign, Save, RefreshCw, MapPin } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const AdminPricing = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const fetchLocations = async () => {
    const token = localStorage.getItem('drivix_auth_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/parking`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map(loc => ({
          id: loc._id || loc.id,
          name: loc.parkingName || loc.name,
          pricePerHr: loc.hourlyPrice || loc.pricePerHr || 0,
          ...loc
        }));
        setLocations(mapped);
      }
    } catch (err) {
      console.error("Error fetching pricing locations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handlePriceChange = (id, newPrice) => {
    setLocations(prev => prev.map(loc => 
      loc.id === id ? { ...loc, pricePerHr: Number(newPrice) } : loc
    ));
  };

  const savePrice = async (loc) => {
    setSavingId(loc.id);
    const token = localStorage.getItem('drivix_auth_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/parking/${loc.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hourlyPrice: loc.pricePerHr })
      });
      if (!res.ok) {
        alert("Failed to update price");
      }
    } catch (err) {
      console.error("Error updating price:", err);
      alert("Failed to update price");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', minHeight: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <DollarSign size={28} color="var(--accent-primary)" /> Pricing Configuration
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Set hourly rates for each parking facility across the network.</p>
      </header>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <RefreshCw className="animate-spin" size={32} color="var(--accent-primary)" />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', maxWidth: '800px' }}>
          {locations.map(loc => (
            <div 
              key={loc.id} 
              className="glass-panel" 
              style={{ 
                padding: '1.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  padding: '10px', 
                  borderRadius: '12px', 
                  background: 'rgba(255, 206, 0, 0.1)', 
                  color: 'var(--accent-primary)' 
                }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{loc.name}</h3>
                  <p style={{ margin: 2, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{loc.address}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                 <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>₹</span>
                    <input 
                      type="number" 
                      value={loc.pricePerHr || 0} 
                      onChange={(e) => handlePriceChange(loc.id, e.target.value)}
                      style={{ 
                        padding: '10px 10px 10px 25px', 
                        width: '100px',
                        borderRadius: '8px', 
                        background: 'var(--bg-tertiary)', 
                        border: '1px solid var(--glass-border)', 
                        color: '#fff', 
                        outline: 'none',
                        fontSize: '1rem',
                        fontWeight: 'bold'
                      }} 
                    />
                 </div>
                 <button 
                  className="btn btn-primary" 
                  disabled={savingId === loc.id}
                  onClick={() => savePrice(loc)}
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}
                 >
                   {savingId === loc.id ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                   Update
                 </button>
              </div>
            </div>
          ))}

          {locations.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              No parking facilities found. Create one in Parking Management.
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '8px', background: 'rgba(33, 150, 243, 0.1)', border: '1px solid rgba(33, 150, 243, 0.2)' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64B5F6' }}>
          <strong>Note:</strong> Changes to pricing will only affect new bookings. Existing bookings will maintain their original rate.
        </p>
      </div>
    </div>
  );
};

export default AdminPricing;
