import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import VehicleServices from './pages/VehicleServices';
import { useUser } from './hooks/useUser';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import SlotLayout from './pages/SlotLayout';
import SlotBookingForm from './pages/SlotBookingForm';
import Ticket from './pages/Ticket';
import './index.css';
import { Loader2 } from 'lucide-react';

function App() {
  const { loading } = useUser();

  if (loading) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <Loader2 className="animate-spin" size={40} color="var(--accent-primary)" />
      </div>
    );
  }

  return (
    <>
      <div className="ambient-glow" />
      <div className="ambient-glow-2" />

      <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1, width: '100%' }}>
          <Routes>
            <Route path="/"            element={<LandingPage />} />
            <Route path="/services"    element={<VehicleServices />} />
            <Route path="/login"       element={<Auth />} />
            <Route path="/profile"     element={<Profile />} />
            
            {/* Redirects for clean navigation */}
            <Route path="/find"        element={<Navigate to="/slot-layout" replace />} />
            <Route path="/parking"     element={<Navigate to="/slot-layout" replace />} />
            <Route path="/booking"     element={<Navigate to="/slot-layout" replace />} />
            
            {/* Direct parking flow */}
            <Route path="/slot-layout" element={<SlotLayout />} />
            <Route path="/slot-booking" element={<SlotBookingForm />} />
            <Route path="/ticket"      element={<Ticket />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

export default App;
