import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, ArrowRight, Search, X, Check, CreditCard, AlertTriangle, DollarSign } from 'lucide-react';
import FadeIn from '../common/FadeIn';
import heroImage from '../../assets/HeroSection.png';
import { useUser } from '../../hooks/useUser';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';



const HeroSection = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = React.useState('parking'); // 'parking' | 'challan' | 'fastag'
  const [vehicleNumber, setVehicleNumber] = React.useState('');
  const [stats, setStats] = React.useState({ users: 0, facilities: 0 });

  // Mock search states
  const [searchResult, setSearchResult] = React.useState(null);
  const [rechargeAmount, setRechargeAmount] = React.useState('');
  const [isProcessingAction, setIsProcessingAction] = React.useState(false);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/public-stats`);
        if (res.ok) {
          const data = await res.json();
          setStats({
            users: data.users || 0,
            facilities: data.facilities || 0
          });
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, []);

  const TABS = [
    { id: 'parking', label: 'Parking', placeholder: 'Enter City, Mall or Building' },
    { id: 'challan', label: 'Challan', placeholder: 'Enter Vehicle Number (e.g. UP32AB1234)' },
    { id: 'fastag', label: 'FASTag', placeholder: 'Enter Vehicle Number (e.g. UP32AB1234)' }
  ];

  const handleSearch = () => {
    const query = vehicleNumber.trim();
    if (!query) return;

    if (activeTab === 'parking') {
      navigate('/find');
    } else if (activeTab === 'challan') {
      if (!/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/i.test(query.replace(/\s/g, ''))) {
        showToast("Please enter a valid vehicle number (e.g. UP32AB1234)", "error");
        return;
      }

      setSearchResult({
        type: 'challan',
        vehicle: query.toUpperCase().replace(/\s/g, ''),
        owner: 'Rakesh Sharma',
        challans: [
          { id: 'CH-9827', offense: 'Over-speeding on Noida Expressway', amount: 1000, status: 'unpaid', date: '2026-07-12' },
          { id: 'CH-6184', offense: 'Parking in No-Parking Zone near Sector 18', amount: 500, status: 'paid', date: '2026-06-25' }
        ]
      });
    } else if (activeTab === 'fastag') {
      if (!/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/i.test(query.replace(/\s/g, ''))) {
        showToast("Please enter a valid vehicle number (e.g. UP32AB1234)", "error");
        return;
      }

      setSearchResult({
        type: 'fastag',
        vehicle: query.toUpperCase().replace(/\s/g, ''),
        provider: 'HDFC Bank FASTag',
        balance: 450,
        status: 'Active',
        transactions: [
          { id: 'TXN-1029', location: 'Jewar Toll Plaza (Yamuna Expressway)', amount: 150, date: 'Today, 14:22' },
          { id: 'TXN-0938', location: 'DND Flyway (Noida-Delhi)', amount: 30, date: 'Yesterday, 09:15' }
        ]
      });
    }
  };

  const handlePayChallan = async (challanId) => {
    setIsProcessingAction(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSearchResult(prev => {
      if (!prev) return null;
      return {
        ...prev,
        challans: prev.challans.map(c => c.id === challanId ? { ...c, status: 'paid' } : c)
      };
    });
    
    setIsProcessingAction(false);
    showToast(`Challan ${challanId} has been successfully paid!`, "success");
  };

  const handleRechargeFASTag = async () => {
    const amount = Number(rechargeAmount);
    if (!amount || amount <= 0) {
      showToast("Please enter a valid recharge amount", "error");
      return;
    }
    
    setIsProcessingAction(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    setSearchResult(prev => {
      if (!prev) return null;
      const newTxn = {
        id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
        location: 'FASTag Wallet Recharge',
        amount: -amount,
        date: 'Just Now'
      };
      return {
        ...prev,
        balance: prev.balance + amount,
        transactions: [newTxn, ...prev.transactions]
      };
    });

    setRechargeAmount('');
    setIsProcessingAction(false);
    showToast(`Successfully recharged ₹${amount} to FASTag wallet!`, "success");
  };

  return (
    <section id="hero" style={{
      display: 'flex',
      alignItems: 'center',
      paddingTop: 'clamp(120px, 15vh, 180px)',
      paddingBottom: '60px',
      position: 'relative',
      overflow: 'hidden',
      background: 'radial-gradient(circle at 15% 50%, rgba(250, 255, 0, 0.03) 0%, transparent 50%)'
    }}>
      <div className="container" style={{ width: '100%', maxWidth: '1440px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '40px',
          alignItems: 'center',
          textAlign: 'left'
        }} className="hero-grid-updated">
          <style>{`
            .hero-search-container {
              margin-left: 0;
              margin-right: auto;
              transition: all 0.3s ease;
            }
            .hero-grid-updated {
              transition: all 0.3s ease;
            }
            .hero-image-container {
              transition: all 0.3s ease;
            }
            
            /* Mobile Viewports (< 768px) */
            @media (max-width: 767.98px) {
              #hero {
                padding-top: 100px !important;
                padding-bottom: 24px !important;
              }
              .hero-grid-updated {
                grid-template-columns: 1fr !important;
                text-align: center !important;
                gap: 16px !important;
              }
              .hero-image-container {
                display: none !important;
              }
              .hero-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 100%;
              }
              .hero-content p {
                margin-left: auto;
                margin-right: auto;
                margin-bottom: 24px !important;
              }
              .hero-search-container {
                margin-left: auto !important;
                margin-right: auto !important;
                margin-bottom: 24px !important;
              }
              .hero-stat-container {
                justify-content: center !important;
                gap: 24px !important;
              }
            }

            /* Tablet Viewports (>= 768px) */
            @media (min-width: 768px) {
              .hero-grid-updated {
                grid-template-columns: 1.1fr 0.9fr !important;
                gap: 40px !important;
              }
              .hero-image-container {
                display: flex !important;
              }
            }

            /* Desktop Viewports (>= 1024px) */
            @media (min-width: 1024px) {
              .hero-grid-updated {
                grid-template-columns: 1.1fr 0.9fr !important;
                gap: 80px !important;
              }
            }

            .hero-tab-active {
              color: var(--accent-primary) !important;
              background: rgba(250, 255, 0, 0.1) !important;
            }
          `}</style>

          <FadeIn className="hero-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 10px var(--accent-primary)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent-primary)' }}>
                India's First Integrated Car Dashboard
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.2rem, 8vw, 4rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '20px',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.04em',
            }}>
              Don't just <span style={{ color: 'var(--accent-primary)' }}>drive</span>.<br/>Own your journey.
            </h1>

            <p style={{
              fontSize: 'clamp(1rem, 4vw, 1.15rem)',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginBottom: '40px',
              maxWidth: '520px',
              fontWeight: 500
            }}>
              Join 1M+ drivers saving time with real-time parking, automatic FASTag, and instant challan alerts.
            </p>

            {/* Functional Search Center */}
            <div className="glass-panel hero-search-container" style={{ 
              padding: '8px', 
              borderRadius: '24px', 
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)',
              width: '100%',
              maxWidth: '540px',
              marginBottom: '48px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1,
                      padding: '12px 10px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '16px',
                      color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {tab.label}
                    {activeTab === tab.id && <motion.div layoutId="tab-underline" style={{ width: '12px', height: '3px', background: 'var(--accent-primary)', borderRadius: '2px' }} />}
                  </button>
                ))}
              </div>
              
              {/* SearchBar */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '8px 8px 8px 20px', 
                background: 'var(--bg-primary)', 
                borderRadius: '18px',
                border: '1px solid var(--glass-border-light)'
              }}>
                <Search size={18} color="var(--text-muted)" />
                <input 
                  type="text" 
                  placeholder={TABS.find(t => t.id === activeTab).placeholder}
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    minWidth: 0
                  }}
                />
                <button 
                  onClick={handleSearch}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', borderRadius: '14px', fontSize: '0.85rem' }}
                >
                  Go
                </button>
              </div>
            </div>

            {/* Credibility Stat */}
            <div style={{ display: 'flex', gap: '40px' }} className="hero-stat-container">
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {stats.users > 0 ? `${stats.users}` : '0'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>Happy Users</div>
              </div>
              <div style={{ width: '1px', background: 'var(--glass-border)', height: '32px', alignSelf: 'center' }} />
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {stats.facilities > 0 ? `${stats.facilities}` : '0'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>Facilities</div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2} className="hero-image-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <div style={{ 
              position: 'relative', 
              width: '100%', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              transform: 'scale(1.15)', // Make it bigger
            }}>
              <div style={{ position: 'absolute', right: '-10%', top: '0', width: '120%', height: '120%', background: 'radial-gradient(circle at center, var(--accent-primary) 0%, transparent 60%)', opacity: 0.1, filter: 'blur(100px)', zIndex: 0 }} />
              
              <img 
                src={heroImage} 
                alt="Smart Parking Facility" 
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  objectFit: 'contain', 
                  position: 'relative', 
                  zIndex: 1,
                  display: 'block'
                }} 
              />
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Search Result Modal Dialog */}
      <AnimatePresence>
        {searchResult && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="glass-panel"
              style={{
                width: '100%',
                maxWidth: '500px',
                background: 'var(--bg-tertiary)',
                border: '1.5px solid var(--glass-border)',
                borderRadius: 'var(--radius-card)',
                padding: '30px',
                position: 'relative',
                boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
                textAlign: 'left'
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setSearchResult(null)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 2
                }}
              >
                <X size={16} />
              </button>

              {/* MODAL HEADER */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: searchResult.type === 'challan' ? 'rgba(255, 75, 75, 0.15)' : 'rgba(250, 255, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: searchResult.type === 'challan' ? '#ff4b4b' : 'var(--accent-primary)',
                }}>
                  {searchResult.type === 'challan' ? <AlertTriangle size={24} /> : <CreditCard size={24} />}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>
                    {searchResult.type === 'challan' ? 'E-Challan Status' : 'FASTag Details'}
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    VEHICLE: {searchResult.vehicle}
                  </p>
                </div>
              </div>

              {/* CHALLAN VIEW */}
              {searchResult.type === 'challan' && (
                <div>
                  <p style={{ fontSize: '0.9rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                    Registered Owner: <strong style={{ color: 'var(--text-primary)' }}>{searchResult.owner}</strong>
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    {searchResult.challans.map(ch => (
                      <div 
                        key={ch.id} 
                        style={{
                          padding: '14px 16px',
                          borderRadius: 'var(--radius-button)',
                          background: 'var(--bg-primary)',
                          border: '1.5px solid var(--glass-border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>{ch.id} · {ch.date}</span>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{ch.offense}</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '1rem', fontWeight: 900, color: ch.status === 'unpaid' ? '#ff4b4b' : '#00cc6a' }}>
                            ₹{ch.amount}
                          </div>
                          {ch.status === 'unpaid' ? (
                            <button
                              disabled={isProcessingAction}
                              onClick={() => handlePayChallan(ch.id)}
                              className="btn btn-primary"
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.75rem',
                                marginTop: '6px',
                                background: '#ff4b4b',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                border: 'none'
                              }}
                            >
                              {isProcessingAction ? 'Paying...' : 'Pay Now'}
                            </button>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.7rem',
                              color: '#00cc6a',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              marginTop: '6px'
                            }}>
                              <Check size={12} /> Paid
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Outstanding Balance</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: searchResult.challans.some(c => c.status === 'unpaid') ? '#ff4b4b' : '#00cc6a' }}>
                      ₹{searchResult.challans.reduce((sum, c) => c.status === 'unpaid' ? sum + c.amount : sum, 0)}
                    </span>
                  </div>
                </div>
              )}

              {/* FASTAG VIEW */}
              {searchResult.type === 'fastag' && (
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--bg-primary)',
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-button)',
                    border: '1.5px solid var(--glass-border)',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Active Balance</span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-primary)', marginTop: '2px' }}>
                        ₹{searchResult.balance.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>STATUS</span>
                      <div style={{
                        marginTop: '4px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: 'rgba(0, 204, 106, 0.12)',
                        color: '#00cc6a',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase'
                      }}>
                        {searchResult.status}
                      </div>
                    </div>
                  </div>

                  {/* Quick Recharge */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                      Quick Recharge Wallet
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-button)',
                        padding: '10px 14px'
                      }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>₹</span>
                        <input
                          type="number"
                          placeholder="Enter Amount"
                          value={rechargeAmount}
                          onChange={(e) => setRechargeAmount(e.target.value)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            width: '100%'
                          }}
                        />
                      </div>
                      <button
                        disabled={isProcessingAction}
                        onClick={handleRechargeFASTag}
                        className="btn btn-primary"
                        style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                      >
                        {isProcessingAction ? 'Processing...' : 'Recharge'}
                      </button>
                    </div>
                  </div>

                  {/* Recent Toll Transactions */}
                  <div>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '10px' }}>
                      Recent Crossings
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {searchResult.transactions.map(txn => (
                        <div 
                          key={txn.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 12px',
                            background: 'rgba(255,255,255,0.01)',
                            borderBottom: '1.5px solid var(--glass-border-light)',
                            fontSize: '0.8rem'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{txn.location}</div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{txn.date} · {txn.id}</span>
                          </div>
                          <span style={{ 
                            fontWeight: 900, 
                            color: txn.amount > 0 ? '#00cc6a' : '#ff4b4b' 
                          }}>
                            {txn.amount > 0 ? `+₹${txn.amount}` : `-₹${Math.abs(txn.amount)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default HeroSection;
