import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../hooks/useUser';
import { 
  User, Car, CreditCard, FileText, Settings, Shield, 
  ChevronRight, Edit2, Plus, Bell, Lock, 
  Trash2, ExternalLink, QrCode, Wallet, Loader2, X,
  Calendar, MapPin, Navigation, Clock
} from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

const Profile = () => {
  const { user, isAuthenticated, updateUser, logout } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bookings'); // Default to bookings to see recent activity
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ plate: '', model: '', type: 'Petrol' });
  const [isSaving, setIsSaving] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Protect route
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user) {
      setEditData({ ...user });
      
      // Fetch bookings
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      setLoadingBookings(true);
      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBookings(data);
        setLoadingBookings(false);
      }, (err) => {
        console.error("Booking fetch error:", err);
        setLoadingBookings(false);
      });

      return unsub;
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleUpdate = async () => {
    setIsSaving(true);
    await updateUser(editData);
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!newVehicle.plate || !newVehicle.model) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        vehicles: arrayUnion({ ...newVehicle, id: Date.now().toString(), status: 'Verified' })
      });
      setShowAddVehicle(false);
      setNewVehicle({ plate: '', model: '', type: 'Petrol' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveVehicle = async (vehicle) => {
    if (!window.confirm('Remove this vehicle?')) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      vehicles: arrayRemove(vehicle)
    });
  };

  const handleAddMoney = async () => {
    const amount = window.prompt('Enter amount to add to wallet:', '500');
    if (!amount || isNaN(amount)) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        walletBalance: (user.walletBalance || 0) + parseFloat(amount)
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadDoc = async () => {
    const title = window.prompt('Enter document name (e.g. DL, Insurance):');
    if (!title) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        documents: arrayUnion({
          title,
          status: 'Pending Verification',
          expiry: '2027-01-01',
          color: '#ffcc00',
          id: Date.now().toString()
        })
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const menuItems = [
    { id: 'bookings', label: 'My Bookings', icon: Calendar },
    { id: 'profile', label: 'User Details', icon: User },
    { id: 'vehicles', label: 'Vehicle Details', icon: Car },
    { id: 'payments', label: 'Payment Info', icon: CreditCard },
    { id: 'documents', label: 'Identity & Docs', icon: FileText },
    { id: 'settings', label: 'Preferences', icon: Settings },
    { id: 'security', label: 'Security & Verification', icon: Shield },
  ];

  return (
    <div style={{ minHeight: '100vh', paddingTop: '100px', paddingBottom: '60px', background: 'var(--bg-primary)' }}>
      <div className="container" style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        
        {/* Sidebar */}
        <div className="glass-panel" style={{ width: '280px', padding: '24px', position: 'sticky', top: '100px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 800, fontSize: '1.4rem' }}>
              {user.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{user.name || 'User'}</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Premium Member</p>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderRadius: '12px', border: 'none',
                  background: activeTab === item.id ? 'var(--accent-primary)' : 'transparent',
                  color: activeTab === item.id ? '#000' : 'var(--text-primary)',
                  fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.3s'
                }}
              >
                <item.icon size={20} />
                <span style={{ flex: 1 }}>{item.label}</span>
                <ChevronRight size={16} />
              </button>
            ))}
            
            <button 
              onClick={logout}
              style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderRadius: '12px', border: 'none', background: 'transparent', color: '#ff4b4b', fontWeight: 600, cursor: 'pointer', marginTop: '24px' }}>
              <Trash2 size={20} /> Logout
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '40px' }}>
            
            {activeTab === 'bookings' && (
              <section>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '32px' }}>My Bookings</h2>
                {loadingBookings ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 className="spin" size={32} color="var(--accent-primary)" />
                    <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>Fetching your tickets...</p>
                  </div>
                ) : bookings.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {bookings.map((booking) => (
                      <div key={booking.id} className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent-primary)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                               <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>#{booking.bookingId}</span>
                               <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '50px', background: 'rgba(0, 204, 106, 0.1)', color: '#00cc6a', border: '1px solid rgba(0, 204, 106, 0.2)', fontWeight: 700 }}>SUCCESS</span>
                            </div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 12px 0' }}>Slot {booking.slotId} • {booking.floor}</h3>
                            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                  <MapPin size={14} color="var(--accent-primary)" />
                                  {booking.locationName}
                               </div>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                  <Calendar size={14} color="var(--accent-primary)" />
                                  {booking.entryDate} at {booking.entryTime}
                               </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                             <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>₹{booking.totalCost}</div>
                             <button 
                               onClick={() => navigate('/ticket', { state: { booking } })}
                               className="btn btn-secondary" 
                               style={{ padding: '10px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                             >
                                <QrCode size={16} /> View Ticket
                             </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '24px', border: '1px dashed var(--glass-border)' }}>
                     <Calendar size={48} color="var(--text-secondary)" style={{ opacity: 0.3, marginBottom: '20px' }} />
                     <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>No Bookings Yet</h3>
                     <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Once you book a parking slot, it will appear here.</p>
                     <button onClick={() => navigate('/parking')} className="btn btn-primary" style={{ padding: '12px 28px' }}>Book a Slot Now</button>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'profile' && (
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Personal Information</h2>
                  {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                      <Edit2 size={16} /> Edit Profile
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setIsEditing(false)} className="nav-link" style={{ fontSize: '0.9rem' }}>Cancel</button>
                      <button onClick={handleUpdate} disabled={isSaving} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  <div className="info-group">
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Full Name</label>
                    {isEditing ? (
                      <input type="text" value={editData.name || ''} onChange={(e) => setEditData({...editData, name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                    ) : (
                      <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{user.name}</p>
                    )}
                  </div>
                  <div className="info-group">
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Email Address</label>
                    <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{user.email}</p>
                  </div>
                  <div className="info-group">
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Mobile Number</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{user.mobile}</p>
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '100px', background: 'rgba(0, 255, 136, 0.1)', color: '#00cc6a', border: '1px solid rgba(0, 255, 136, 0.2)' }}>Verified</span>
                    </div>
                  </div>
                  <div className="info-group">
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>City / Location</label>
                    {isEditing ? (
                      <input type="text" value={editData.city || ''} onChange={(e) => setEditData({...editData, city: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                    ) : (
                      <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{user.city}</p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'vehicles' && (
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>My Vehicles</h2>
                  <button onClick={() => setShowAddVehicle(true)} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
                    <Plus size={18} /> Add Vehicle
                  </button>
                </div>

                {showAddVehicle && (
                  <div style={{ marginBottom: '32px', padding: '24px', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--accent-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0 }}>Register New Vehicle</h4>
                      <X size={20} cursor="pointer" onClick={() => setShowAddVehicle(false)} />
                    </div>
                    <form onSubmit={handleAddVehicle} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>License Plate</label>
                        <input type="text" placeholder="MH 01 AB 1234" value={newVehicle.plate} onChange={(e) => setNewVehicle({...newVehicle, plate: e.target.value})} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Model</label>
                        <input type="text" placeholder="Tesla Model 3" value={newVehicle.model} onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Fuel Type</label>
                        <select value={newVehicle.type} onChange={(e) => setNewVehicle({...newVehicle, type: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                          <option>Petrol</option>
                          <option>Diesel</option>
                          <option>Electric</option>
                          <option>CNG</option>
                        </select>
                      </div>
                      <button type="submit" disabled={isSaving} className="btn btn-primary" style={{ padding: '10px 24px' }}>
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Save'}
                      </button>
                    </form>
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {user.vehicles?.length > 0 ? user.vehicles.map((vehicle, idx) => (
                    <div key={vehicle.id || idx} className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '24px', border: idx === 0 ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)', background: idx === 0 ? 'rgba(255, 206, 0, 0.05)' : 'rgba(255,255,255,0.02)' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Car size={32} color={idx === 0 ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                          <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{vehicle.plate}</h4>
                          {idx === 0 && <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '100px', background: 'var(--accent-primary)', color: '#000', fontWeight: 600 }}>PRIMARY</span>}
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{vehicle.model} • {vehicle.type}</p>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <span style={{ display: 'block', fontSize: '0.85rem', color: '#00cc6a', fontWeight: 600 }}>ANPR Verified</span>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Edit2 size={16} /></button>
                          <button onClick={() => handleRemoveVehicle(vehicle)} style={{ background: 'none', border: 'none', color: '#ff4b4b', cursor: 'pointer' }}><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                      <Car size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                      <p>No vehicles registered. Add one to get started with ANPR parking.</p>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '32px', padding: '24px', borderRadius: '16px', background: 'rgba(255, 206, 0, 0.03)', border: '1px dashed var(--accent-primary)' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <Shield size={24} color="var(--accent-primary)" />
                    <div>
                      <h5 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 700 }}>ANPR Protection Active</h5>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Your vehicles are automatically recognized at Drivix-enabled gates. No need for physical tickets or manual entry.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'payments' && (
              <section>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '32px' }}>Payments & Wallet</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
                  <div className="glass-panel" style={{ padding: '32px', background: 'linear-gradient(135deg, #1a1a24, #0a0a0f)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'var(--accent-primary)', opacity: 0.1, filter: 'blur(40px)', borderRadius: '50%' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                      <Wallet size={24} color="var(--accent-primary)" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Drivix Wallet</span>
                    </div>
                    <h3 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '0 0 8px 0' }}>₹{user.walletBalance || '0.00'}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>Current Balance</p>
                    <button onClick={handleAddMoney} disabled={isSaving} className="btn btn-primary" style={{ width: '100%' }}>
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Add Money'}
                    </button>
                  </div>

                  <div className="glass-panel" style={{ padding: '32px' }}>
                    <h4 style={{ margin: '0 0 20px 0', fontWeight: 700 }}>Saved Methods</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {user.paymentMethods?.map((pm, idx) => (
                        <div key={pm.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--glass-border-light)' }}>
                          {pm.type === 'card' ? <CreditCard size={18} color="var(--text-secondary)" /> : <QrCode size={18} color="var(--text-secondary)" />}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{pm.label}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{pm.provider}</div>
                          </div>
                          <button 
                            onClick={async () => {
                              if (!window.confirm('Delete this payment method?')) return;
                              const userRef = doc(db, 'users', user.uid);
                              await updateDoc(userRef, { paymentMethods: arrayRemove(pm) });
                            }}
                            style={{ background: 'none', border: 'none', color: '#ff4b4b', cursor: 'pointer', opacity: 0.6 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      {!user.paymentMethods?.length && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No payment methods saved.</p>}
                    </div>
                    <button 
                      onClick={async () => {
                        const type = window.confirm('Press OK for Card, Cancel for UPI') ? 'card' : 'upi';
                        const label = window.prompt(type === 'card' ? 'Enter last 4 digits (e.g. •••• 4242):' : 'Enter UPI ID (e.g. user@upi):');
                        if (!label) return;
                        const provider = window.prompt('Enter provider (e.g. Visa, HDFC Bank, Primary UPI):');
                        if (!provider) return;
                        
                        setIsSaving(true);
                        try {
                          const userRef = doc(db, 'users', user.uid);
                          await updateDoc(userRef, {
                            paymentMethods: arrayUnion({ type, label, provider, id: Date.now().toString() })
                          });
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                      className="nav-link" style={{ padding: '0', marginTop: '24px', fontSize: '0.9rem', color: 'var(--accent-primary)', fontWeight: 600 }}
                    >
                      + Add Payment Method
                    </button>
                  </div>
                </div>

                <h4 style={{ margin: '0 0 16px 0', fontWeight: 700 }}>Recent Activity</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
                     <p style={{ color: 'var(--text-secondary)' }}>No recent transactions found.</p>
                   </div>
                </div>
              </section>
            )}

            {activeTab === 'documents' && (
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Identity & Documents</h2>
                  <button onClick={handleUploadDoc} disabled={isSaving} className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Upload Doc</>}
                  </button>
                </div>
                <div style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', display: 'grid', gap: '24px' }}>
                  {user.documents?.length > 0 ? user.documents.map((doc, idx) => (
                    <div key={idx} className="glass-panel" style={{ padding: '24px', transition: 'transform 0.3s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={20} color="var(--text-secondary)" />
                        </div>
                        <ExternalLink size={16} color="var(--text-secondary)" />
                      </div>
                      <h4 style={{ margin: '0 0 8px 0', fontWeight: 700 }}>{doc.title}</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '100px', background: `${doc.color || '#00cc6a'}15`, color: doc.color || '#00cc6a', border: `1px solid ${doc.color || '#00cc6a'}25` }}>{doc.status}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Exp: {doc.expiry}</span>
                      </div>
                    </div>
                  )) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                       <p>Your digital vault is empty. Securely store your RC, DL and Insurance here.</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'settings' && (
              <section>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '32px' }}>Preferences</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <div className="setting-row">
                    <h4 style={{ margin: '0 0 16px 0', fontWeight: 700 }}>Preferred Parking Type</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Space Type Selection */}
                      <div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600 }}>SPACE TYPE</p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          {['Open Space', 'Covered Parking'].map(type => {
                            const isActive = user.preferences?.parkingType === type;
                            return (
                              <button 
                                key={type} 
                                onClick={() => updateUser({ preferences: { ...user.preferences, parkingType: type } })}
                                className="glass-panel" 
                                style={{ 
                                  flex: 1, padding: '14px', borderRadius: '12px',
                                  border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)', 
                                  background: isActive ? 'rgba(255,206,0,0.06)' : 'rgba(255,255,255,0.02)', 
                                  cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s',
                                  color: isActive ? 'var(--accent-secondary)' : 'var(--text-secondary)'
                                }}
                              >
                                {type}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* EV Charging Selection */}
                      <div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600 }}>EV CHARGING SUPPORT</p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          {[
                            { label: 'Required', value: true },
                            { label: 'Not Required', value: false }
                          ].map(opt => {
                            const isActive = !!user.preferences?.evCharging === opt.value;
                            return (
                              <button 
                                key={opt.label} 
                                onClick={() => updateUser({ preferences: { ...user.preferences, evCharging: opt.value } })}
                                className="glass-panel" 
                                style={{ 
                                  flex: 1, padding: '14px', borderRadius: '12px',
                                  border: isActive ? '1px solid #00cc6a' : '1px solid var(--glass-border)', 
                                  background: isActive ? 'rgba(0, 204, 106, 0.05)' : 'rgba(255,255,255,0.02)', 
                                  cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s',
                                  color: isActive ? '#00cc6a' : 'var(--text-secondary)'
                                }}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="setting-row">
                    <h4 style={{ margin: '0 0 16px 0', fontWeight: 700 }}>Notifications</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                       {[
                         { id: 'push', label: 'Push Notifications', icon: Bell },
                         { id: 'email', label: 'Email Alerts', icon: User },
                         { id: 'whatsapp', label: 'WhatsApp Updates', icon: User },
                       ].map(item => {
                         const isEnabled = user.notifications?.[item.id] ?? true;
                         return (
                           <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                 <item.icon size={20} color="var(--text-secondary)" />
                                 <span style={{ fontWeight: 500 }}>{item.label}</span>
                              </div>
                              <div 
                                onClick={() => updateUser({ notifications: { ...user.notifications, [item.id]: !isEnabled } })}
                                style={{ 
                                  width: '44px', height: '24px', 
                                  background: isEnabled ? 'var(--accent-primary)' : 'var(--glass-border-light)', 
                                  borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' 
                                }}
                              >
                                 <motion.div 
                                   animate={{ left: isEnabled ? '24px' : '3px' }}
                                   transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                   style={{ width: '18px', height: '18px', background: isEnabled ? '#000' : '#fff', borderRadius: '50%', position: 'absolute', top: '3px' }} 
                                 />
                              </div>
                           </div>
                         );
                       })}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'security' && (
              <section>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '32px' }}>Security & Verification</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                   <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontWeight: 700 }}>Two-Factor Authentication</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Add an extra layer of security to your account.</p>
                      </div>
                      <button className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>Enable</button>
                   </div>

                   <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontWeight: 700 }}>Change Password</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Last changed 3 months ago.</p>
                      </div>
                      <button className="btn btn-secondary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>Update</button>
                   </div>
                </div>
              </section>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
