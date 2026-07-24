import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, Eye, MousePointer, Percent, AlertCircle, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ctaText, setCtaText] = useState('Learn More');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [priority, setPriority] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = localStorage.getItem('token');

  const fetchBanners = async () => {
    setLoading(true);
    try {
      // In admin panel, fetch all banners (active and inactive). Since the backend GET /api/v1/banners route returns active ones,
      // let's use an admin specific endpoint if available, or fetch from /api/v1/banners and extend to return all for admin,
      // or we can allow the backend GET / to accept a query param ?all=true if req.user is admin.
      // Wait, let's look at bannerController.js: getActiveBanners returns active banners.
      // Let's modify bannerController.js so that if the request has authorization token of an admin,
      // it returns all banners including inactive ones!
      // Wait! Let's check how headers are sent. We can pass the Authorization token, and if the user is admin, return all banners.
      // Let's look at bannerController.js:
      // "export const getActiveBanners = async (req, res) => { ..."
      // Wait! We can modify getActiveBanners in controller to check if there is an admin user. But wait, `protect` middleware is not run on GET /api/v1/banners by default.
      // Let's modify bannerController.js to support returning all banners for admin if they hit GET /api/v1/banners?admin=true and have a valid token, or we can check token manually in controller if present!
      // Or we can add an admin-only endpoint: GET /api/v1/banners/admin which goes through `protect` and `adminOnly`!
      // Yes! That is extremely clean and secure. Let's add GET /api/v1/banners/admin in routes and map it to a new controller handler: `getAdminBanners`!
      // Let's do that. But first, let's write AdminBanners.jsx component assuming it hits `/api/v1/banners/admin`!
      
      const res = await fetch(`${API_BASE_URL}/api/v1/banners/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreateModal = () => {
    setEditingBanner(null);
    setTitle('');
    setDescription('');
    setImageUrl('');
    setCtaText('Learn More');
    setRedirectUrl('');
    setPriority(0);
    setIsActive(true);
    setStartDate('');
    setEndDate('');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setDescription(banner.description);
    setImageUrl(banner.imageUrl);
    setCtaText(banner.ctaText || 'Learn More');
    setRedirectUrl(banner.redirectUrl);
    setPriority(banner.priority || 0);
    setIsActive(banner.isActive);
    setStartDate(banner.startDate ? banner.startDate.substring(0, 16) : '');
    setEndDate(banner.endDate ? banner.endDate.substring(0, 16) : '');
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      title,
      description,
      imageUrl,
      ctaText,
      redirectUrl,
      priority: Number(priority),
      isActive,
      startDate: startDate || null,
      endDate: endDate || null
    };

    try {
      const url = editingBanner 
        ? `${API_BASE_URL}/api/v1/banners/${editingBanner._id}` 
        : `${API_BASE_URL}/api/v1/banners`;
      
      const method = editingBanner ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(editingBanner ? 'Banner updated successfully!' : 'Banner created successfully!');
        setShowModal(false);
        fetchBanners();
      } else {
        setError(data.message || 'Something went wrong');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/banners/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setSuccess('Banner deleted successfully!');
        fetchBanners();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to delete banner');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const calculateCTR = (impressions, clicks) => {
    if (!impressions) return '0.00';
    return ((clicks / impressions) * 100).toFixed(2);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', color: 'var(--text-primary)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Banner Management</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage and schedule advertisement carousels & banners</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={fetchBanners}
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button 
            onClick={openCreateModal}
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
          >
            <Plus size={16} /> Add Banner
          </button>
        </div>
      </header>

      {/* Analytics Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(0, 122, 255, 0.1)', padding: '12px', borderRadius: '12px', color: '#007aff' }}>
            <Eye size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Total Impressions</p>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700 }}>
              {banners.reduce((sum, b) => sum + (b.impressions || 0), 0)}
            </h3>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(46, 204, 113, 0.1)', padding: '12px', borderRadius: '12px', color: '#2ecc71' }}>
            <MousePointer size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Total Clicks</p>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700 }}>
              {banners.reduce((sum, b) => sum + (b.clicks || 0), 0)}
            </h3>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(241, 196, 15, 0.1)', padding: '12px', borderRadius: '12px', color: '#f1c40f' }}>
            <Percent size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Average CTR</p>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700 }}>
              {calculateCTR(
                banners.reduce((sum, b) => sum + (b.impressions || 0), 0),
                banners.reduce((sum, b) => sum + (b.clicks || 0), 0)
              )}%
            </h3>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #ff4b4b', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <AlertCircle color="#ff4b4b" size={20} />
          <p style={{ color: '#ff4b4b' }}>{error}</p>
        </div>
      )}

      {success && (
        <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #2ecc71', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <AlertCircle color="#2ecc71" size={20} />
          <p style={{ color: '#2ecc71' }}>{success}</p>
        </div>
      )}

      {/* Banners List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading banners list...</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No banners configured yet. Click "Add Banner" to create one.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '0px', borderRadius: 'var(--radius-card)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600 }}>Image / Title</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600 }}>Schedule / Dates</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600 }}>Priority</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600 }}>Analytics (Imp / Clk / CTR)</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => (
                <tr key={banner._id} style={{ borderBottom: '1px solid var(--glass-border-light)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <img 
                      src={banner.imageUrl} 
                      alt={banner.title} 
                      style={{ width: '80px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--glass-border)' }} 
                    />
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>{banner.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {banner.description}
                      </p>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.85rem' }}>
                    {banner.startDate || banner.endDate ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {banner.startDate && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                            <Calendar size={12} /> Start: {new Date(banner.startDate).toLocaleString()}
                          </span>
                        )}
                        {banner.endDate && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                            <Calendar size={12} /> End: {new Date(banner.endDate).toLocaleString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>Always Show</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 600 }}>{banner.priority}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span 
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: banner.isActive ? 'rgba(46, 204, 113, 0.15)' : 'rgba(255, 75, 75, 0.15)',
                        color: banner.isActive ? '#2ecc71' : '#ff4b4b',
                        border: `1.5px solid ${banner.isActive ? '#2ecc71' : '#ff4b4b'}`
                      }}
                    >
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <span><strong>{banner.impressions || 0}</strong> imp</span>
                      <span><strong>{banner.clicks || 0}</strong> clk</span>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                        {calculateCTR(banner.impressions, banner.clicks)}% CTR
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        onClick={() => openEditModal(banner)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        title="Edit Banner"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(banner._id)}
                        style={{ background: 'transparent', border: 'none', color: '#ff4b4b', cursor: 'pointer' }}
                        title="Delete Banner"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Dialog */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            border: '1.5px solid var(--glass-border)'
          }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>
              {editingBanner ? 'Edit Banner' : 'Create Banner'}
            </h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Banner Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required
                  placeholder="Enter banner title"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: 'var(--radius-input)', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  required
                  placeholder="Enter banner promotion details"
                  rows={3}
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: 'var(--radius-input)', color: '#fff', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Image URL</label>
                <input 
                  type="url" 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)} 
                  required
                  placeholder="https://images.unsplash.com/... or hosted URL"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: 'var(--radius-input)', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>CTA Button Text</label>
                  <input 
                    type="text" 
                    value={ctaText} 
                    onChange={(e) => setCtaText(e.target.value)} 
                    placeholder="Learn More"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: 'var(--radius-input)', color: '#fff' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Redirect URL / Path</label>
                  <input 
                    type="text" 
                    value={redirectUrl} 
                    onChange={(e) => setRedirectUrl(e.target.value)} 
                    required
                    placeholder="/services or external link"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: 'var(--radius-input)', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Priority Order</label>
                  <input 
                    type="number" 
                    value={priority} 
                    onChange={(e) => setPriority(e.target.value)} 
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: 'var(--radius-input)', color: '#fff' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '24px' }}>
                  <input 
                    type="checkbox" 
                    id="isActive" 
                    checked={isActive} 
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isActive" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Active Banner</label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Display Start Date (Optional)</label>
                  <input 
                    type="datetime-local" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: 'var(--radius-input)', color: '#fff' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Display End Date (Optional)</label>
                  <input 
                    type="datetime-local" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: 'var(--radius-input)', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ padding: '10px 20px' }}
                >
                  {editingBanner ? 'Save Changes' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBanners;
