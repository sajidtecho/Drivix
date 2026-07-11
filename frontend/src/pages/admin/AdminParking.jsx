import React, { useState, useEffect } from 'react';
import { MapPin, Layers, Plus, Car, X, Trash, ShieldAlert } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import { API_BASE_URL } from '../../config';

const AdminParking = () => {
  const { user, loading: userLoading } = useUser();
  const [locations, setLocations] = useState([]);
  const [selectedLocId, setSelectedLocId] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Schema Form States
  const [parkingName, setParkingName] = useState('');
  const [parkingCode, setParkingCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateField, setStateField] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [openingTime, setOpeningTime] = useState('08:00');
  const [closingTime, setClosingTime] = useState('22:00');
  const [totalFloors, setTotalFloors] = useState(1);
  const [hourlyPrice, setHourlyPrice] = useState(30);

  // Slot Management Form States
  const [newFloorName, setNewFloorName] = useState('');
  const [newSlotPrefix, setNewSlotPrefix] = useState('A');
  const [newSlotCount, setNewSlotCount] = useState(10);
  const [selectedFloor, setSelectedFloor] = useState('');

  // Fetch Locations
  const fetchLocations = async () => {
    const token = localStorage.getItem('drivix_auth_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/parking`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchLocations();
    }
  }, [user]);

  // Fetch Slots when location selected
  const fetchSlots = async () => {
    if (!selectedLocId) {
      setSlots([]);
      return;
    }
    const token = localStorage.getItem('drivix_auth_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/parking/${selectedLocId}/slots`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchSlots();
    }
  }, [selectedLocId, user]);

  // Role Guard View
  if (userLoading) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading console...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <ShieldAlert size={48} color="#ff4b4b" />
        <h1 style={{ color: '#ff4b4b', fontSize: '1.8rem', fontWeight: 800 }}>Access Denied</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
          This administrative control panel is restricted to verified administrators only. Please log in using an admin account.
        </p>
      </div>
    );
  }

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    if (!parkingName || !parkingCode || !pincode) {
      alert('Please fill out Name, Code, and Pincode fields.');
      return;
    }

    const token = localStorage.getItem('drivix_auth_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/parking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          parkingName,
          parkingCode,
          address,
          city,
          state: stateField,
          pincode,
          latitude: Number(latitude || 28.4727),
          longitude: Number(longitude || 77.4820),
          openingTime,
          closingTime,
          totalFloors: Number(totalFloors),
          hourlyPrice: Number(hourlyPrice),
          floors: ['L1']
        })
      });

      if (res.ok) {
        setParkingName('');
        setParkingCode('');
        setAddress('');
        setCity('');
        setStateField('');
        setPincode('');
        setLatitude('');
        setLongitude('');
        setOpeningTime('08:00');
        setClosingTime('22:00');
        setTotalFloors(1);
        setHourlyPrice(30);
        fetchLocations();
      } else {
        const errData = await res.json();
        alert('Failed to create location: ' + (errData.message || 'Invalid details'));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create location due to connection error.');
    }
  };

  const selectedLoc = locations.find(l => l._id === selectedLocId || l.id === selectedLocId);

  const handleAddFloor = async () => {
    if (!newFloorName || !selectedLoc) return;
    if (selectedLoc.floors?.includes(newFloorName)) return alert("Floor already exists");

    const token = localStorage.getItem('drivix_auth_token');
    const updatedFloors = [...(selectedLoc.floors || []), newFloorName];
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/parking/${selectedLoc._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ floors: updatedFloors })
      });
      if (res.ok) {
        setNewFloorName('');
        fetchLocations();
      } else {
        alert('Failed to add floor');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFloor = async (e, floorName) => {
    e.stopPropagation();
    if (!window.confirm(`Delete the floor '${floorName}' from this location?`)) return;

    const token = localStorage.getItem('drivix_auth_token');
    const updatedFloors = (selectedLoc.floors || []).filter(f => f !== floorName);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/parking/${selectedLoc._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ floors: updatedFloors })
      });
      if (res.ok) {
        if (selectedFloor === floorName) {
          setSelectedFloor(updatedFloors.length > 0 ? updatedFloors[0] : '');
        }
        fetchLocations();
      } else {
        alert('Failed to delete floor');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkAddSlots = async () => {
    if (!selectedFloor) return alert("Select a floor first");
    if (newSlotCount <= 0) return;

    const token = localStorage.getItem('drivix_auth_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/parking/${selectedLoc._id}/slots/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          selectedFloor,
          newSlotPrefix,
          newSlotCount
        })
      });

      if (res.ok) {
        const result = await res.json();
        alert(`Successfully added ${result.added} slots to ${selectedFloor}`);
        fetchSlots();
        fetchLocations();
      } else {
        const err = await res.json();
        alert('Failed to generate slots: ' + (err.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLocation = async (e, locId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to completely delete this location? All data will be lost.")) return;
    const token = localStorage.getItem('drivix_auth_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/parking/${locId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        if (selectedLocId === locId) {
          setSelectedLocId(null);
          setSelectedFloor('');
        }
        fetchLocations();
      } else {
        alert('Failed to delete location');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSlot = async (e, slotId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this slot permanently?")) return;
    const token = localStorage.getItem('drivix_auth_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/parking/${selectedLoc._id}/slots/${slotId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchSlots();
        fetchLocations();
      } else {
        alert('Failed to delete slot');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSlotStatus = async (slot) => {
    const token = localStorage.getItem('drivix_auth_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/parking/${selectedLoc._id}/slots/${slot.id}/toggle`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchSlots();
        fetchLocations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', minHeight: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Parking Location & Layout Management</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Add physical parking garages, configure logical floors, and map out available slots.</p>
      </header>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* Left Column: Locations List & Create */}
        <div style={{ flex: '1', minWidth: '350px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <MapPin size={18} color="var(--accent-primary)" /> Add New Location
            </h2>
            <form onSubmit={handleCreateLocation} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input 
                  type="text" value={parkingName} onChange={e => setParkingName(e.target.value)} 
                  placeholder="Facility Name (e.g. DLF Mall)" required
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: '#000', outline: 'none' }} 
                />
                <input 
                  type="text" value={parkingCode} onChange={e => setParkingCode(e.target.value)} 
                  placeholder="Parking Code (e.g. SU-MLP)" required
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: '#000', outline: 'none' }} 
                />
              </div>
              
              <input 
                type="text" value={address} onChange={e => setAddress(e.target.value)} 
                placeholder="Street Address" required
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: '#000', outline: 'none' }} 
              />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <input 
                  type="text" value={city} onChange={e => setCity(e.target.value)} 
                  placeholder="City" required
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: '#000', outline: 'none' }} 
                />
                <input 
                  type="text" value={stateField} onChange={e => setStateField(e.target.value)} 
                  placeholder="State" required
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: '#000', outline: 'none' }} 
                />
                <input 
                  type="text" value={pincode} onChange={e => setPincode(e.target.value)} 
                  placeholder="Pincode (6-digit)" required
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: '#000', outline: 'none' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input 
                  type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} 
                  placeholder="Latitude (e.g. 28.47)" 
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: '#000', outline: 'none' }} 
                />
                <input 
                  type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} 
                  placeholder="Longitude (e.g. 77.48)" 
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: '#000', outline: 'none' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Opens</label>
                  <input 
                    type="text" value={openingTime} onChange={e => setOpeningTime(e.target.value)} 
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: '#000', outline: 'none' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Closes</label>
                  <input 
                    type="text" value={closingTime} onChange={e => setClosingTime(e.target.value)} 
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: '#000', outline: 'none' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Floors</label>
                  <input 
                    type="number" min="1" value={totalFloors} onChange={e => setTotalFloors(Number(e.target.value))} 
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: '#000', outline: 'none' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Hourly Price</label>
                  <input 
                    type="number" min="0" value={hourlyPrice} onChange={e => setHourlyPrice(Number(e.target.value))} 
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: '#000', outline: 'none' }} 
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '10px', marginTop: '8px' }}>Create Location</button>
            </form>
          </div>

          <div style={{ flex: 1, background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Managed Facilities</h2>
            {locations.length === 0 ? (
               <p style={{ color: 'var(--text-muted)' }}>No locations configured.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {locations.map(loc => {
                  const locId = loc._id || loc.id;
                  return (
                    <div 
                      key={locId} 
                      onClick={() => {
                         setSelectedLocId(locId);
                         setSelectedFloor(loc.floors && loc.floors.length > 0 ? loc.floors[0] : '');
                      }}
                      style={{ 
                        padding: '12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                        background: selectedLocId === locId ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                        color: selectedLocId === locId ? '#000' : 'var(--text-primary)',
                        border: selectedLocId === locId ? 'none' : '1px solid var(--glass-border)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800 }}>{loc.parkingName || loc.name}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{loc.totalSlots || 0} Slots • {loc.floors?.length || 0} Floors</div>
                      </div>
                      <button 
                        onClick={(e) => handleDeleteLocation(e, locId)}
                        style={{ 
                          background: 'rgba(255, 75, 75, 0.1)', border: 'none', borderRadius: '4px', padding: '6px', 
                          cursor: 'pointer', color: '#ff4b4b', display: 'flex', alignItems: 'center' 
                        }}
                        title="Delete Location"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Location Layout Mgt */}
        <div style={{ flex: '2', minWidth: '400px' }}>
          {!selectedLoc ? (
             <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px dashed var(--glass-border)', minHeight: '300px' }}>
               <MapPin size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
               <p style={{ color: 'var(--text-secondary)' }}>Select a facility to manage its layout.</p>
             </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Floor Management */}
              <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={20} color="var(--accent-primary)" /> Manage Floors: {selectedLoc.parkingName || selectedLoc.name}
                </h2>
                
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {(selectedLoc.floors || []).map(f => (
                    <span key={f} style={{ 
                      padding: '8px 16px', background: 'var(--bg-tertiary)', borderRadius: '8px', 
                      border: selectedFloor === f ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' 
                    }} onClick={() => setSelectedFloor(f)}>
                      {f}
                      <X size={14} color="#ff4b4b" onClick={(e) => handleDeleteFloor(e, f)} style={{ opacity: 0.8 }} title="Delete Floor" />
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" value={newFloorName} onChange={e => setNewFloorName(e.target.value.toUpperCase())} 
                    placeholder="E.g. L4, B1" 
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: '#000', outline: 'none' }} 
                  />
                  <button onClick={handleAddFloor} className="btn btn-secondary"><Plus size={16}/> Add Floor</button>
                </div>
              </div>

              {/* Slot Management */}
              {selectedFloor && (
                <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '12px' }}>
                      <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Car size={20} color="var(--accent-primary)" /> Slots in {selectedFloor}
                      </h2>
                      
                      {/* Bulk Add Tool */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Prefix:</span>
                        <input type="text" value={newSlotPrefix} onChange={e=>setNewSlotPrefix(e.target.value.toUpperCase())} style={{ width: '40px', padding: '4px', background: 'var(--bg-tertiary)', border: 'none', color: '#000', textAlign: 'center', borderRadius: '4px' }}/>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Count:</span>
                        <input type="number" min="1" max="50" value={newSlotCount} onChange={e=>setNewSlotCount(Number(e.target.value))} style={{ width: '50px', padding: '4px', background: 'var(--bg-tertiary)', border: 'none', color: '#000', textAlign: 'center', borderRadius: '4px' }}/>
                        <button onClick={handleBulkAddSlots} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Generate</button>
                      </div>
                   </div>

                   <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                     {slots.filter(s => s.floor === selectedFloor).length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', width: '100%', textAlign: 'center', padding: '20px' }}>No slots mapped to this floor yet.</p>
                     ) : (
                       slots.filter(s => s.floor === selectedFloor).sort((a,b) => a.id.localeCompare(b.id)).map(slot => (
                          <div 
                            key={slot.id}
                            onClick={() => toggleSlotStatus(slot)}
                            style={{ 
                              width: '60px', height: '60px', borderRadius: '8px', 
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                              background: slot.status === 'available' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                              border: `1px solid ${slot.status === 'available' ? '#4CAF50' : '#f44336'}`
                            }}
                          >
                             <button
                               onClick={(e) => handleDeleteSlot(e, slot.id)}
                               style={{
                                 position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px',
                                 background: '#ff4b4b', color: '#fff', border: 'none', borderRadius: '50%',
                                 display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                 boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                                }}
                               title="Delete Slot"
                             >
                                <X size={12} strokeWidth={3} />
                             </button>
                             <div style={{ fontWeight: 800, fontSize: '0.85rem', color: slot.status === 'available' ? '#4CAF50' : '#f44336' }}>{slot.id}</div>
                             <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{slot.status}</div>
                          </div>
                       ))
                     )}
                   </div>
                   
                   <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '20px', textAlign: 'left' }}>
                     * Click the main card area to toggle Booked/Available status. Click the red 'X' to permanently delete a generated slot.
                   </p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminParking;
