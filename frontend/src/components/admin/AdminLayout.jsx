import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  AlertCircle, 
  MapPin, 
  LogOut,
  Menu,
  ChevronLeft
} from 'lucide-react';

const AdminLayout = () => {
  const { logout } = useUser();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} />, exact: true },
    { name: 'Bookings', path: '/admin/bookings', icon: <Calendar size={20} /> },
    { name: 'Users', path: '/admin/users', icon: <Users size={20} /> },
    { name: 'Complaints', path: '/admin/complaints', icon: <AlertCircle size={20} /> },
    { name: 'Parking Management', path: '/admin/parking', icon: <MapPin size={20} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', paddingTop: '112px' }}> 
      {/* Sidebar */}
      <aside className="glass-panel" style={{ 
        width: isSidebarOpen ? '250px' : '70px', 
        borderRight: '1px solid var(--glass-border)',
        borderTopRightRadius: '0',
        borderBottomRightRadius: '0',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0',
        margin: '0 20px 20px 20px',
        height: 'calc(100vh - 140px)',
        position: 'sticky',
        top: '120px'
      }}>
        {/* Toggle / Menu Icon */}
        <div style={{ padding: '0 16px', marginBottom: '20px', display: 'flex', justifyContent: isSidebarOpen ? 'flex-end' : 'center' }}>
           <button 
             onClick={() => setSidebarOpen(!isSidebarOpen)} 
             style={{ 
               background: 'var(--bg-secondary)', 
               border: '1px solid var(--glass-border)', 
               color: 'var(--text-primary)', 
               cursor: 'pointer',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               width: '32px',
               height: '32px',
               borderRadius: '8px',
               transition: 'all 0.2s'
             }}
             title="Toggle Sidebar"
           >
             {isSidebarOpen ? <ChevronLeft size={18}/> : <Menu size={18}/>}
           </button>
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 12px' }}>
          {navItems.map(item => (
            <NavLink 
              key={item.name}
              to={item.path}
              end={item.exact}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '10px',
                textDecoration: 'none',
                color: isActive ? '#000' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-primary)' : 'transparent',
                fontWeight: isActive ? 700 : 600,
                transition: 'all 0.2s',
                justifyContent: isSidebarOpen ? 'flex-start' : 'center'
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.icon}
              </div>
              {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <div style={{ padding: '0 12px' }}>
          <button 
            onClick={logout}
            style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '10px',
                background: 'transparent',
                border: 'none',
                color: '#f44336',
                fontWeight: 600,
                cursor: 'pointer',
                justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(244, 67, 54, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut size={20} />
            </div>
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingRight: '20px', paddingBottom: '20px' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
