import React, { useState, useEffect } from 'react';
import { DollarSign, Save, RefreshCw, MapPin, Zap, TrendingUp, Sparkles, Activity, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const AdminPricing = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [savedSuccessId, setSavedSuccessId] = useState(null);

  const fetchLocations = async () => {
    setLoading(true);
    const token = localStorage.getItem('drivix_auth_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/parking`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();

        // Fetch live dynamic pricing for each location concurrently
        const mapped = await Promise.all(data.map(async (loc) => {
          let dynamicPricing = null;
          try {
            const pRes = await fetch(`${API_BASE_URL}/api/v1/parking/${loc._id || loc.id}/pricing`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (pRes.ok) {
              dynamicPricing = await pRes.json();
            }
          } catch (e) {
            // graceful fallback
          }

          return {
            id: loc._id || loc.id,
            name: loc.parkingName || loc.name,
            pricePerHr: loc.hourlyPrice || loc.pricePerHr || 0,
            dynamicPricing,
            ...loc
          };
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
      } else {
        setSavedSuccessId(loc.id);
        setTimeout(() => setSavedSuccessId(null), 2500);
        // Refresh pricing to recalculate AI multipliers
        fetchLocations();
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
      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <DollarSign size={28} color="var(--accent-primary)" /> Pricing Configuration & AI Dynamic Surge
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage base rates and monitor live AI demand-driven pricing across all Drivix hubs.
          </p>
        </div>
        <button 
          onClick={fetchLocations}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Live Rates
        </button>
      </header>

      {/* AI System Intelligence Overview Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(30, 41, 59, 0.6)', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '4px' }}>
            <Activity size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.5px' }}>ML ENGINE STATUS</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            Drivix AI Engine Active
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Dynamic Pricing · Operational
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(30, 41, 59, 0.6)', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', marginBottom: '4px' }}>
            <Zap size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.5px' }}>DYNAMIC PRICING POLICY</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            0.85x – 1.50x
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            15% Off-Peak to +50% Surge
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(30, 41, 59, 0.6)', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', marginBottom: '4px' }}>
            <MapPin size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.5px' }}>MONITORED HUBS</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            {locations.length} Facilities
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Real-time occupancy tracking
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <RefreshCw className="animate-spin" size={32} color="var(--accent-primary)" />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.2rem', maxWidth: '1000px' }}>
          {locations.map(loc => {
            const dp = loc.dynamicPricing;
            const isSurge = dp?.isSurgeActive || (dp?.multiplier > 1.0);
            const isDiscount = dp?.multiplier < 1.0;
            const recPrice = dp?.recommendedPrice || loc.pricePerHr;

            return (
              <div 
                key={loc.id} 
                className="glass-panel" 
                style={{ 
                  padding: '1.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1.2rem',
                  background: isSurge 
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, var(--bg-secondary) 100%)' 
                    : isDiscount 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, var(--bg-secondary) 100%)' 
                    : 'var(--bg-secondary)',
                  border: isSurge 
                    ? '1px solid rgba(239, 68, 68, 0.3)' 
                    : isDiscount 
                    ? '1px solid rgba(16, 185, 129, 0.3)' 
                    : '1px solid var(--glass-border)'
                }}
              >
                {/* Location Meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '240px' }}>
                  <div style={{ 
                    padding: '12px', 
                    borderRadius: '12px', 
                    background: isSurge 
                      ? 'rgba(239, 68, 68, 0.15)' 
                      : isDiscount 
                      ? 'rgba(16, 185, 129, 0.15)' 
                      : 'rgba(255, 206, 0, 0.1)', 
                    color: isSurge ? '#ef4444' : isDiscount ? '#10b981' : 'var(--accent-primary)' 
                  }}>
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{loc.name}</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{loc.address}</p>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Total Slots: {loc.totalSlots || 100} · Free: {loc.availableSlots ?? (loc.totalSlots || 100)}
                    </span>
                  </div>
                </div>

                {/* AI Demand & Recommended Rate Pill */}
                {dp && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border-light)'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: isSurge ? '#ef4444' : isDiscount ? '#10b981' : 'var(--accent-primary)',
                          color: isSurge || isDiscount ? '#ffffff' : '#000000'
                        }}>
                          {isSurge ? '🔥 SURGE' : isDiscount ? '🎉 OFF-PEAK' : '⚡ NORMAL'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Demand: {dp.demandScore || 50}%
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        Predicted Occ: <strong style={{ color: 'var(--text-primary)' }}>{dp.predictedOccupancy || 50}%</strong>
                      </div>
                    </div>

                    <div style={{ borderLeft: '1px solid var(--glass-border)', paddingLeft: '12px', textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                        AI REC. RATE
                      </span>
                      <span style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 900, 
                        color: isSurge ? '#f87171' : isDiscount ? '#10b981' : 'var(--accent-primary)' 
                      }}>
                        ₹{recPrice}/hr
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                        ({dp.multiplier}x multiplier)
                      </span>
                    </div>
                  </div>
                )}

                {/* Base Price Editor */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                      BASE RATE
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>₹</span>
                      <input 
                        type="number" 
                        value={loc.pricePerHr || 0} 
                        onChange={(e) => handlePriceChange(loc.id, e.target.value)}
                        style={{ 
                          padding: '8px 8px 8px 24px', 
                          width: '90px',
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
                  </div>

                  <button 
                    className="btn btn-primary" 
                    disabled={savingId === loc.id}
                    onClick={() => savePrice(loc)}
                    style={{ 
                      padding: '10px 14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginTop: '16px',
                      background: savedSuccessId === loc.id ? '#10b981' : undefined
                    }}
                  >
                    {savingId === loc.id ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : savedSuccessId === loc.id ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Save size={16} />
                    )}
                    {savedSuccessId === loc.id ? 'Saved' : 'Update'}
                  </button>
                </div>
              </div>
            );
          })}

          {locations.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              No parking facilities found. Create one in Parking Management.
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem 1.25rem', borderRadius: '8px', background: 'rgba(33, 150, 243, 0.08)', border: '1px solid rgba(33, 150, 243, 0.2)' }}>
        <p style={{ margin: 0, fontSize: '0.88rem', color: '#64B5F6', lineHeight: 1.5 }}>
          <strong>💡 AI Dynamic Pricing Tip:</strong> The base rate is the foundation for each hub. The machine learning model adjusts user checkout prices in real-time between <strong>0.85x</strong> (15% off-peak discount) and <strong>1.50x</strong> (surge pricing during peak hours and packed events).
        </p>
      </div>
    </div>
  );
};

export default AdminPricing;
