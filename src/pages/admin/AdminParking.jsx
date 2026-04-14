import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, doc, query, onSnapshot, addDoc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { MapPin, Layers, Plus, Car, Check, X, Server, Trash, RefreshCw } from 'lucide-react';

const AdminParking = () => {
  const [locations, setLocations] = useState([]);
  const [selectedLocId, setSelectedLocId] = useState(null);
  const [slots, setSlots] = useState([]);
  
  // Forms
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newFloorName, setNewFloorName] = useState('');
  const [newSlotPrefix, setNewSlotPrefix] = useState('A');
  const [newSlotCount, setNewSlotCount] = useState(10);
  const [selectedFloor, setSelectedFloor] = useState('');

  // Fetch Locations
  useEffect(() => {
    const q = query(collection(db, 'parking_facilities'));
    const unsub = onSnapshot(q, snap => {
      setLocations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // Fetch Slots when location selected
  useEffect(() => {
    if (!selectedLocId) {
      setSlots([]);
      return;
    }
    const q = query(collection(db, `parking_facilities/${selectedLocId}/slots`));
    const unsub = onSnapshot(q, snap => {
      setSlots(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [selectedLocId]);

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    if (!newLocName) return;
    try {
      await addDoc(collection(db, 'parking_facilities'), {
        name: newLocName,
        address: newLocAddress,
        floors: ['L1'],
        totalSlots: 0,
        pricePerHr: 10,
        color: '#FFCE00'
      });
      setNewLocName('');
      setNewLocAddress('');
    } catch(err) {
      console.error(err);
      alert('Failed to create location');
    }
  };

  const selectedLoc = locations.find(l => l.id === selectedLocId);

  const handleAddFloor = async () => {
    if (!newFloorName || !selectedLoc) return;
    if (selectedLoc.floors?.includes(newFloorName)) return alert("Floor already exists");
    
    try {
      await updateDoc(doc(db, 'parking_facilities', selectedLoc.id), {
        floors: [...(selectedLoc.floors || []), newFloorName]
      });
      setNewFloorName('');
    } catch(err) {
      console.error(err);
    }
  };

  const handleDeleteFloor = async (e, floorName) => {
    e.stopPropagation();
    if (!window.confirm(`Delete the floor '${floorName}' from this location?`)) return;
    
    const updatedFloors = (selectedLoc.floors || []).filter(f => f !== floorName);
    try {
      await updateDoc(doc(db, 'parking_facilities', selectedLoc.id), {
        floors: updatedFloors
      });
      if (selectedFloor === floorName) {
        setSelectedFloor(updatedFloors.length > 0 ? updatedFloors[0] : '');
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleBulkAddSlots = async () => {
    if (!selectedFloor) return alert("Select a floor first");
    if (newSlotCount <= 0) return;

    try {
      // Very basic non-batched loop for simplicity (Firestore allows rapid writes)
      let added = 0;
      for (let i = 1; i <= newSlotCount; i++) {
        const slotId = `${newSlotPrefix}${i}`;
        // check if exists
        if(slots.find(s => s.id === slotId)) continue;
        
        await setDoc(doc(db, `parking_facilities/${selectedLoc.id}/slots`, slotId), {
           id: slotId,
           floor: selectedFloor,
           row: newSlotPrefix,
           number: i,
           status: 'available',
           updatedAt: new Date()
        });
        added++;
      }
      
      // Update totalSlots count
      await updateDoc(doc(db, 'parking_facilities', selectedLoc.id), {
         totalSlots: (selectedLoc.totalSlots || 0) + added
      });
      
      alert(`Successfully added ${added} slots to ${selectedFloor}`);
    } catch(err) {
      console.error(err);
    }
  };

  const handleDeleteLocation = async (e, locId) => {
    e.stopPropagation(); // prevent selecting it
    if (!window.confirm("Are you sure you want to completely delete this location? All data will be lost.")) return;
    try {
      await deleteDoc(doc(db, 'parking_facilities', locId));
      if (selectedLocId === locId) {
         setSelectedLocId(null);
         setSelectedFloor('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSlot = async (e, slotId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this slot permanently?")) return;
    try {
      await deleteDoc(doc(db, `parking_facilities/${selectedLoc.id}/slots`, slotId));
      await updateDoc(doc(db, 'parking_facilities', selectedLoc.id), {
         totalSlots: Math.max(0, (selectedLoc.totalSlots || 1) - 1)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSlotStatus = async (slot) => {
    const newStatus = slot.status === 'available' ? 'booked' : 'available';
    try {
      await updateDoc(doc(db, `parking_facilities/${selectedLoc.id}/slots`, slot.id), {
        status: newStatus
      });
    } catch(err) {
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
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <MapPin size={18} color="var(--accent-primary)" /> Add New Location
            </h2>
            <form onSubmit={handleCreateLocation} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                type="text" value={newLocName} onChange={e => setNewLocName(e.target.value)} 
                placeholder="Facility Name (e.g. DLF Mall)" 
                style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }} 
              />
              <input 
                type="text" value={newLocAddress} onChange={e => setNewLocAddress(e.target.value)} 
                placeholder="Address" 
                style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }} 
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '10px', marginTop: '4px' }}>Create Location</button>
            </form>
          </div>

          <div style={{ flex: 1, background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Managed Facilities</h2>
            {locations.length === 0 ? (
               <p style={{ color: 'var(--text-muted)' }}>No locations configured.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {locations.map(loc => (
                  <div 
                    key={loc.id} 
                    onClick={() => {
                       setSelectedLocId(loc.id);
                       setSelectedFloor(loc.floors && loc.floors.length > 0 ? loc.floors[0] : '');
                    }}
                    style={{ 
                      padding: '12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                      background: selectedLocId === loc.id ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: selectedLocId === loc.id ? '#000' : 'var(--text-primary)',
                      border: selectedLocId === loc.id ? 'none' : '1px solid var(--glass-border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800 }}>{loc.name}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{loc.totalSlots || 0} Slots • {loc.floors?.length || 0} Floors</div>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteLocation(e, loc.id)}
                      style={{ 
                        background: 'rgba(255, 75, 75, 0.1)', border: 'none', borderRadius: '4px', padding: '6px', 
                        cursor: 'pointer', color: '#ff4b4b', display: 'flex', alignItems: 'center' 
                      }}
                      title="Delete Location"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Location Layout Mgt */}
        <div style={{ flex: '2', minWidth: '400px' }}>
          {!selectedLoc ? (
             <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
               <MapPin size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
               <p style={{ color: 'var(--text-secondary)' }}>Select a facility to manage its layout.</p>
             </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Floor Management */}
              <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={20} color="var(--accent-primary)" /> Manage Floors: {selectedLoc.name}
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
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }} 
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
                        <input type="text" value={newSlotPrefix} onChange={e=>setNewSlotPrefix(e.target.value.toUpperCase())} style={{ width: '40px', padding: '4px', background: 'var(--bg-tertiary)', border: 'none', color: '#fff', textAlign: 'center', borderRadius: '4px' }}/>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Count:</span>
                        <input type="number" min="1" max="50" value={newSlotCount} onChange={e=>setNewSlotCount(Number(e.target.value))} style={{ width: '50px', padding: '4px', background: 'var(--bg-tertiary)', border: 'none', color: '#fff', textAlign: 'center', borderRadius: '4px' }}/>
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
                             <div style={{ fontWeight: 800, fontSize: '1rem', color: slot.status === 'available' ? '#4CAF50' : '#f44336' }}>{slot.id}</div>
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
