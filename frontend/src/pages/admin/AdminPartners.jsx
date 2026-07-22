import React, { useState, useEffect } from 'react';
import { 
  Building, CheckCircle, XCircle, Loader2, User, Phone, 
  Mail, MapPin, FileText, Calendar, Clock, Eye, Download, Info
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

const AdminPartners = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, approved, rejected

  const fetchApplications = async () => {
    const token = localStorage.getItem('drivix_auth_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/partners/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (error) {
      console.error("Error fetching partner applications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    setUpdatingId(id);
    const token = localStorage.getItem('drivix_auth_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/partners/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updated = await res.json();
        // Update local state
        setApplications(prev => prev.map(app => 
          (app._id === id || app.id === id) ? { ...app, status: updated.data.status } : app
        ));
        
        // Update active selection details if modal is open
        if (selectedApp && (selectedApp._id === id || selectedApp.id === id)) {
          setSelectedApp(prev => ({ ...prev, status: updated.data.status }));
        }
      }
    } catch (error) {
      console.error("Error updating application status:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredApps = applications.filter(app => {
    if (filterStatus === 'all') return true;
    return app.status === filterStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return { bg: 'rgba(76, 175, 80, 0.1)', text: '#4CAF50' };
      case 'rejected': return { bg: 'rgba(244, 67, 54, 0.1)', text: '#f44336' };
      default: return { bg: 'rgba(255, 206, 0, 0.1)', text: '#FFCE00' };
    }
  };

  const openDocument = (docBase64) => {
    if (!docBase64) return;
    const newTab = window.open();
    if (newTab) {
      newTab.document.write(
        `<iframe src="${docBase64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', minHeight: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '8px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Building size={32} />
        Partner Applications
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Review and manage applications from property owners listing their buildings as smart parking facilities.
      </p>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['all', 'pending', 'approved', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: filterStatus === status ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
              background: filterStatus === status ? 'rgba(250, 255, 0, 0.08)' : 'var(--glass-bg)',
              color: filterStatus === status ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.2s'
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 size={40} color="var(--accent-primary)" className="animate-spin" style={{ marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading applications...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '3rem', textAlign: 'center', border: '1px dashed var(--glass-border)' }}>
          <CheckCircle size={40} color="#4CAF50" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No Listings Found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>There are no partner applications matching the selected criteria.</p>
        </div>
      ) : (
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ padding: '12px 16px' }}>Business & Applicant</th>
                <th style={{ padding: '12px 16px' }}>Contact Info</th>
                <th style={{ padding: '12px 16px' }}>Location</th>
                <th style={{ padding: '12px 16px' }}>Facility Specs</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map(app => {
                const appId = app._id || app.id;
                const statusStyles = getStatusColor(app.status);

                return (
                  <tr key={appId} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem', verticalAlign: 'middle' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{app.businessName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Owner: {app.fullName}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                        <Mail size={12} color="var(--text-muted)" /> {app.email}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', marginTop: '4px' }}>
                        <Phone size={12} color="var(--text-muted)" /> {app.phone}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ color: 'var(--text-primary)' }}>{app.city}, {app.state}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PIN: {app.pin}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ color: 'var(--text-primary)' }}>{app.slotsCount} Slots ({app.facilityType})</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Vehicles: {app.vehicles.map(v => v.replace('Wheeler', '-Wheeler')).join(', ')}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background: statusStyles.bg,
                        color: statusStyles.text
                      }}>
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Eye size={14} /> Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal Overlay */}
      {selectedApp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 1050,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '750px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2.5rem',
            position: 'relative',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ 
                  padding: '4px 10px', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem', 
                  fontWeight: 800, 
                  textTransform: 'uppercase',
                  background: getStatusColor(selectedApp.status).bg,
                  color: getStatusColor(selectedApp.status).text,
                  display: 'inline-block',
                  marginBottom: '8px'
                }}>
                  {selectedApp.status}
                </span>
                <h2 style={{ fontSize: '1.6rem', margin: 0 }}>{selectedApp.businessName}</h2>
              </div>
              <button 
                onClick={() => setSelectedApp(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* Content Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Left Column: Applicant & Location */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px', color: 'var(--accent-primary)', marginBottom: '10px' }}>
                    Applicant Details
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16} color="var(--text-muted)" /> {selectedApp.fullName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={16} color="var(--text-muted)" /> {selectedApp.email}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={16} color="var(--text-muted)" /> {selectedApp.phone}</div>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px', color: 'var(--accent-primary)', marginBottom: '10px' }}>
                    Location Details
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <MapPin size={16} color="var(--text-muted)" style={{ marginTop: '2px', flexShrink: 0 }} /> 
                      <span>{selectedApp.address}, {selectedApp.city}, {selectedApp.state} - {selectedApp.pin}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Facility Specs & Documents */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px', color: 'var(--accent-primary)', marginBottom: '10px' }}>
                    Facility Specifications
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Building size={16} color="var(--text-muted)" /> {selectedApp.facilityType} Facility</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={16} color="var(--text-muted)" /> {selectedApp.slotsCount} Total Parking Slots</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} color="var(--text-muted)" /> Hours: {selectedApp.operatingHours}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Info size={16} color="var(--text-muted)" /> Supported: {selectedApp.vehicles.map(v => v.replace('Wheeler', '-Wheeler')).join(', ')}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px', color: 'var(--accent-primary)', marginBottom: '10px' }}>
                    Verification Document
                  </h3>
                  {selectedApp.documentFile ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => openDocument(selectedApp.documentFile)}
                        className="btn btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Eye size={16} /> View Document
                      </button>
                      <a
                        href={selectedApp.documentFile}
                        download={`document_${selectedApp.businessName.replace(/\s+/g, '_')}`}
                        className="btn btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                      >
                        <Download size={16} /> Download
                      </a>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No document uploaded</span>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            {selectedApp.notes && (
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Additional Notes</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{selectedApp.notes}</p>
              </div>
            )}

            {/* Document Preview (Only if it's an image base64 URL) */}
            {selectedApp.documentFile && selectedApp.documentFile.startsWith('data:image/') && (
              <div style={{ 
                maxHeight: '200px', 
                overflow: 'hidden', 
                borderRadius: '12px', 
                border: '1px solid var(--glass-border)', 
                display: 'flex', 
                justifyContent: 'center', 
                background: 'rgba(0,0,0,0.2)' 
              }}>
                <img 
                  src={selectedApp.documentFile} 
                  alt="Verification Document Preview" 
                  style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain', cursor: 'pointer' }}
                  onClick={() => openDocument(selectedApp.documentFile)}
                />
              </div>
            )}

            {/* Actions Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              borderTop: '1px solid var(--glass-border)',
              paddingTop: '20px',
              marginTop: '10px'
            }}>
              <button
                onClick={() => setSelectedApp(null)}
                className="btn btn-secondary"
                style={{ padding: '10px 20px' }}
              >
                Close
              </button>
              
              {selectedApp.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedApp._id || selectedApp.id, 'rejected')}
                    className="btn btn-secondary"
                    disabled={updatingId !== null}
                    style={{ 
                      padding: '10px 20px', 
                      background: 'rgba(244, 67, 54, 0.1)', 
                      borderColor: 'rgba(244, 67, 54, 0.3)',
                      color: '#f44336' 
                    }}
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedApp._id || selectedApp.id, 'approved')}
                    className="btn btn-primary"
                    disabled={updatingId !== null}
                    style={{ 
                      padding: '10px 20px', 
                      background: 'var(--accent-primary)',
                      color: '#000',
                      fontWeight: 800
                    }}
                  >
                    Approve Application
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPartners;
