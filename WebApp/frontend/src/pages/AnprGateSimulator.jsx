import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';
import { useToast } from '../context/ToastContext';
import {
  Shield, Navigation, Play, Trash2, Key,
  CheckCircle2, AlertTriangle, Monitor, RefreshCw,
  LogIn, LogOut, Info, Clipboard
} from 'lucide-react';

const AnprGateSimulator = () => {
  const { showToast } = useToast();
  const socketRef = useRef(null);
  const consoleEndRef = useRef(null);

  // States
  const [hubs, setHubs] = useState([]);
  const [selectedHubId, setSelectedHubId] = useState('');
  const [bookings, setBookings] = useState([]);
  const [logs, setLogs] = useState([]);

  // Entry Gate State
  const [entryPlate, setEntryPlate] = useState('');
  const [entryGateStatus, setEntryGateStatus] = useState('Closed'); // Closed, Scanning, Open, Denied
  const [entryMsg, setEntryMsg] = useState('Ready for vehicle scanning.');

  // Exit Gate State
  const [exitPlate, setExitPlate] = useState('');
  const [exitGateStatus, setExitGateStatus] = useState('Closed'); // Closed, Scanning, Open, Denied
  const [exitMsg, setExitMsg] = useState('Ready for vehicle scanning.');

  // Fetch Parking Hubs on load
  useEffect(() => {
    const fetchHubs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/parking`);
        if (res.ok) {
          const data = await res.json();
          setHubs(data);
          if (data.length > 0) {
            setSelectedHubId(data[0]._id);
          }
        }
      } catch (err) {
        addLog(`Error fetching parking locations: ${err.message}`, 'error');
      }
    };
    fetchHubs();
  }, []);

  // Fetch Bookings for Selected Hub
  const fetchHubBookings = async (hubId) => {
    if (!hubId) return;
    try {
      const token = localStorage.getItem('drivix_auth_token');
      // For simulator testing, we can fetch all bookings at the location.
      // If we don't have an admin token, we query the bookings/my endpoint or standard admin bookings list
      // To bypass auth limitations for simulator demonstration, let's fetch from the generic list or handle it gracefully
      const res = await fetch(`${API_BASE_URL}/api/v1/bookings/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter bookings that match selectedHubId and are active (Confirmed, Slot Assigned, Checked In)
        const filtered = data.filter(b => b.parkingHubId === hubId || b.locationId === hubId);
        setBookings(filtered);
      }
    } catch (err) {
      console.error("Error loading active bookings:", err);
    }
  };

  useEffect(() => {
    if (selectedHubId) {
      fetchHubBookings(selectedHubId);
    }
  }, [selectedHubId]);

  // Connect Socket.IO for real-time logs
  useEffect(() => {
    socketRef.current = io(API_BASE_URL);

    socketRef.current.on('connect', () => {
      addLog('🔌 Socket.IO connected. Real-time console feed active.', 'info');
    });

    socketRef.current.on('gateStateChanged', (data) => {
      const time = new Date().toLocaleTimeString();
      const typeStr = data.gateType === 'entry' ? 'ENTRY GATE' : 'EXIT GATE';
      
      addLog(`[${typeStr}] ${data.message}`, data.status === 'Open' ? 'success' : 'warn');

      if (data.gateType === 'entry') {
        if (data.status === 'Open') {
          setEntryGateStatus('Open');
          setEntryMsg(data.message);
          // Auto-close gate after 5 seconds
          setTimeout(() => {
            setEntryGateStatus('Closed');
            setEntryMsg('Gate closed. Barrier reset.');
          }, 5000);
        } else {
          setEntryGateStatus('Denied');
          setEntryMsg(data.message);
        }
      } else if (data.gateType === 'exit') {
        if (data.status === 'Open') {
          setExitGateStatus('Open');
          setExitMsg(data.message);
          setTimeout(() => {
            setExitGateStatus('Closed');
            setExitMsg('Gate closed. Barrier reset.');
          }, 5000);
        } else {
          setExitGateStatus('Denied');
          setExitMsg(data.message);
        }
      }

      // Refresh list
      if (selectedHubId) {
        fetchHubBookings(selectedHubId);
      }
    });

    socketRef.current.on('slotStatusUpdated', (data) => {
      addLog(`[SLOT STATUS] Slot ${data.id} is now ${data.status.toUpperCase()}`, 'info');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [selectedHubId]);

  // Scroll Console to Bottom
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (text, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, text, type }]);
  };

  const handleSimulateEntry = async () => {
    if (!entryPlate) {
      showToast("Please enter a license plate number", "error");
      return;
    }
    setEntryGateStatus('Scanning');
    setEntryMsg('Scanning plate camera and verifying active bookings...');
    addLog(`[ANPR CAMERA] Scanning incoming vehicle plate: "${entryPlate}"`, 'info');

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/gate/simulate-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleNumber: entryPlate,
          parkingHubId: selectedHubId
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Access Granted! Gate barrier opened.", "success");
      } else {
        setEntryGateStatus('Denied');
        setEntryMsg(data.message || "Entry Denied.");
        addLog(`[ENTRY DENIED] ${data.message || "Validation failed."}`, 'error');
        showToast(data.message || "Entry Denied", "error");
        
        setTimeout(() => {
          setEntryGateStatus('Closed');
        }, 5000);
      }
    } catch (err) {
      setEntryGateStatus('Closed');
      setEntryMsg("Connection error.");
      addLog(`[ENTRY ERROR] ${err.message}`, 'error');
      showToast("Error simulating gate entry.", "error");
    }
  };

  const handleSimulateExit = async () => {
    if (!exitPlate) {
      showToast("Please enter an exit license plate number", "error");
      return;
    }
    setExitGateStatus('Scanning');
    setExitMsg('Scanning plate camera and checking booking checkout state...');
    addLog(`[ANPR CAMERA] Scanning exiting vehicle plate: "${exitPlate}"`, 'info');

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/gate/simulate-exit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleNumber: exitPlate,
          parkingHubId: selectedHubId
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Access Granted! Exit gate opened.", "success");
      } else {
        setExitGateStatus('Denied');
        setExitMsg(data.message || "Exit Denied.");
        addLog(`[EXIT DENIED] ${data.message || "Validation failed."}`, 'error');
        showToast(data.message || "Exit Denied", "error");
        
        setTimeout(() => {
          setExitGateStatus('Closed');
        }, 5000);
      }
    } catch (err) {
      setExitGateStatus('Closed');
      setExitMsg("Connection error.");
      addLog(`[EXIT ERROR] ${err.message}`, 'error');
      showToast("Error simulating gate exit.", "error");
    }
  };

  const copyToInput = (plate, type) => {
    if (type === 'entry') {
      setEntryPlate(plate);
      showToast(`Copied ${plate} to Entry input`, "info");
    } else {
      setExitPlate(plate);
      showToast(`Copied ${plate} to Exit input`, "info");
    }
  };

  return (
    <div style={{ paddingTop: '90px', minHeight: '100vh', background: 'var(--bg-primary)', padding: '110px 3% 80px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            background: 'rgba(255,206,0,0.15)', border: '1px solid var(--accent-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Shield size={22} color="var(--accent-primary)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              ANPR Gate <span style={{ color: 'var(--accent-primary)' }}>Simulator</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Simulates automatic camera-based number plate recognition at physical parking hub boom barriers.
            </p>
          </div>
        </div>

        {/* Hub Selection Banner */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-card)', background: 'var(--bg-tertiary)', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Monitor size={18} color="var(--text-secondary)" />
            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              ACTIVE PARKING GATE LOCATION:
            </span>
            <select
              value={selectedHubId}
              onChange={(e) => setSelectedHubId(e.target.value)}
              style={{
                padding: '8px 16px', background: 'var(--bg-primary)',
                border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-input)',
                color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer'
              }}
            >
              {hubs.map(hub => (
                <option key={hub._id} value={hub._id}>{hub.parkingName} ({hub.city})</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => fetchHubBookings(selectedHubId)}
            className="btn btn-secondary" 
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} /> Refresh Data
          </button>
        </div>

        {/* Simulator Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          
          {/* ─ ENTRY GATE PANEL ─ */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-card)', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LogIn size={18} color="#00cc6a" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Entry Checkpoint Gate</h2>
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: '20px',
                background: entryGateStatus === 'Open' ? 'rgba(0,204,106,0.15)' : entryGateStatus === 'Denied' ? 'rgba(255,75,75,0.15)' : 'rgba(255,255,255,0.05)',
                color: entryGateStatus === 'Open' ? '#00cc6a' : entryGateStatus === 'Denied' ? '#ff4b4b' : 'var(--text-secondary)',
                fontSize: '0.72rem', fontWeight: 800, border: '1px solid currentColor'
              }}>
                GATE {entryGateStatus.toUpperCase()}
              </span>
            </div>

            {/* Barrier Gate Simulation Graphic */}
            <div style={{
              height: '140px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-input)',
              border: '1px solid var(--glass-border)', position: 'relative', display: 'flex',
              alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
            }}>
              {/* Gate Column base */}
              <div style={{
                position: 'absolute', bottom: '0', left: '60px', width: '24px', height: '80px',
                background: '#FFCE00', borderRadius: '4px 4px 0 0', display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 0', alignItems: 'center'
              }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: entryGateStatus === 'Open' ? '#00cc6a' : entryGateStatus === 'Denied' ? '#ff4b4b' : '#333' }} />
              </div>

              {/* Boom Barrier Bar */}
              <div style={{
                position: 'absolute', bottom: '50px', left: '72px', width: '220px', height: '12px',
                background: 'repeating-linear-gradient(45deg, #000, #000 10px, #FFCE00 10px, #FFCE00 20px)',
                borderRadius: '6px', originX: '0', originY: '50%',
                transformOrigin: '0% 50%',
                transform: entryGateStatus === 'Open' ? 'rotate(-85deg)' : 'rotate(0deg)',
                transition: 'transform 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }} />

              {/* Scanning laser line */}
              {entryGateStatus === 'Scanning' && (
                <div style={{
                  position: 'absolute', width: '100%', height: '2px', background: '#00cc6a',
                  boxShadow: '0 0 10px #00cc6a', top: '0',
                  animation: 'laserScan 1.5s infinite alternate'
                }} />
              )}

              <p style={{ position: 'absolute', bottom: '10px', right: '12px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                ANPR CAMERA MOCKED
              </p>
            </div>

            {/* Input Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                SCAN LICENSE PLATE
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="e.g. DL01AB1234"
                  value={entryPlate}
                  onChange={(e) => setEntryPlate(e.target.value.toUpperCase())}
                  style={{
                    flex: 1, padding: '12px', background: 'var(--bg-primary)',
                    border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-input)',
                    color: 'var(--text-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px'
                  }}
                />
                <button 
                  onClick={handleSimulateEntry}
                  disabled={entryGateStatus === 'Scanning'}
                  className="btn btn-primary"
                  style={{ padding: '0 20px', fontWeight: 800, fontSize: '0.85rem' }}
                >
                  Trigger Gate
                </button>
              </div>
            </div>

            <p style={{
              fontSize: '0.78rem', padding: '12px', background: 'rgba(255,255,255,0.03)',
              borderRadius: 'var(--radius-button)', border: '1px dashed var(--glass-border)',
              color: entryGateStatus === 'Denied' ? '#ff4b4b' : 'var(--text-secondary)'
            }}>
              📢 <strong>Console Feed:</strong> {entryMsg}
            </p>
          </div>

          {/* ─ EXIT GATE PANEL ─ */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-card)', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LogOut size={18} color="#FFCE00" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Exit Checkpoint Gate</h2>
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: '20px',
                background: exitGateStatus === 'Open' ? 'rgba(0,204,106,0.15)' : exitGateStatus === 'Denied' ? 'rgba(255,75,75,0.15)' : 'rgba(255,255,255,0.05)',
                color: exitGateStatus === 'Open' ? '#00cc6a' : exitGateStatus === 'Denied' ? '#ff4b4b' : 'var(--text-secondary)',
                fontSize: '0.72rem', fontWeight: 800, border: '1px solid currentColor'
              }}>
                GATE {exitGateStatus.toUpperCase()}
              </span>
            </div>

            {/* Barrier Gate Simulation Graphic */}
            <div style={{
              height: '140px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-input)',
              border: '1px solid var(--glass-border)', position: 'relative', display: 'flex',
              alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
            }}>
              {/* Gate Column base */}
              <div style={{
                position: 'absolute', bottom: '0', left: '60px', width: '24px', height: '80px',
                background: '#FFCE00', borderRadius: '4px 4px 0 0', display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 0', alignItems: 'center'
              }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: exitGateStatus === 'Open' ? '#00cc6a' : exitGateStatus === 'Denied' ? '#ff4b4b' : '#333' }} />
              </div>

              {/* Boom Barrier Bar */}
              <div style={{
                position: 'absolute', bottom: '50px', left: '72px', width: '220px', height: '12px',
                background: 'repeating-linear-gradient(45deg, #000, #000 10px, #FFCE00 10px, #FFCE00 20px)',
                borderRadius: '6px', originX: '0', originY: '50%',
                transformOrigin: '0% 50%',
                transform: exitGateStatus === 'Open' ? 'rotate(-85deg)' : 'rotate(0deg)',
                transition: 'transform 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }} />

              {/* Scanning laser line */}
              {exitGateStatus === 'Scanning' && (
                <div style={{
                  position: 'absolute', width: '100%', height: '2px', background: '#00cc6a',
                  boxShadow: '0 0 10px #00cc6a', top: '0',
                  animation: 'laserScan 1.5s infinite alternate'
                }} />
              )}

              <p style={{ position: 'absolute', bottom: '10px', right: '12px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                ANPR CAMERA MOCKED
              </p>
            </div>

            {/* Input Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                SCAN EXIT VEHICLE PLATE
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="e.g. DL01AB1234"
                  value={exitPlate}
                  onChange={(e) => setExitPlate(e.target.value.toUpperCase())}
                  style={{
                    flex: 1, padding: '12px', background: 'var(--bg-primary)',
                    border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-input)',
                    color: 'var(--text-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px'
                  }}
                />
                <button 
                  onClick={handleSimulateExit}
                  disabled={exitGateStatus === 'Scanning'}
                  className="btn btn-primary"
                  style={{ padding: '0 20px', fontWeight: 800, fontSize: '0.85rem' }}
                >
                  Trigger Gate
                </button>
              </div>
            </div>

            <p style={{
              fontSize: '0.78rem', padding: '12px', background: 'rgba(255,255,255,0.03)',
              borderRadius: 'var(--radius-button)', border: '1px dashed var(--glass-border)',
              color: exitGateStatus === 'Denied' ? '#ff4b4b' : 'var(--text-secondary)'
            }}>
              📢 <strong>Console Feed:</strong> {exitMsg}
            </p>
          </div>

        </div>

        {/* Console Log Terminal */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-card)', background: '#07070e', border: '1px solid var(--glass-border)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1a1a2e', paddingBottom: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', marginLeft: '10px' }}>
                SYSTEM CHECKPOINT LOGGER
              </span>
            </div>
            <button 
              onClick={() => setLogs([])}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 800 }}
            >
              <Trash2 size={12} /> Clear Console
            </button>
          </div>

          <div style={{
            height: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px',
            fontFamily: 'monospace', fontSize: '0.8rem', color: '#a0a0ff', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px'
          }}>
            {logs.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.2)' }}>Console idle. System online.</p>
            ) : (
              logs.map((log, idx) => (
                <p key={idx} style={{
                  color: log.type === 'error' ? '#ff4b4b' : log.type === 'success' ? '#00cc6a' : log.type === 'warn' ? '#FFCE00' : '#8892b0',
                  margin: '0', lineHeight: '1.4'
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.25)', marginRight: '8px' }}>[{log.timestamp}]</span>
                  {log.text}
                </p>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>
        </div>

        {/* Active Reservations Reference Table */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-card)', background: 'var(--bg-tertiary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Clipboard size={18} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Active Reservations (Copy Reference)</h2>
          </div>
          
          {bookings.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-input)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                No active bookings found for this hub in the database.
              </p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                Go to the booking list and create reservations on floor {hubs.find(h => h._id === selectedHubId)?.floors?.[0] || 'L1'} to populate this list.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontWeight: 800 }}>
                    <th style={{ padding: '12px' }}>Plate Number</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Floor</th>
                    <th style={{ padding: '12px' }}>Assigned Slot</th>
                    <th style={{ padding: '12px' }}>Start Time</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(booking => (
                    <tr key={booking._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-primary)' }}>
                      <td style={{ padding: '12px', fontWeight: 800, letterSpacing: '0.5px' }}>
                        {booking.vehicleNumber}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800,
                          background: booking.status === 'Checked In' ? 'rgba(0,204,106,0.15)' : booking.status === 'Slot Assigned' ? 'rgba(255,206,0,0.15)' : 'rgba(255,255,255,0.05)',
                          color: booking.status === 'Checked In' ? '#00cc6a' : booking.status === 'Slot Assigned' ? '#FFCE00' : 'var(--text-secondary)',
                          border: '1px solid currentColor'
                        }}>
                          {booking.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{booking.floor}</td>
                      <td style={{ padding: '12px', fontWeight: 800, color: 'var(--accent-primary)' }}>
                        {booking.slotId || 'None (Conf.)'}
                      </td>
                      <td style={{ padding: '12px' }}>{booking.startTime}</td>
                      <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => copyToInput(booking.vehicleNumber, 'entry')}
                          disabled={booking.status !== 'Confirmed' && booking.status !== 'Slot Assigned'}
                          style={{
                            padding: '6px 10px', background: 'rgba(0,204,106,0.12)', color: '#00cc6a',
                            border: '1px solid rgba(0,204,106,0.2)', borderRadius: '4px',
                            fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer'
                          }}
                        >
                          Copy to Entry
                        </button>
                        <button
                          onClick={() => copyToInput(booking.vehicleNumber, 'exit')}
                          disabled={booking.status !== 'Checked In'}
                          style={{
                            padding: '6px 10px', background: 'rgba(255,206,0,0.12)', color: '#FFCE00',
                            border: '1px solid rgba(255,206,0,0.2)', borderRadius: '4px',
                            fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer'
                          }}
                        >
                          Copy to Exit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Styled Laser scanning keyframes */}
      <style>{`
        @keyframes laserScan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default AnprGateSimulator;
